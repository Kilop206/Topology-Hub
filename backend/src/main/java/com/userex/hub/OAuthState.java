package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "oauth_state")
public class OAuthState extends PanacheEntityBase {

  @Id
  @Column(name = "state_hash", length = 64)
  public String stateHash;

  @Column(name = "browser_hash", nullable = false, length = 64)
  public String browserHash;

  @Column(nullable = false, length = 20)
  public String provider;

  @Column(nullable = false, length = 100)
  public String verifier;

  @Column(name = "expires_at", nullable = false)
  public Instant expiresAt;
}
