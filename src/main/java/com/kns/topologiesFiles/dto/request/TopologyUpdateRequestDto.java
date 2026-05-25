package com.kns.topologiesFiles.dto.request;

public record TopologyUpdateRequestDto(

        String name,
        String description,
        String version,
        Boolean publicTopology

) {
}