package com.kns.topologiesFiles.service;

import com.kns.topologiesFiles.dto.TopologyRequestDto;
import com.kns.topologiesFiles.dto.TopologyResponseDto;

import com.kns.topologiesFiles.mapper.TopologyMapper;

import com.kns.topologiesFiles.model.Topology;

import com.kns.topologiesFiles.repo.TopologyRepo;

import org.springframework.stereotype.Service;

@Service
public class TopologyService {

    private final TopologyRepo repository;

    public TopologyService(
            TopologyRepo repository
    ) {
        this.repository = repository;
    }

    public TopologyResponseDto createTopology(
            TopologyRequestDto dto
    ) {

        Topology topology =
                TopologyMapper.toEntity(dto);

        Topology saved =
                repository.save(topology);

        return TopologyMapper.toResponse(saved);
    }
}