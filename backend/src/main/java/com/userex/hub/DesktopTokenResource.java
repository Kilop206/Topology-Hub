package com.userex.hub;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Path("/api/auth/tokens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DesktopTokenResource {

  @Inject
  Sessions sessions;

  @Context
  HttpHeaders headers;

  public record CreateInput(@NotBlank @Size(max = 80) String name) {}

  public record TokenView(UUID id, String name, Instant createdAt, Instant revokedAt) {}

  public record CreatedToken(UUID id, String name, Instant createdAt, String token) {}

  @GET
  public List<TokenView> list() {
    User user = sessions.requireBrowser(headers);
    return DesktopToken.<DesktopToken>list("user = ?1 order by createdAt desc", user)
      .stream()
      .map(token -> new TokenView(token.id, token.name, token.createdAt, token.revokedAt))
      .toList();
  }

  @POST
  @Transactional
  public Response create(@Valid CreateInput input) {
    User user = sessions.requireBrowser(headers);
    String raw = "knsh_" + sessions.token();

    var token = new DesktopToken();
    token.tokenHash = Sessions.hash(raw);
    token.user = user;
    token.name = input.name().strip();
    token.persistAndFlush();

    AuditEvent.record(user, "desktop_token.create", token.id);
    return Response.status(201)
      .entity(new CreatedToken(token.id, token.name, token.createdAt, raw))
      .build();
  }

  @DELETE
  @Path("/{id}")
  @Transactional
  public Response revoke(@PathParam("id") UUID id) {
    User user = sessions.requireBrowser(headers);
    DesktopToken token = DesktopToken.findById(id);
    if (token == null || !token.user.id.equals(user.id)) {
      throw new ApiException(404, "Token não encontrado.");
    }
    if (token.revokedAt == null) {
      token.revokedAt = Instant.now();
      AuditEvent.record(user, "desktop_token.revoke", token.id);
    }
    return Response.noContent().build();
  }
}
