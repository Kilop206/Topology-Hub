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
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "topologies")
public class Topology {

    @Id
    private String id;

    @Indexed
    private String name;

    private String description;

    private String version;

    private Boolean publicTopology;

    private String ownerId;

    private String ownerUsername;

    private List<String> tags;

    private String storageId;

    private String fileName;

    private Long fileSize;

    private String checksum;

    private String fileFormat;

    private Integer formatVersion;

    @Builder.Default
    private Long downloads = 0L;

    @Builder.Default
    private Long views = 0L;

    @Builder.Default
    private Long forks = 0L;

    @Builder.Default
    private Integer revision = 1;

    @Builder.Default
    private TopologyStatus status = TopologyStatus.ACTIVE;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}