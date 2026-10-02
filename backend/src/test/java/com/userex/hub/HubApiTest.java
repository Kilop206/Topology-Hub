package com.userex.hub;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.specification.RequestSpecification;
import jakarta.inject.Inject;
import java.util.*;
import org.junit.jupiter.api.Test;

@QuarkusTest
@io.quarkus.test.junit.TestProfile(HubTestProfile.class)
class HubApiTest {

  @Inject
  OAuthStates oauthStates;

  private RequestSpecification request() {
    return given().contentType("application/json").header("X-Hub-Request", "1");
  }

  private String register() {
    return request()
      .body(
        Map.of(
          "displayName",
          "Network author",
          "email",
          UUID.randomUUID() + "@test.local",
          "password",
          "Strong-password-123"
        )
      )
      .post("/api/auth/register")
      .then()
      .statusCode(201)
      .body("role", equalTo("USER"))
      .body("$", not(hasKey("passwordHash")))
      .extract()
      .cookie(Sessions.COOKIE);
  }

  private Map<String, Object> graph() {
    return Map.of(
      "nodes",
      3,
      "links",
      List.of(
        Map.of("from", 0, "to", 1, "delay", 5, "bandwidth", 100, "loss", 0)
      ),
      "metadata",
      Map.of("note", "preserved")
    );
  }

  private Map<String, Object> topology(String visibility) {
    return new HashMap<>(
      Map.of(
        "title",
        "Test network",
        "description",
        "A topology for tests",
        "visibility",
        visibility,
        "graph",
        graph()
      )
    );
  }

  @Test
  void registrationLoginLogoutAndRotation() {
    String email = UUID.randomUUID() + "@test.local";
    var response = request()
      .body(
        Map.of(
          "displayName",
          "Tester",
          "email",
          email,
          "password",
          "Strong-password-123"
        )
      )
      .post("/api/auth/register");
    response
      .then()
      .statusCode(201)
      .header(
        "Set-Cookie",
        allOf(containsString("HttpOnly"), containsString("SameSite=Lax"))
      );
    String first = response.cookie(Sessions.COOKIE);
    request()
      .cookie(Sessions.COOKIE, first)
      .get("/api/auth/me")
      .then()
      .statusCode(200)
      .body("email", equalTo(email));
    request()
      .body(
        Map.of(
          "displayName",
          "Duplicate",
          "email",
          email.toUpperCase(),
          "password",
          "Strong-password-123"
        )
      )
      .post("/api/auth/register")
      .then()
      .statusCode(409);
    request()
      .body(Map.of("email", email, "password", "wrong-password-123"))
      .post("/api/auth/login")
      .then()
      .statusCode(401);
    String second = request()
      .cookie(Sessions.COOKIE, first)
      .body(Map.of("email", email, "password", "Strong-password-123"))
      .post("/api/auth/login")
      .then()
      .statusCode(200)
      .extract()
      .cookie(Sessions.COOKIE);
    assertNotEquals(first, second);
    request()
      .cookie(Sessions.COOKIE, first)
      .get("/api/auth/me")
      .then()
      .statusCode(401);
    request()
      .cookie(Sessions.COOKIE, second)
      .post("/api/auth/logout")
      .then()
      .statusCode(204);
    request()
      .cookie(Sessions.COOKIE, second)
      .get("/api/auth/me")
      .then()
      .statusCode(401);
  }

  @Test
  void privateTopologiesAreIsolatedAndPublicOnesAreReadOnlyForOthers() {
    String owner = register(),
      stranger = register();
    String id = request()
      .cookie(Sessions.COOKIE, owner)
      .body(topology("PRIVATE"))
      .post("/api/topologies")
      .then()
      .statusCode(201)
      .extract()
      .path("topology.id");
    request()
      .get("/api/topologies/" + id)
      .then()
      .statusCode(404);
    request()
      .cookie(Sessions.COOKIE, stranger)
      .get("/api/topologies/" + id)
      .then()
      .statusCode(404);
    request()
      .cookie(Sessions.COOKIE, stranger)
      .get("/api/topologies/" + id + "/download")
      .then()
      .statusCode(404);
    request()
      .get("/api/topologies")
      .then()
      .statusCode(200)
      .body("items.id", not(hasItem(id)));
    var updated = topology("PUBLIC");
    updated.put("version", 0);
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(updated)
      .put("/api/topologies/" + id)
      .then()
      .statusCode(200)
      .body("topology.version", equalTo(1));
    request()
      .get("/api/topologies/" + id)
      .then()
      .statusCode(200)
      .body("graph.metadata.note", equalTo("preserved"));
    request()
      .get("/api/topologies/" + id + "/revisions")
      .then()
      .statusCode(200)
      .body("size()", equalTo(2))
      .body("[0].revision", equalTo(2))
      .body("[1].revision", equalTo(1));
    request()
      .get("/api/topologies/" + id + "/revisions/1")
      .then()
      .statusCode(200)
      .body("revision", equalTo(1))
      .body("visibility", equalTo("PRIVATE"))
      .body("graph.schema_version", equalTo("1.0"))
      .body("graph.metadata.note", equalTo("preserved"));
    request()
      .cookie(Sessions.COOKIE, stranger)
      .body(updated)
      .put("/api/topologies/" + id)
      .then()
      .statusCode(403);
    request()
      .cookie(Sessions.COOKIE, stranger)
      .delete("/api/topologies/" + id)
      .then()
      .statusCode(403);
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(updated)
      .put("/api/topologies/" + id)
      .then()
      .statusCode(409);
    request()
      .get("/api/topologies/" + id + "/download")
      .then()
      .statusCode(200)
      .header("Content-Disposition", containsString(".json"))
      .body("schema_version", equalTo("1.0"))
      .body("nodes", equalTo(3));
    request()
      .cookie(Sessions.COOKIE, owner)
      .delete("/api/topologies/" + id)
      .then()
      .statusCode(204);
    request()
      .get("/api/topologies/" + id)
      .then()
      .statusCode(404);
  }

  @Test
  void validationRejectsPrivilegeEscalationAndBrokenGraphs() {
    request()
      .body(
        Map.of(
          "displayName",
          "Intruder",
          "email",
          "intruder@test.local",
          "password",
          "Strong-password-123",
          "role",
          "ADMIN"
        )
      )
      .post("/api/auth/register")
      .then()
      .statusCode(400);
    request()
      .body(
        Map.of(
          "displayName",
          "Tester",
          "email",
          "weak@test.local",
          "password",
          "short"
        )
      )
      .post("/api/auth/register")
      .then()
      .statusCode(400);
    String owner = register();
    var input = topology("PUBLIC");
    input.put(
      "graph",
      Map.of(
        "nodes",
        3,
        "links",
        List.of(
          Map.of("from", 0, "to", 99, "delay", 5, "bandwidth", 100, "loss", 0)
        )
      )
    );
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(400);
    input.put(
      "graph",
      Map.of(
        "nodes",
        3,
        "links",
        List.of(
          Map.of("from", 0, "to", 1, "delay", -1, "bandwidth", 100, "loss", 0)
        )
      )
    );
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(400);
    request()
      .queryParam("size", 1000)
      .get("/api/topologies")
      .then()
      .statusCode(400);
    request().get("/api/topologies?scope=mine").then().statusCode(401);
  }

  @Test
  void csrfAndAdministrativeAuthorization() {
    given()
      .contentType("application/json")
      .body(
        Map.of("email", "test@test.local", "password", "Strong-password-123")
      )
      .post("/api/auth/login")
      .then()
      .statusCode(403);
    request()
      .header("Origin", "https://attacker.invalid")
      .body(
        Map.of("email", "test@test.local", "password", "Strong-password-123")
      )
      .post("/api/auth/login")
      .then()
      .statusCode(403);
    String regular = register();
    request()
      .cookie(Sessions.COOKIE, regular)
      .get("/api/admin/stats")
      .then()
      .statusCode(403);
    request()
      .cookie(Sessions.COOKIE, regular)
      .get("/api/topologies?scope=all")
      .then()
      .statusCode(403);
    request().get("/api/admin/users").then().statusCode(401);
  }

  @Test
  void adminDisablingUserImmediatelyRevokesSessionAndAuditsChange() {
    String regular = register();
    String id = request()
      .cookie(Sessions.COOKIE, regular)
      .get("/api/auth/me")
      .path("id");
    var login = request()
      .body(
        Map.of("email", "admin@test.local", "password", "Test-admin-pass-2026")
      )
      .post("/api/auth/login");
    login.then().statusCode(200);
    String admin = login.cookie(Sessions.COOKIE);
    String adminId = login.path("id");
    request()
      .cookie(Sessions.COOKIE, admin)
      .body(Map.of("role", "USER", "active", false))
      .patch("/api/admin/users/" + adminId)
      .then()
      .statusCode(409);
    request()
      .cookie(Sessions.COOKIE, admin)
      .body(Map.of("role", "USER", "active", false))
      .patch("/api/admin/users/" + id)
      .then()
      .statusCode(200)
      .body("active", equalTo(false));
    request()
      .cookie(Sessions.COOKIE, regular)
      .get("/api/auth/me")
      .then()
      .statusCode(401);
    request()
      .cookie(Sessions.COOKIE, admin)
      .get("/api/admin/audit")
      .then()
      .statusCode(200)
      .body("action", hasItem("user.access.update"));
  }

  @Test
  void oauthProvidersAreDisabledWithoutCredentialsAndStateCannotBeReplayed() {
    request()
      .get("/api/auth/oauth/providers")
      .then()
      .statusCode(200)
      .body("google", equalTo(false))
      .body("github", equalTo(false));
    request()
      .redirects()
      .follow(false)
      .get("/api/auth/oauth/github")
      .then()
      .statusCode(503);
    var flow = oauthStates.create("github");
    assertThrows(ApiException.class, () ->
      oauthStates.consume("google", flow.state(), flow.browser())
    );
    assertThrows(ApiException.class, () ->
      oauthStates.consume("github", flow.state(), "x".repeat(43))
    );
    assertEquals(
      flow.verifier(),
      oauthStates.consume("github", flow.state(), flow.browser())
    );
    assertThrows(ApiException.class, () ->
      oauthStates.consume("github", flow.state(), flow.browser())
    );
  }


  @Test
  void typedDiscoveryTopologiesPreserveStableNodeIds() {
    String owner = register();
    var graph = Map.of(
      "schema_version",
      "1.0",
      "name",
      "Discovered LAN",
      "nodes",
      List.of(
        Map.of(
          "id", 10,
          "external_id", "host:workstation",
          "label", "Workstation",
          "type", "computer",
          "addresses", List.of("192.0.2.10"),
          "evidence", "local_interface"
        ),
        Map.of(
          "id", 30,
          "external_id", "device:gateway",
          "label", "Gateway",
          "type", "router",
          "addresses", List.of("192.0.2.1"),
          "evidence", "default_route"
        )
      ),
      "links",
      List.of(
        Map.of("from", 10, "to", 30, "delay", 1, "bandwidth", 100, "loss", 0)
      )
    );
    var input = new HashMap<String, Object>();
    input.put("title", "Discovery import");
    input.put("description", "Typed KNS topology");
    input.put("visibility", "PRIVATE");
    input.put("graph", graph);

    String id = request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(201)
      .body("topology.nodeCount", equalTo(2))
      .body("graph.schema_version", equalTo("1.0"))
      .body("graph.nodes[0].id", equalTo(10))
      .body("graph.nodes[1].id", equalTo(30))
      .extract()
      .path("topology.id");

    request()
      .cookie(Sessions.COOKIE, owner)
      .get("/api/topologies/" + id + "/download")
      .then()
      .statusCode(200)
      .body("nodes[0].external_id", equalTo("host:workstation"))
      .body("nodes[1].type", equalTo("router"));

    var broken = new HashMap<>(input);
    broken.put(
      "graph",
      Map.of(
        "schema_version", "1.0",
        "nodes", graph.get("nodes"),
        "links", List.of(
          Map.of("from", 10, "to", 20, "delay", 1, "bandwidth", 100, "loss", 0)
        )
      )
    );
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(broken)
      .post("/api/topologies")
      .then()
      .statusCode(400)
      .body("path", equalTo("links[0].to"));
  }

  @Test
  void searchAndPaginationAreBounded() {
    String owner = register();
    var input = topology("PRIVATE");
    input.put("title", "Unique-" + UUID.randomUUID());
    String id = request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(201)
      .extract()
      .path("topology.id");
    request()
      .cookie(Sessions.COOKIE, owner)
      .queryParam("scope", "mine")
      .queryParam("q", input.get("title"))
      .queryParam("size", 1)
      .get("/api/topologies")
      .then()
      .statusCode(200)
      .body("total", equalTo(1))
      .body("items[0].id", equalTo(id));
    request()
      .queryParam("q", "%' OR 1=1 --")
      .get("/api/topologies")
      .then()
      .statusCode(200)
      .body("total", equalTo(0));
  }

  @Test
  void metricsUseConfiguredLinksAndEmptyGraphsHaveNoInventedMeasurements() {
    String owner = register();
    var input = topology("PRIVATE");
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(201)
      .body("topology.metrics.meanLinkDelayMs", equalTo(5f))
      .body("topology.metrics.minimumBandwidthMbps", equalTo(100f))
      .body("topology.metrics.maximumLossPercent", equalTo(0f))
      .body("topology.preview.links[0].to", equalTo(1));
    input.put("graph", Map.of("nodes", 1, "links", List.of()));
    request()
      .cookie(Sessions.COOKIE, owner)
      .body(input)
      .post("/api/topologies")
      .then()
      .statusCode(201)
      .body("topology.metrics.meanLinkDelayMs", nullValue())
      .body("topology.metrics.minimumBandwidthMbps", nullValue());
  }
}
