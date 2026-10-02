package com.userex.hub;

import com.fasterxml.jackson.databind.*;
import io.quarkus.panache.common.Page;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.time.Instant;
import java.util.*;

@Path("/api/topologies")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Blocking
public class TopologyResource {

  @Inject
  Sessions sessions;

  @Inject
  ObjectMapper mapper;

  @Context
  HttpHeaders headers;

  public record Input(
    @NotBlank @Size(max = 120) String title,
    @NotNull @Size(max = 4000) String description,
    @NotNull @Pattern(regexp = "PUBLIC|PRIVATE") String visibility,
    @NotNull JsonNode graph,
    Long version
  ) {}

  public record Summary(
    UUID id,
    String title,
    String description,
    String visibility,
    int nodeCount,
    int linkCount,
    UUID ownerId,
    String ownerName,
    Instant createdAt,
    Instant updatedAt,
    long version,
    Metrics metrics,
    JsonNode preview
  ) {}

  public record Metrics(
    Double meanLinkDelayMs,
    Double minimumBandwidthMbps,
    Double maximumLossPercent
  ) {}

  public record Detail(Summary topology, JsonNode graph) {}

  public record Listing(List<Summary> items, long total, int page, int size) {}

  Summary summary(Topology t) {
    try {
      JsonNode graph = mapper.readTree(t.graph);
      var links = graph.path("links");
      double delay = 0,
        bandwidth = Double.MAX_VALUE,
        loss = 0;
      for (var link : links) {
        delay += link.path("delay").asDouble() / Math.max(1, links.size());
        bandwidth = Math.min(bandwidth, link.path("bandwidth").asDouble());
        loss = Math.max(loss, link.path("loss").asDouble());
      }
      Metrics metrics = links.isEmpty()
        ? new Metrics(null, null, null)
        : new Metrics(delay, bandwidth, loss * 100);
      var preview = mapper.createObjectNode();
      preview.put("nodes", t.nodeCount);
      var edges = preview.putArray("links");
      for (int i = 0; i < Math.min(100, links.size()); i++) edges.add(
        links.get(i)
      );
      return new Summary(
        t.id,
        t.title,
        t.description,
        t.visibility,
        t.nodeCount,
        t.linkCount,
        t.owner.id,
        t.owner.displayName,
        t.createdAt,
        t.updatedAt,
        t.version,
        metrics,
        preview
      );
    } catch (java.io.IOException e) {
      throw new IllegalStateException(e);
    }
  }

  private Topology accessible(UUID id) {
    Topology t = Topology.findById(id);
    User u = sessions.optional(headers);
    if (
      t == null ||
      (!t.visibility.equals("PUBLIC") &&
        (u == null || (!u.id.equals(t.owner.id) && !u.role.equals("ADMIN"))))
    ) throw new ApiException(404, "Topologia não encontrada.");
    return t;
  }

  private void editable(Topology t) {
    User u = sessions.require(headers);
    if (
      !u.id.equals(t.owner.id) && !u.role.equals("ADMIN")
    ) throw new ApiException(403, "Você não pode alterar esta topologia.");
  }

  @GET
  public Listing list(
    @QueryParam("q") @DefaultValue("") String q,
    @QueryParam("scope") @DefaultValue("public") String scope,
    @QueryParam("page") @DefaultValue("0") int page,
    @QueryParam("size") @DefaultValue("12") int size
  ) {
    if (
      page < 0 || page > 100000 || size < 1 || size > 50 || q.length() > 120
    ) throw new ApiException(400, "Paginação ou busca inválida.");
    String where;
    Map<String, Object> params = new HashMap<>();
    switch (scope) {
      case "public" -> where = "visibility = 'PUBLIC'";
      case "mine" -> {
        where = "owner.id = :owner";
        params.put("owner", sessions.require(headers).id);
      }
      case "all" -> {
        sessions.admin(headers);
        where = "1=1";
      }
      default -> throw new ApiException(400, "Escopo inválido.");
    }
    if (!q.isBlank()) {
      where +=
        " and (locate(:q, lower(title)) > 0 or locate(:q, lower(description)) > 0)";
      params.put("q", q.strip().toLowerCase(Locale.ROOT));
    }
    var query = Topology.<Topology>find(
      where + " order by updatedAt desc, id",
      params
    );
    return new Listing(
      query
        .page(Page.of(page, size))
        .list()
        .stream()
        .map(this::summary)
        .toList(),
      query.count(),
      page,
      size
    );
  }

  @GET
  @Path("/{id}")
  public Detail get(@PathParam("id") UUID id) {
    return detail(accessible(id));
  }

  Detail detail(Topology t) {
    try {
      return new Detail(summary(t), mapper.readTree(t.graph));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @POST
  @Transactional
  public Response create(@Valid Input input) {
    User owner = sessions.require(headers);
    Graphs.validate(input.graph());
    var topology = new Topology();
    topology.owner = owner;
    apply(topology, input);
    topology.persistAndFlush();
    AuditEvent.record(owner, "topology.create", topology.id);
    return Response.status(201).entity(detail(topology)).build();
  }

  @PUT
  @Path("/{id}")
  @Transactional
  public Detail update(@PathParam("id") UUID id, @Valid Input input) {
    Topology t = accessible(id);
    editable(t);
    if (
      input.version() == null || input.version() != t.version
    ) throw new ApiException(
      409,
      "Esta topologia mudou. Recarregue antes de salvar."
    );
    Graphs.validate(input.graph());
    apply(t, input);
    t.flush();
    AuditEvent.record(sessions.require(headers), "topology.update", id);
    return detail(t);
  }

  @DELETE
  @Path("/{id}")
  @Transactional
  public Response delete(@PathParam("id") UUID id) {
    Topology t = accessible(id);
    editable(t);
    AuditEvent.record(sessions.require(headers), "topology.delete", id);
    t.delete();
    return Response.noContent().build();
  }

  @GET
  @Path("/{id}/download")
  public Response download(@PathParam("id") UUID id) {
    Topology t = accessible(id);
    return Response.ok(t.graph)
      .header(
        "Content-Disposition",
        "attachment; filename=\"topology-" + id + ".json\""
      )
      .build();
  }

  private void apply(Topology t, Input input) {
    t.title = input.title().strip();
    t.description = input.description().strip();
    t.visibility = input.visibility();

    var graph = input.graph().deepCopy();
    if (graph instanceof com.fasterxml.jackson.databind.node.ObjectNode object) {
      object.put("schema_version", "1.0");
    }

    t.graph = graph.toString();
    t.nodeCount = graph.path("nodes").asInt();
    t.linkCount = graph.path("links").size();
    t.updatedAt = Instant.now();
  }
}
