package com.kns.topologiesFiles.mapper;

import com.kns.topologiesFiles.dto.TopologyRequestDto;
import com.kns.topologiesFiles.dto.TopologyResponseDto;
import com.kns.topologiesFiles.model.Topology;

public class TopologyMapper {

    private TopologyMapper() {
    }

    public static Topology toEntity(
            TopologyRequestDto dto
    ) {

        return Topology.builder()
                .name(dto.name())
                .description(dto.description())
                .version(dto.version())
                .publicTopology(dto.publicTopology())
                .topologyJson(dto.topologyJson())
                .build();
    }

    public static TopologyResponseDto toResponse(
            Topology topology
    ) {

        return new TopologyResponseDto(
                topology.getId(),
                topology.getName(),
                topology.getDescription(),
                topology.getVersion(),
                topology.isPublicTopology(),
                topology.getCreatedAt(),
                topology.getUpdatedAt()
        );
    }
}