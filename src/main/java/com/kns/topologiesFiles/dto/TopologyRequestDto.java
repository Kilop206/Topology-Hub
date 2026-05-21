package com.kns.topologiesFiles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record TopologyRequestDto(

        @NotBlank
        String name,

        String description,

        String version,

        Boolean publicTopology,

        @NotNull
        Map<String, Object> topologyJson

) {
}