package com.kns.topologiesFiles.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.stereotype.Service;

import java.security.Key;

import java.util.Date;

import java.util.HashMap;
import java.util.Map;

import java.util.function.Function;

@Service
public class JwtService {

    @Value("${JWT_SECRET}")
    private String secretKey;

    /*
     * Extrai username/email do token
     */
    public String extractUsername(
            String token
    ) {

        return extractClaim(
                token,
                Claims::getSubject
        );
    }

    /*
     * Extrai qualquer claim
     */
    public <T> T extractClaim(

            String token,

            Function<Claims, T> claimsResolver
    ) {

        final Claims claims =
                extractAllClaims(token);

        return claimsResolver.apply(claims);
    }

    /*
     * Gera token
     */
    public String generateToken(
            UserDetails userDetails
    ) {

        return generateToken(
                new HashMap<>(),
                userDetails
        );
    }

    /*
     * Gera token com claims extras
     */
    public String generateToken(

            Map<String, Object> extraClaims,

            UserDetails userDetails
    ) {

        return Jwts.builder()

                .setClaims(extraClaims)

                .setSubject(
                        userDetails.getUsername()
                )

                .setIssuedAt(
                        new Date(System.currentTimeMillis())
                )

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000 * 60 * 60 * 24
                        )
                )

                .signWith(
                        getSignInKey(),
                        SignatureAlgorithm.HS256
                )

                .compact();
    }

    /*
     * Valida token
     */
    public boolean isTokenValid(

            String token,

            UserDetails userDetails
    ) {

        final String username =
                extractUsername(token);

        return (
                username.equals(
                        userDetails.getUsername()
                )
                        &&
                        !isTokenExpired(token)
        );
    }

    /*
     * Verifica expiração
     */
    private boolean isTokenExpired(
            String token
    ) {

        return extractExpiration(token)
                .before(new Date());
    }

    /*
     * Extrai data de expiração
     */
    private Date extractExpiration(
            String token
    ) {

        return extractClaim(
                token,
                Claims::getExpiration
        );
    }

    /*
     * Extrai todas claims
     */
    private Claims extractAllClaims(
            String token
    ) {

        return Jwts.parserBuilder()

                .setSigningKey(
                        getSignInKey()
                )

                .build()

                .parseClaimsJws(token)

                .getBody();
    }

    /*
     * Chave secreta
     */
    private Key getSignInKey() {

        byte[] keyBytes =
                secretKey.getBytes();

        return Keys.hmacShaKeyFor(
                keyBytes
        );
    }
}