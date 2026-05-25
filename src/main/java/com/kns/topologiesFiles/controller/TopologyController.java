package com.kns.topologiesFiles.controller;

import com.kns.topologiesFiles.dto.request.TopologyCreateRequestDto;
import com.kns.topologiesFiles.dto.request.TopologyUpdateRequestDto;

import com.kns.topologiesFiles.dto.response.TopologyCreateResponseDto;

import com.kns.topologiesFiles.service.TopologyService;

import jakarta.validation.Valid;

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

    private final TopologyService service;

    public TopologyController(
            TopologyService service
    ) {

        this.service = service;
    }

    /*
     * CREATE JSON
     */
    @PostMapping(
            consumes = "application/json",
            produces = "application/json"
    )
    public ResponseEntity<TopologyCreateResponseDto>
    createTopology(

            @Valid
            @RequestBody
            TopologyCreateRequestDto dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        service.createTopology(dto)
                );
    }

    /*
     * UPLOAD FILE
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
     * GET ALL
     */
    @GetMapping
    public ResponseEntity<
            List<TopologyCreateResponseDto>
            > getAll() {

        return ResponseEntity.ok(
                service.getAll()
        );
    }

    /*
     * GET BY ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<
            TopologyCreateResponseDto
            > getById(

            @PathVariable
            String id
    ) {

        return ResponseEntity.ok(
                service.getById(id)
        );
    }

    /*
     * UPDATE
     */
    @PutMapping("/{id}")
    public ResponseEntity<
            TopologyCreateResponseDto
            > updateTopology(

            @PathVariable
            String id,

            @RequestBody
            TopologyUpdateRequestDto dto
    ) {

        return ResponseEntity.ok(
                service.updateTopology(
                        id,
                        dto
                )
        );
    }

    /*
     * DELETE
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTopology(
            @PathVariable
            String id
    ) {

        service.deleteTopology(id);

        return ResponseEntity.noContent()
                .build();
    }

    /*
     * DOWNLOAD
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadTopology(
            @PathVariable
            String id
    ) {

        return service.downloadTopology(id);
    }
}