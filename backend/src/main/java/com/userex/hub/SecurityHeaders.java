package com.userex.hub;

import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
public class SecurityHeaders
  implements ContainerRequestFilter, ContainerResponseFilter
{

  @ConfigProperty(name = "hub.web-origin")
  String origin;

  public void filter(ContainerRequestContext request) {
    if (
      !java.util.Set.of("GET", "HEAD", "OPTIONS").contains(request.getMethod())
    ) {
      String source = request.getHeaderString("Origin");
      if (
        !"1".equals(request.getHeaderString("X-Hub-Request")) ||
        (source != null && !origin.equals(source))
      ) throw new ApiException(403, "Origem da requisição não autorizada.");
    }
  }

  public void filter(
    ContainerRequestContext request,
    ContainerResponseContext response
  ) {
    response.getHeaders().putSingle("Cache-Control", "no-store");
    response.getHeaders().putSingle("X-Content-Type-Options", "nosniff");
    response.getHeaders().putSingle("Referrer-Policy", "no-referrer");
  }
}
