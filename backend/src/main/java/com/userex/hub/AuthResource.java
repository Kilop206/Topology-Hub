package com.userex.hub;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Blocking
public class AuthResource {

  private final String dummyHash = BcryptUtil.bcryptHash(
    "unavailable-account-password"
  );

  @Inject
  Sessions sessions;

  @Inject
  LoginThrottle throttle;

  @Context
  HttpHeaders headers;

  public record Register(
    @NotBlank @Size(max = 80) String displayName,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 12, max = 72) String password
  ) {}

  public record Login(
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(max = 72) String password
  ) {}

  static String normalize(String email) {
    return email.strip().toLowerCase(Locale.ROOT);
  }

  static void password(String password) {
    if (
      password.getBytes(StandardCharsets.UTF_8).length > 72
    ) throw new ApiException(400, "A senha deve ter no máximo 72 bytes.");
  }

  @POST
  @Path("/register")
  @Transactional
  public Response register(@Valid Register input) {
    String email = normalize(input.email());
    throttle.check("register:" + email);
    password(input.password());
    if (User.byEmail(email) != null) throw new ApiException(
      409,
      "Este e-mail já está cadastrado."
    );
    var user = new User();
    user.email = email;
    user.displayName = input.displayName().strip();
    user.passwordHash = BcryptUtil.bcryptHash(input.password());
    try {
      user.persistAndFlush();
    } catch (org.hibernate.exception.ConstraintViolationException e) {
      throw new ApiException(409, "Este e-mail já está cadastrado.");
    }
    return Response.status(201)
      .entity(user.view())
      .cookie(sessions.create(user, headers))
      .build();
  }

  @POST
  @Path("/login")
  @Transactional
  public Response login(@Valid Login input) {
    String email = normalize(input.email());
    throttle.check("login:" + email);
    password(input.password());
    User user = User.byEmail(email);
    // Also do a password hash for unknown identities to avoid a fast enumeration path.
    boolean matches =
      user != null && user.passwordHash != null
        ? BcryptUtil.matches(input.password(), user.passwordHash)
        : BcryptUtil.matches(input.password(), dummyHash);
    if (
      user == null || !matches || !user.active || user.passwordHash == null
    ) throw new ApiException(401, "E-mail ou senha inválidos.");
    return Response.ok(user.view())
      .cookie(sessions.create(user, headers))
      .build();
  }

  @GET
  @Path("/me")
  public User.View me() {
    return sessions.require(headers).view();
  }

  @POST
  @Path("/logout")
  @Transactional
  public Response logout() {
    sessions.revoke(headers);
    return Response.noContent()
      .cookie(sessions.cookie(Sessions.COOKIE, "", 0))
      .build();
  }
}
