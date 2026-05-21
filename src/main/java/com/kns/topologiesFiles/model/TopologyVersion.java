package com.kns.topologiesFiles.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopologyVersion {

    private String version;

    private String createdBy;

    private Instant createdAt;

    private Map<String, Object> topologyJson;
}