package com.kns.topologiesFiles.controller;

import com.kns.topologiesFiles.dto.TopologyRequestDto;
import com.kns.topologiesFiles.dto.TopologyResponseDto;
import com.kns.topologiesFiles.service.TopologyService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topologies")
public class TopologyController {

    private static final Logger logger =
            LoggerFactory.getLogger(TopologyController.class);

    private final TopologyService service;

    public TopologyController(TopologyService service) {
        this.service = service;
    }

    @PostMapping(
            consumes = "application/json",
            produces = "application/json"
    )
    public ResponseEntity<TopologyResponseDto> createTopology(
            @Valid @RequestBody TopologyRequestDto topologyRequestDto
    ) {

        logger.info("Criando nova topologia");

        TopologyResponseDto response =
                service.createTopology(topologyRequestDto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}