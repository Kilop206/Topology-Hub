package com.kns.topologiesFiles.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequestDto(

        @NotBlank
        String username,

        @NotBlank
        @Email
        String email,

        @NotBlank
        String password
) {
}