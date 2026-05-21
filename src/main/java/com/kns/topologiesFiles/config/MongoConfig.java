package com.kns.topologiesFiles.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;

import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;

import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

import org.springframework.data.mongodb.MongoDatabaseFactory;

import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;


import java.util.Collections;

@Configuration
@EnableMongoAuditing
public class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Bean
    public MongoClient mongoClient() {

        ConnectionString connectionString =
                new ConnectionString(mongoUri);

        MongoClientSettings settings =
                MongoClientSettings.builder()
                        .applyConnectionString(connectionString)
                        .retryWrites(true)
                        .build();

        return MongoClients.create(settings);
    }

    @Bean
    public MongoTemplate mongoTemplate(
            MongoClient mongoClient,
            MappingMongoConverter converter
    ) {

        return new MongoTemplate(
                mongoClient,
                "kns"
        );
    }

    @Bean
    public MappingMongoConverter mappingMongoConverter(
            MongoDatabaseFactory factory,
            MongoCustomConversions conversions,
            MongoMappingContext context
    ) {

        MappingMongoConverter converter =
                new MappingMongoConverter(
                        new DefaultDbRefResolver(factory),
                        context
                );

        converter.setCustomConversions(conversions);

        converter.setTypeMapper(
                new DefaultMongoTypeMapper(null)
        );

        return converter;
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {

        return new MongoCustomConversions(
                Collections.emptyList()
        );
    }
}