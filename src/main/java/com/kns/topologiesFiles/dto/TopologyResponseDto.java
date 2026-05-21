package com.kns.topologiesFiles.dto;

import java.time.Instant;

public record TopologyResponseDto(

        String id,

        String name,

        String description,

        String version,

        Boolean publicTopology,

        Instant createdAt,

        Instant updatedAt

) {
}