package com.kns.topologiesFiles.repo;

import com.kns.topologiesFiles.model.User;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepo
        extends MongoRepository<User, String> {

    Optional<User> findByEmail(
            String email
    );

    Optional<User> findByUsername(
            String username
    );

    boolean existsByEmail(
            String email
    );

    boolean existsByUsername(
            String username
    );
}