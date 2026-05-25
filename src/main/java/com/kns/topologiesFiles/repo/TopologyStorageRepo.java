package com.kns.topologiesFiles.repo;

import com.kns.topologiesFiles.model.TopologyStorage;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TopologyStorageRepo extends MongoRepository<TopologyStorage, String> {
}