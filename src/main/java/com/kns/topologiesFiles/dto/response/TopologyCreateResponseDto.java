package com.kns.topologiesFiles.dto.response;

import java.time.Instant;

public record TopologyCreateResponseDto(

        String id,
        String name,
        String description,
        String version,
        Boolean publicTopology,
        Instant createdAt,
        Instant updatedAt

) {
}