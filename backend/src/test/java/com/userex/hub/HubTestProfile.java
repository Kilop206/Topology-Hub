package com.userex.hub;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.Map;

/** Isolate tests from developer .env credentials and enabled OAuth providers. */
public class HubTestProfile implements QuarkusTestProfile {

  @Override
  public Map<String, String> getConfigOverrides() {
    return Map.of(
      "hub.admin-email",
      "admin@test.local",
      "hub.admin-password",
      "Test-admin-pass-2026",
      "hub.cookie-secure",
      "false",
      "hub.oauth.google.client-id",
      "",
      "hub.oauth.google.client-secret",
      "",
      "hub.oauth.github.client-id",
      "",
      "hub.oauth.github.client-secret",
      ""
    );
  }
}
