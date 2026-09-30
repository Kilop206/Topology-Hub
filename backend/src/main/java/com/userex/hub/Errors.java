package com.userex.hub;

import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.*;
import java.util.Map;

@Provider
public class Errors implements ExceptionMapper<OptimisticLockException> {

  public Response toResponse(OptimisticLockException error) {
    return Response.status(409)
      .entity(
        Map.of(
          "message",
          "Esta topologia foi alterada. Recarregue antes de salvar."
        )
      )
      .build();
  }
}
