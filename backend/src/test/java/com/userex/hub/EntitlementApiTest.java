package com.userex.hub;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.startsWith;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.specification.RequestSpecification;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusTest
@io.quarkus.test.junit.TestProfile(HubTestProfile.class)
class EntitlementApiTest {

  private RequestSpecification request() {
    return given().contentType("application/json").header("X-Hub-Request", "1");
  }

  @Test
  void desktopTokenCarriesCurrentIntelligenceEntitlement() {
    String email = UUID.randomUUID() + "@test.local";
    String browser = request()
      .body(Map.of(
        "displayName", "Entitlement user",
        "email", email,
        "password", "Strong-password-123"
      ))
      .post("/api/auth/register")
      .then()
      .statusCode(201)
      .body("plan", equalTo("FREE"))
      .extract()
      .cookie(Sessions.COOKIE);

    String userId = request()
      .cookie(Sessions.COOKIE, browser)
      .get("/api/auth/me")
      .then()
      .statusCode(200)
      .extract()
      .path("id");

    var created = request()
      .cookie(Sessions.COOKIE, browser)
      .body(Map.of("name", "KNS intelligence"))
      .post("/api/auth/tokens");
    created.then().statusCode(201).body("token", startsWith("knsh_"));
    String token = created.path("token");
    String tokenId = created.path("id");

    given()
      .header("Authorization", "Bearer " + token)
      .get("/api/auth/entitlements")
      .then()
      .statusCode(200)
      .body("subject", equalTo("user:" + userId))
      .body("plan", equalTo("FREE"))
      .body("intelligenceEnabled", equalTo(false))
      .body("dailyIntelligenceQuota", equalTo(0));

    String admin = request()
      .body(Map.of(
        "email", "admin@test.local",
        "password", "Test-admin-pass-2026"
      ))
      .post("/api/auth/login")
      .then()
      .statusCode(200)
      .extract()
      .cookie(Sessions.COOKIE);

    request()
      .cookie(Sessions.COOKIE, admin)
      .body(Map.of("role", "USER", "active", true, "plan", "PRO"))
      .patch("/api/admin/users/" + userId)
      .then()
      .statusCode(200)
      .body("plan", equalTo("PRO"));

    given()
      .header("Authorization", "Bearer " + token)
      .get("/api/auth/entitlements")
      .then()
      .statusCode(200)
      .body("plan", equalTo("PRO"))
      .body("intelligenceEnabled", equalTo(true))
      .body("dailyIntelligenceQuota", equalTo(100));

    request()
      .cookie(Sessions.COOKIE, browser)
      .delete("/api/auth/tokens/" + tokenId)
      .then()
      .statusCode(204);

    given()
      .header("Authorization", "Bearer " + token)
      .get("/api/auth/entitlements")
      .then()
      .statusCode(401);
  }
}
