package com.kns.topologiesFiles.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rating {

    private String userId;

    private String username;

    private Integer stars;

    private String comment;

    private Instant createdAt;
}