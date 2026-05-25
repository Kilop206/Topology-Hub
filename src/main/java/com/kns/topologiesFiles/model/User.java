package com.kns.topologiesFiles.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Id;

import org.springframework.data.mongodb.core.mapping.Document;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;

import java.util.Collection;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;

    private String username;

    private String email;

    private String password;

    private String role;

    private Instant createdAt;

    /*
     * AUTHORITIES / ROLES
     */
    @Override
    public Collection<? extends GrantedAuthority>
    getAuthorities() {

        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + role
                )
        );
    }

    /*
     * USERNAME DO SPRING SECURITY
     */
    @Override
    public String getUsername() {

        return email;
    }

    /*
     * PASSWORD
     */
    @Override
    public String getPassword() {

        return password;
    }

    /*
     * CONTA NÃO EXPIRADA
     */
    @Override
    public boolean isAccountNonExpired() {

        return true;
    }

    /*
     * CONTA NÃO BLOQUEADA
     */
    @Override
    public boolean isAccountNonLocked() {

        return true;
    }

    /*
     * CREDENCIAIS NÃO EXPIRADAS
     */
    @Override
    public boolean isCredentialsNonExpired() {

        return true;
    }

    /*
     * CONTA ATIVA
     */
    @Override
    public boolean isEnabled() {

        return true;
    }
}