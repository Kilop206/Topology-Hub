package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "hub_session")
public class HubSession extends PanacheEntityBase {

  @Id
  @Column(name = "token_hash", length = 64)
  public String tokenHash;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id")
  public User user;

  @Column(name = "expires_at", nullable = false)
  public Instant expiresAt;
}
