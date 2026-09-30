package com.userex.hub;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class Sessions {

  public static final String COOKIE = "hub_session";

  @ConfigProperty(name = "hub.cookie-secure")
  boolean secure;

  @ConfigProperty(name = "hub.session-hours", defaultValue = "12")
  int hours;

  private final SecureRandom random = new SecureRandom();

  public String token() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public static String hash(String raw) {
    try {
      return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(
          raw.getBytes(StandardCharsets.UTF_8)
        )
      );
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  public User optional(HttpHeaders headers) {
    Cookie cookie = headers.getCookies().get(COOKIE);
    if (cookie == null || cookie.getValue().length() != 43) return null;
    HubSession session = HubSession.findById(hash(cookie.getValue()));
    return session != null &&
      session.expiresAt.isAfter(Instant.now()) &&
      session.user.active
      ? session.user
      : null;
  }

  public User require(HttpHeaders headers) {
    User u = optional(headers);
    if (u == null) throw new ApiException(
      401,
      "Entre na sua conta para continuar."
    );
    return u;
  }

  public User admin(HttpHeaders headers) {
    User u = require(headers);
    if (!u.role.equals("ADMIN")) throw new ApiException(
      403,
      "Acesso restrito a administradores."
    );
    return u;
  }

  public NewCookie cookie(String name, String value, int age) {
    return new NewCookie.Builder(name)
      .value(value)
      .path("/api")
      .httpOnly(true)
      .secure(secure)
      .sameSite(NewCookie.SameSite.LAX)
      .maxAge(age)
      .build();
  }

  @Transactional
  public NewCookie create(User user, HttpHeaders headers) {
    revoke(headers);
    HubSession.delete("expiresAt < ?1", Instant.now());
    String raw = token();
    var session = new HubSession();
    session.tokenHash = hash(raw);
    session.user = user;
    session.expiresAt = Instant.now().plusSeconds(hours * 3600L);
    session.persist();
    return cookie(COOKIE, raw, hours * 3600);
  }

  @Transactional
  public void revoke(HttpHeaders headers) {
    Cookie cookie = headers.getCookies().get(COOKIE);
    if (cookie != null) HubSession.deleteById(hash(cookie.getValue()));
  }
}
