package com.kns.topologiesFiles.service;

import com.kns.topologiesFiles.model.User;
import com.kns.topologiesFiles.repo.UserRepo;

import org.springframework.security.core.Authentication;

import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserRepo userRepo;

    public AuthenticatedUserService(
            UserRepo userRepo
    ) {

        this.userRepo = userRepo;
    }

    public User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        return userRepo.findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
                                "User not found"
                        )
                );
    }
}