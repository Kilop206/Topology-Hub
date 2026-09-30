package com.userex.hub;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import java.time.Instant;

@ApplicationScoped
public class OAuthStates {

  @Inject
  Sessions sessions;

  public record Flow(String state, String browser, String verifier) {}

  @Transactional
  public Flow create(String provider) {
    OAuthState.delete("expiresAt < ?1", Instant.now());
    var flow = new Flow(sessions.token(), sessions.token(), sessions.token());
    var row = new OAuthState();
    row.stateHash = Sessions.hash(flow.state());
    row.browserHash = Sessions.hash(flow.browser());
    row.verifier = flow.verifier();
    row.provider = provider;
    row.expiresAt = Instant.now().plusSeconds(600);
    row.persist();
    return flow;
  }

  @Transactional(Transactional.TxType.REQUIRES_NEW)
  public String consume(String provider, String state, String browser) {
    if (
      state == null ||
      browser == null ||
      state.length() != 43 ||
      browser.length() != 43
    ) throw new ApiException(400, "Login social expirado ou inválido.");
    OAuthState row = OAuthState.findById(
      Sessions.hash(state),
      LockModeType.PESSIMISTIC_WRITE
    );
    if (
      row == null ||
      !row.provider.equals(provider) ||
      !row.browserHash.equals(Sessions.hash(browser)) ||
      row.expiresAt.isBefore(Instant.now())
    ) throw new ApiException(400, "Login social expirado ou inválido.");
    String verifier = row.verifier;
    row.delete();
    return verifier;
  }
}
