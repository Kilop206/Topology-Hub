package com.kns.topologiesFiles.repo;

import com.kns.topologiesFiles.model.Topology;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TopologyRepo
        extends MongoRepository<Topology, String> {

    List<Topology> findByPublicTopologyTrue();

    List<Topology> findByOwnerId(String ownerId);

    List<Topology> findByNameContainingIgnoreCase(
            String name
    );

    List<Topology>
    findByOwnerUsernameAndPublicTopologyTrue(
            String ownerUsername
    );

}