package com.kns.topologiesFiles.dto.response;

public record AuthResponseDto(
        String token,
        String userId,
        String username,
        String email
) {
}