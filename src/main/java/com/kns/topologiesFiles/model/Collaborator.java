package com.kns.topologiesFiles.model;

import com.kns.topologiesFiles.model.enums.CollaboratorRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Collaborator {

    private String userId;

    private String username;

    private CollaboratorRole role;
}