package com.kns.topologiesFiles.controller;

import com.kns.topologiesFiles.dto.request.TopologyCreateRequestDto;
import com.kns.topologiesFiles.dto.response.TopologyCreateResponseDto;

import com.kns.topologiesFiles.service.TopologyService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/topologies")
public class TopologyController {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    TopologyController.class
            );

    private final TopologyService service;

    public TopologyController(
            TopologyService service
    ) {

        this.service = service;
    }

    /*
     * Criar topologia via JSON
     */
    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<TopologyCreateResponseDto>
    createTopology(

            @Valid
            @RequestBody
            TopologyCreateRequestDto dto
    ) {

        logger.info(
                "Criando topologia JSON"
        );

        TopologyCreateResponseDto response =
                service.createTopology(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * Upload de arquivo .kns/.json/etc
     */
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<TopologyCreateResponseDto>
    uploadTopology(

            @RequestParam("file")
            MultipartFile file,

            @RequestParam
            String name,

            @RequestParam(required = false)
            String description,

            @RequestParam(defaultValue = "false")
            boolean publicTopology

    ) throws IOException {

        logger.info(
                "Upload de topologia: {}",
                name
        );

        return ResponseEntity.ok(
                service.uploadTopology(
                        file,
                        name,
                        description,
                        publicTopology
                )
        );
    }

    /*
     * Download do arquivo da topologia
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]>
    downloadTopology(

            @PathVariable
            String id
    ) {

        logger.info(
                "Download da topologia: {}",
                id
        );

        return service.downloadTopology(id);
    }

    /*
     * Buscar topologias públicas por username
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<List<TopologyCreateResponseDto>>
    getByUsername(

            @PathVariable
            String username
    ) {

        logger.info(
                "Buscando topologias públicas de: {}",
                username
        );

        return ResponseEntity.ok(
                service.getPublicTopologiesByUsername(
                        username
                )
        );
    }

    /*
     * Buscar topologia por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TopologyCreateResponseDto>
    getById(
            @PathVariable
            String id
    ) {

        return ResponseEntity.ok(
                service.getTopologyById(id)
        );
    }

    /*
     * Deletar topologia
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteTopology(

            @PathVariable
            String id
    ) {

        service.deleteTopology(id);

        return ResponseEntity.noContent().build();
    }
}