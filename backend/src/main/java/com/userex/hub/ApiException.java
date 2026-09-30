package com.userex.hub;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.Map;

public class ApiException extends WebApplicationException {

  public ApiException(int status, String message) {
    super(Response.status(status).entity(Map.of("message", message)).build());
  }

  public ApiException(int status, String message, String path) {
    super(
      Response.status(status)
        .entity(Map.of("message", message, "path", path))
        .build()
    );
  }
}
