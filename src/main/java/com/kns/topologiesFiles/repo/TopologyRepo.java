package com.kns.topologiesFiles.repo;

import com.kns.topologiesFiles.model.Topology;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TopologyRepo
        extends MongoRepository<Topology, String> {

}