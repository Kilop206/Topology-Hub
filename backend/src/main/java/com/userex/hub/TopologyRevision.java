package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
  name = "topology_revision",
  uniqueConstraints = @UniqueConstraint(columnNames = { "topology_id", "revision" })
)
public class TopologyRevision extends PanacheEntityBase {

  @Id
  public UUID id = UUID.randomUUID();

  @ManyToOne(optional = false)
  @JoinColumn(name = "topology_id")
  public Topology topology;

  @Column(nullable = false)
  public long revision;

  @Column(nullable = false, length = 120)
  public String title;

  @Column(nullable = false, length = 4000)
  public String description;

  @Column(nullable = false, length = 10)
  public String visibility;

  @Column(nullable = false, columnDefinition = "text")
  public String graph;

  @ManyToOne(optional = false)
  @JoinColumn(name = "actor_id")
  public User actor;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();
}
