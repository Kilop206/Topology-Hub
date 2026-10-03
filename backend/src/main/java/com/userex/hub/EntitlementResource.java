package com.userex.hub;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/api/auth/entitlements")
@Produces(MediaType.APPLICATION_JSON)
public class EntitlementResource {

  @Inject
  Sessions sessions;

  @Context
  HttpHeaders headers;

  @GET
  public Entitlements.Decision current() {
    return Entitlements.forUser(sessions.require(headers));
  }
}
