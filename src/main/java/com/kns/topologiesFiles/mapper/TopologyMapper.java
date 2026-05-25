package com.kns.topologiesFiles.mapper;

import com.kns.topologiesFiles.dto.request.TopologyCreateRequestDto;
import com.kns.topologiesFiles.dto.response.TopologyCreateResponseDto;
import com.kns.topologiesFiles.model.Topology;

public class TopologyMapper {

    private TopologyMapper() {
    }

    public static Topology toEntity(TopologyCreateRequestDto dto) {
        return Topology.builder()
                .name(dto.name())
                .description(dto.description())
                .version(dto.version())
                .publicTopology(Boolean.TRUE.equals(dto.publicTopology()))
                .build();
    }

    public static TopologyCreateResponseDto toCreateResponse(Topology topology) {
        return new TopologyCreateResponseDto(
                topology.getId(),
                topology.getName(),
                topology.getDescription(),
                topology.getVersion(),
                topology.getPublicTopology(),
                topology.getCreatedAt(),
                topology.getUpdatedAt()
        );
    }
}