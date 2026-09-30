package com.userex.hub;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "topology")
public class Topology extends PanacheEntityBase {

  @Id
  public UUID id = UUID.randomUUID();

  @ManyToOne(optional = false)
  @JoinColumn(name = "owner_id")
  public User owner;

  @Column(nullable = false, length = 120)
  public String title;

  @Column(nullable = false, length = 4000)
  public String description;

  @Column(nullable = false, length = 10)
  public String visibility;

  @Column(nullable = false, columnDefinition = "text")
  public String graph;

  @Column(name = "node_count", nullable = false)
  public int nodeCount;

  @Column(name = "link_count", nullable = false)
  public int linkCount;

  @Column(name = "created_at", nullable = false)
  public Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  public Instant updatedAt = Instant.now();

  @Version
  public long version;
}
