package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_event")
public class AuditEvent extends PanacheEntityBase {

  @Id
  public UUID id = UUID.randomUUID();

  @Column(name = "actor_id", nullable = false)
  public UUID actorId;

  @Column(nullable = false, length = 80)
  public String action;

  @Column(name = "target_id", nullable = false)
  public UUID targetId;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();

  public static void record(User actor, String action, UUID target) {
    var event = new AuditEvent();
    event.actorId = actor.id;
    event.action = action;
    event.targetId = target;
    event.persist();
  }
}
