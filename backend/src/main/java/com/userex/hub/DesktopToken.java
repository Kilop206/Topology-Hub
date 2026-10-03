package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "desktop_token")
public class DesktopToken extends PanacheEntityBase {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(name = "token_hash", nullable = false, unique = true, length = 64)
  public String tokenHash;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id")
  public User user;

  @Column(nullable = false, length = 80)
  public String name;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "revoked_at")
  public Instant revokedAt;
}
