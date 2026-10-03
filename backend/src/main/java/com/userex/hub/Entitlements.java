package com.userex.hub;

public final class Entitlements {

  private Entitlements() {}

  public static boolean validPlan(String value) {
    return "FREE".equals(value) || "PRO".equals(value) || "INTERNAL".equals(value);
  }

  public static Decision forUser(User user) {
    return switch (user.plan) {
      case "FREE" -> new Decision("user:" + user.id, "FREE", false, 0);
      case "PRO" -> new Decision("user:" + user.id, "PRO", true, 100);
      case "INTERNAL" -> new Decision("user:" + user.id, "INTERNAL", true, 0);
      default -> throw new IllegalStateException("Unsupported user plan: " + user.plan);
    };
  }

  public record Decision(
    String subject,
    String plan,
    boolean intelligenceEnabled,
    int dailyIntelligenceQuota
  ) {}
}
