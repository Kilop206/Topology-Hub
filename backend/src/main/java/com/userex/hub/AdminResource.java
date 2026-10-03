package com.userex.hub;

import io.quarkus.panache.common.Page;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.util.*;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Blocking
public class AdminResource {

  @Inject
  Sessions sessions;

  @Context
  HttpHeaders headers;

  public record Update(
    @NotNull @Pattern(regexp = "ADMIN|USER") String role,
    @NotNull Boolean active,
    @Pattern(regexp = "FREE|PRO|INTERNAL") String plan
  ) {}

  @GET
  @Path("/stats")
  public Map<String, Long> stats() {
    sessions.admin(headers);
    return Map.of(
      "users",
      User.count(),
      "topologies",
      Topology.count(),
      "publicTopologies",
      Topology.count("visibility", "PUBLIC"),
      "activeUsers",
      User.count("active", true)
    );
  }

  @GET
  @Path("/users")
  public Map<String, Object> users(
    @QueryParam("page") @DefaultValue("0") int page
  ) {
    sessions.admin(headers);
    if (page < 0 || page > 100000) throw new ApiException(
      400,
      "Página inválida."
    );
    return Map.of(
      "items",
      User.<User>find("order by createdAt desc,id")
        .page(Page.of(page, 20))
        .list()
        .stream()
        .map(User::view)
        .toList(),
      "total",
      User.count(),
      "page",
      page,
      "size",
      20
    );
  }

  @PATCH
  @Path("/users/{id}")
  @Transactional
  public User.View update(@PathParam("id") UUID id, @Valid Update input) {
    User actor = sessions.admin(headers);
    if (actor.id.equals(id)) throw new ApiException(
      409,
      "Você não pode alterar o próprio acesso administrativo."
    );
    // Serialize administrator changes so concurrent demotions cannot remove every administrator.
    var admins = User.<User>find("role = 'ADMIN' and active = true order by id")
      .withLock(LockModeType.PESSIMISTIC_WRITE)
      .list();
    User user = User.findById(id);
    if (user == null) throw new ApiException(404, "Usuário não encontrado.");
    if (
      user.active &&
      user.role.equals("ADMIN") &&
      (!input.active() || !input.role().equals("ADMIN")) &&
      admins.size() <= 1
    ) throw new ApiException(409, "Mantenha ao menos um administrador ativo.");
    boolean accessChanged =
      !user.role.equals(input.role()) || user.active != input.active();
    boolean planChanged =
      input.plan() != null && !user.plan.equals(input.plan());

    user.role = input.role();
    user.active = input.active();
    if (input.plan() != null) user.plan = input.plan();

    if (accessChanged) {
      HubSession.delete("user.id", id);
      AuditEvent.record(actor, "user.access.update", id);
    }
    if (planChanged) {
      AuditEvent.record(actor, "user.plan.update", id);
    }
    return user.view();
  }

  @GET
  @Path("/audit")
  public List<AuditEvent> audit() {
    sessions.admin(headers);
    return AuditEvent.find("order by createdAt desc,id").page(0, 50).list();
  }
}
