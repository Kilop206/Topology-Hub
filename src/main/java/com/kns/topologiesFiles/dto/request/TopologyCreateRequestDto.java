package com.kns.topologiesFiles.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TopologyCreateRequestDto(

        @NotBlank
        String name,

        String description,

        String version,

        Boolean publicTopology

) {
}