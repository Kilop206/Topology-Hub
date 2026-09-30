package com.userex.hub;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.HashMap;

@ApplicationScoped
public class LoginThrottle {

  private record Attempt(long since, int count) {}

  private final HashMap<String, Attempt> attempts = new HashMap<>();

  public synchronized void check(String key) {
    long now = Instant.now().getEpochSecond();
    attempts.entrySet().removeIf(e -> now - e.getValue().since >= 60);
    var a = attempts.get(key);
    if (
      (a != null && a.count >= 10) || (a == null && attempts.size() >= 10000)
    ) throw new ApiException(429, "Muitas tentativas. Aguarde um minuto.");
    attempts.put(
      key,
      new Attempt(a == null ? now : a.since, a == null ? 1 : a.count + 1)
    );
  }
}
