package com.kns.topologiesFiles.dto.request;

import com.kns.topologiesFiles.model.enums.TopologyPermission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddCollaboratorRequestDto(

        @NotBlank
        String username,

        @NotNull
        TopologyPermission permission

) {
}