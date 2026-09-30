package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hub_user")
public class User extends PanacheEntityBase {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(nullable = false, unique = true, length = 254)
  public String email;

  @Column(name = "display_name", nullable = false, length = 80)
  public String displayName;

  @Column(name = "password_hash", length = 100)
  public String passwordHash;

  @Column(nullable = false, length = 10)
  public String role = "USER";

  @Column(nullable = false)
  public boolean active = true;

  @Column(length = 20)
  public String provider;

  @Column(name = "provider_subject", length = 255)
  public String providerSubject;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();

  public static User byEmail(String email) {
    return find("email", email).firstResult();
  }

  public View view() {
    return new View(id, email, displayName, role, active, createdAt);
  }

  public record View(
    UUID id,
    String email,
    String displayName,
    String role,
    boolean active,
    Instant createdAt
  ) {}
}
