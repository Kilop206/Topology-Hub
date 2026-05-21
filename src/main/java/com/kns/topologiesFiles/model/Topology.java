package com.kns.topologiesFiles.model;

import com.kns.topologiesFiles.model.enums.TopologyStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;

import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "topologies")
public class Topology {

    @Id
    private String id;

    private String name;

    private String description;

    private String version;

    private List<String> tags;

    @Builder.Default
    private boolean publicTopology = false;

    private Map<String, Object> topologyJson;
    private String ownerId;

    private String ownerUsername;

    private List<Collaborator> collaborators;

    private List<Rating> ratings;

    @Builder.Default
    private Double averageRating = 0.0;

    @Builder.Default
    private Long downloads = 0L;

    @Builder.Default
    private Long views = 0L;

    @Builder.Default
    private Long forks = 0L;

    @Builder.Default
    private Integer revision = 1;

    private List<TopologyVersion> versions;

    @Builder.Default
    private TopologyStatus status = TopologyStatus.ACTIVE;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}