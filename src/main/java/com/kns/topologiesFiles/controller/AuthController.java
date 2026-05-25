package com.kns.topologiesFiles.controller;

import com.kns.topologiesFiles.dto.request.LoginRequestDto;
import com.kns.topologiesFiles.dto.request.RegisterRequestDto;

import com.kns.topologiesFiles.dto.response.AuthResponseDto;

import com.kns.topologiesFiles.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(
            AuthService service
    ) {

        this.service = service;
    }

    /*
     * REGISTER
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto>
    register(

            @Valid
            @RequestBody
            RegisterRequestDto dto
    ) {

        return ResponseEntity.ok(
                service.register(dto)
        );
    }

    /*
     * LOGIN
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto>
    login(

            @Valid
            @RequestBody
            LoginRequestDto dto
    ) {

        return ResponseEntity.ok(
                service.login(dto)
        );
    }
}