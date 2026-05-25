package com.kns.topologiesFiles.service;

import com.kns.topologiesFiles.dto.request.TopologyCreateRequestDto;
import com.kns.topologiesFiles.dto.request.TopologyUpdateRequestDto;
import com.kns.topologiesFiles.dto.response.TopologyCreateResponseDto;

import com.kns.topologiesFiles.exception.ResourceNotFoundException;

import com.kns.topologiesFiles.mapper.TopologyMapper;

import com.kns.topologiesFiles.model.Topology;
import com.kns.topologiesFiles.model.TopologyStorage;

import com.kns.topologiesFiles.model.User;
import com.kns.topologiesFiles.repo.TopologyRepo;
import com.kns.topologiesFiles.repo.TopologyStorageRepo;

import com.kns.topologiesFiles.utils.ChecksumUtil;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class TopologyService {

    private final TopologyRepo repo;

    private final TopologyStorageRepo storageRepo;

    private final AuthenticatedUserService authenticatedUserService;

    public TopologyService(
            TopologyRepo repo,
            TopologyStorageRepo storageRepo, AuthenticatedUserService authenticatedUserService
    ) {

        this.repo = repo;
        this.storageRepo = storageRepo;
        this.authenticatedUserService = authenticatedUserService;
    }

    /*
     * CREATE JSON
     */
    public TopologyCreateResponseDto createTopology(
            TopologyCreateRequestDto dto
    ) {

        Topology topology =
                TopologyMapper.toEntity(dto);

        Topology saved =
                repo.save(topology);

        return TopologyMapper.toCreateResponse(saved);
    }

    /*
     * UPLOAD FILE
     */
    public TopologyCreateResponseDto uploadTopology(
            MultipartFile file,
            String name,
            String description,
            boolean publicTopology
    ) throws IOException {

        byte[] data = file.getBytes();

        String checksum =
                ChecksumUtil.sha256(data);

        TopologyStorage storage =
                storageRepo.save(
                        TopologyStorage.builder()
                                .data(data)
                                .build()
                );

        User user =
                authenticatedUserService
                        .getAuthenticatedUser();

        Topology topology =
                Topology.builder()
                        .name(name)
                        .description(description)
                        .publicTopology(publicTopology)

                        .ownerId(user.getId())
                        .ownerUsername(user.getUsername())

                        .storageId(storage.getId())
                        .fileName(file.getOriginalFilename())
                        .fileSize(file.getSize())
                        .checksum(checksum)
                        .fileFormat("kns")
                        .formatVersion(1)
                        .build();

        Topology saved =
                repo.save(topology);

        return TopologyMapper.toCreateResponse(saved);
    }

    /*
     * GET ALL
     */
    public List<TopologyCreateResponseDto> getAll() {

        return repo.findAll()
                .stream()
                .map(TopologyMapper::toCreateResponse)
                .toList();
    }

    /*
     * GET BY ID
     */
    public TopologyCreateResponseDto getTopologyById(
            String id
    ) {

        Topology topology =
                repo.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Topology not found"
                                )
                        );

        return TopologyMapper.toCreateResponse(
                topology
        );
    }

    /*
     * UPDATE
     */
    public TopologyCreateResponseDto updateTopology(
            String id,
            TopologyUpdateRequestDto dto
    ) {

        Topology topology =
                repo.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Topology not found"
                                )
                        );

        if (dto.name() != null) {
            topology.setName(dto.name());
        }

        if (dto.description() != null) {
            topology.setDescription(
                    dto.description()
            );
        }

        if (dto.version() != null) {
            topology.setVersion(
                    dto.version()
            );
        }

        if (dto.publicTopology() != null) {
            topology.setPublicTopology(
                    dto.publicTopology()
            );
        }

        Topology updated =
                repo.save(topology);

        return TopologyMapper.toCreateResponse(
                updated
        );
    }

    /*
     * DELETE
     */
    public void deleteTopology(
            String id
    ) {

        Topology topology =
                repo.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Topology not found"
                                )
                        );

        if (topology.getStorageId() != null) {

            storageRepo.deleteById(
                    topology.getStorageId()
            );
        }

        repo.delete(topology);
    }

    /*
     * DOWNLOAD
     */
    public ResponseEntity<byte[]>
    downloadTopology(
            String id
    ) {

        Topology topology =
                repo.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Topology not found"
                                )
                        );

        TopologyStorage storage =
                storageRepo.findById(
                                topology.getStorageId()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Storage not found"
                                )
                        );

        return ResponseEntity.ok()

                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                topology.getFileName() +
                                "\""
                )

                .header(
                        HttpHeaders.CONTENT_LENGTH,
                        String.valueOf(
                                storage.getData().length
                        )
                )

                .contentType(
                        MediaType.APPLICATION_OCTET_STREAM
                )

                .body(storage.getData());
    }

    public List<TopologyCreateResponseDto>
    getPublicTopologiesByUsername(
            String username
    ) {

        return repo
                .findByOwnerUsernameAndPublicTopologyTrue(
                        username
                )
                .stream()
                .map(
                        TopologyMapper::toCreateResponse
                )
                .toList();
    }
}