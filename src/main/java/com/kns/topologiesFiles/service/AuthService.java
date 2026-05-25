package com.kns.topologiesFiles.service;

import com.kns.topologiesFiles.dto.request.LoginRequestDto;
import com.kns.topologiesFiles.dto.request.RegisterRequestDto;

import com.kns.topologiesFiles.dto.response.AuthResponseDto;

import com.kns.topologiesFiles.model.User;

import com.kns.topologiesFiles.model.enums.Role;

import com.kns.topologiesFiles.repo.UserRepo;

import com.kns.topologiesFiles.service.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AuthService {

    private final UserRepo userRepo;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    public AuthService(
            UserRepo userRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {

        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /*
     * REGISTER
     */
    public AuthResponseDto register(
            RegisterRequestDto dto
    ) {

        if (
                userRepo.existsByEmail(
                        dto.email()
                )
        ) {

            throw new RuntimeException(
                    "Email already in use"
            );
        }

        if (
                userRepo.existsByUsername(
                        dto.username()
                )
        ) {

            throw new RuntimeException(
                    "Username already in use"
            );
        }

        User user = User.builder()
                .username(dto.username())
                .email(dto.email())
                .password(passwordEncoder.encode(dto.password()))
                .role("USER")
                .build();

        User saved =
                userRepo.save(user);

        String token = jwtService.generateToken(saved);

        return new AuthResponseDto(
                token,
                saved.getId(),
                saved.getUsername(),
                saved.getEmail()
        );
    }

    /*
     * LOGIN
     */
    public AuthResponseDto login(
            LoginRequestDto dto
    ) {

        User user =
                userRepo.findByEmail(
                                dto.email()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Invalid credentials"
                                )
                        );

        boolean matches =
                passwordEncoder.matches(
                        dto.password(),
                        user.getPassword()
                );

        if (!matches) {

            throw new RuntimeException(
                    "Invalid credentials"
            );
        }

        String token = jwtService.generateToken(user);

        return new AuthResponseDto(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail()
        );
    }
}