package com.userex.hub;

import com.fasterxml.jackson.databind.*;
import io.smallrye.common.annotation.Blocking;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.net.*;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.eclipse.microprofile.config.ConfigProvider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/api/auth/oauth")
@Produces(MediaType.APPLICATION_JSON)
@Blocking
public class OAuthResource {

  @Inject
  Sessions sessions;

  @Inject
  OAuthStates states;

  @Inject
  ObjectMapper mapper;

  @Context
  HttpHeaders headers;

  @ConfigProperty(name = "hub.web-origin")
  String webOrigin;

  private final HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

  private record Provider(
    String authorize,
    String token,
    String info,
    String scope
  ) {}

  private Provider provider(String name) {
    return switch (name) {
      case "google" -> new Provider(
        "https://accounts.google.com/o/oauth2/v2/auth",
        "https://oauth2.googleapis.com/token",
        "https://openidconnect.googleapis.com/v1/userinfo",
        "openid email profile"
      );
      case "github" -> new Provider(
        "https://github.com/login/oauth/authorize",
        "https://github.com/login/oauth/access_token",
        "https://api.github.com/user",
        "read:user user:email"
      );
      default -> throw new ApiException(404, "Provedor não encontrado.");
    };
  }

  private String config(String name, String key) {
    return ConfigProvider.getConfig()
      .getOptionalValue("hub.oauth." + name + "." + key, String.class)
      .orElse("");
  }

  private boolean enabled(String name) {
    return (
      !config(name, "client-id").isBlank() &&
      !config(name, "client-secret").isBlank()
    );
  }

  private String callback(String name) {
    return webOrigin + "/api/auth/oauth/" + name + "/callback";
  }

  private String form(Map<String, String> data) {
    return data
      .entrySet()
      .stream()
      .map(
        e ->
          URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) +
          "=" +
          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8)
      )
      .collect(java.util.stream.Collectors.joining("&"));
  }

  @GET
  @Path("/providers")
  public Map<String, Boolean> providers() {
    return Map.of("google", enabled("google"), "github", enabled("github"));
  }

  @GET
  @Path("/{name}")
  public Response start(@PathParam("name") String name) {
    Provider p = provider(name);
    if (!enabled(name)) throw new ApiException(
      503,
      "Login social ainda não configurado."
    );
    var flow = states.create(name);
    String challenge = Base64.getUrlEncoder()
      .withoutPadding()
      .encodeToString(HexFormat.of().parseHex(Sessions.hash(flow.verifier())));
    String query = form(
      Map.of(
        "client_id",
        config(name, "client-id"),
        "redirect_uri",
        callback(name),
        "scope",
        p.scope(),
        "response_type",
        "code",
        "state",
        flow.state(),
        "code_challenge",
        challenge,
        "code_challenge_method",
        "S256"
      )
    );
    return Response.seeOther(URI.create(p.authorize() + "?" + query))
      .cookie(sessions.cookie("hub_oauth", flow.browser(), 600))
      .build();
  }

  @GET
  @Path("/{name}/callback")
  @Transactional
  public Response callback(
    @PathParam("name") String name,
    @QueryParam("code") String code,
    @QueryParam("state") String state
  ) {
    Provider p = provider(name);
    try {
      if (!enabled(name)) throw new ApiException(503, "Provedor indisponível.");
      Cookie browser = headers.getCookies().get("hub_oauth");
      String verifier = states.consume(
        name,
        state,
        browser == null ? null : browser.getValue()
      );
      if (
        code == null || code.isBlank() || code.length() > 2048
      ) throw new ApiException(400, "Autorização cancelada.");
      var tokenRequest = HttpRequest.newBuilder(URI.create(p.token()))
        .timeout(Duration.ofSeconds(15))
        .header("Accept", "application/json")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .POST(
          HttpRequest.BodyPublishers.ofString(
            form(
              Map.of(
                "client_id",
                config(name, "client-id"),
                "client_secret",
                config(name, "client-secret"),
                "code",
                code,
                "redirect_uri",
                callback(name),
                "grant_type",
                "authorization_code",
                "code_verifier",
                verifier
              )
            )
          )
        )
        .build();
      JsonNode token = send(tokenRequest);
      String access = token.path("access_token").asText();
      if (access.isBlank()) throw new ApiException(
        401,
        "Falha na autorização social."
      );
      JsonNode profile = send(authorized(p.info(), access));
      String subject = name.equals("google")
        ? profile.path("sub").asText()
        : profile.path("id").asText();
      String email;
      if (name.equals("google")) {
        if (!profile.path("email_verified").asBoolean()) throw new ApiException(
          401,
          "Verifique seu e-mail no provedor."
        );
        email = profile.path("email").asText();
      } else {
        JsonNode emails = send(
          authorized("https://api.github.com/user/emails", access)
        );
        email = "";
        for (JsonNode item : emails)
          if (
            item.path("verified").asBoolean() &&
            item.path("primary").asBoolean()
          ) {
            email = item.path("email").asText();
            break;
          }
      }
      if (
        subject.isBlank() ||
        subject.length() > 255 ||
        !email.contains("@") ||
        email.length() > 254
      ) throw new ApiException(
        401,
        "O provedor não informou um e-mail verificado."
      );
      User user = User.find(
        "provider = ?1 and providerSubject = ?2",
        name,
        subject
      ).firstResult();
      if (user == null) {
        if (User.byEmail(AuthResource.normalize(email)) != null) return failed(
          "email_in_use"
        );
        user = new User();
        user.email = AuthResource.normalize(email);
        user.provider = name;
        user.providerSubject = subject;
        String display = profile.path("name").asText("");
        if (display.isBlank()) display = profile
          .path("login")
          .asText("Usuário");
        user.displayName = display.substring(0, Math.min(display.length(), 80));
        user.persistAndFlush();
      }
      if (!user.active) return failed("account_disabled");
      return Response.seeOther(URI.create(webOrigin + "/"))
        .cookie(
          sessions.create(user, headers),
          sessions.cookie("hub_oauth", "", 0)
        )
        .build();
    } catch (ApiException e) {
      return failed("oauth_failed");
    }
  }

  private Response failed(String code) {
    return Response.seeOther(URI.create(webOrigin + "/login?error=" + code))
      .cookie(sessions.cookie("hub_oauth", "", 0))
      .build();
  }

  private HttpRequest authorized(String url, String token) {
    return HttpRequest.newBuilder(URI.create(url))
      .timeout(Duration.ofSeconds(15))
      .header("Accept", "application/json")
      .header("User-Agent", "Topology-Hub")
      .header("Authorization", "Bearer " + token)
      .GET()
      .build();
  }

  private JsonNode send(HttpRequest request) {
    try {
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) throw new ApiException(
        502,
        "Provedor indisponível."
      );
      return mapper.readTree(response.body());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(502, "Login interrompido.");
    } catch (java.io.IOException e) {
      throw new ApiException(502, "Provedor indisponível.");
    }
  }
}
