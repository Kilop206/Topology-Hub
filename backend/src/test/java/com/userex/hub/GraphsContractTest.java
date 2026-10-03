package com.userex.hub;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class GraphsContractTest {

  private final ObjectMapper mapper = new ObjectMapper();

  private com.fasterxml.jackson.databind.JsonNode graph(String nodeExtra, String linkExtra)
    throws Exception {
    return mapper.readTree(
      """
      {
        "schema_version": "1.0",
        "nodes": [
          {
            "id": 0,
            "external_id": "host:a",
            "label": "Host",
            "type": "computer",
            "addresses": ["192.0.2.1"],
            "evidence": "inventory"
            %s
          },
          {"id": 1, "type": "router"}
        ],
        "links": [
          {
            "from": 0,
            "to": 1,
            "bandwidth": 100,
            "delay": 1,
            "loss": 0
            %s
          }
        ]
      }
      """.formatted(nodeExtra, linkExtra)
    );
  }

  @Test
  void acceptsOptionalTopologyV1Fields() throws Exception {
    assertDoesNotThrow(() ->
      Graphs.validate(
        graph(
          ", \"position\": {\"x\": 10.5, \"y\": -2}",
          ", \"mode\": \"full_duplex\", \"queue_capacity\": 0, \"inferred\": true, \"evidence\": \"shared_segment\""
        )
      )
    );
  }

  @Test
  void rejectsMalformedOptionalTopologyV1Fields() throws Exception {
    for (var invalid : new com.fasterxml.jackson.databind.JsonNode[] {
      graph(", \"position\": {\"x\": 1}", ""),
      graph(", \"position\": {\"x\": 1, \"y\": 2, \"z\": 3}", ""),
      graph("", ", \"mode\": \"magic\""),
      graph("", ", \"queue_capacity\": -1"),
      graph("", ", \"queue_capacity\": 1.5"),
      graph("", ", \"inferred\": \"yes\""),
      graph("", ", \"evidence\": 42")
    }) {
      assertThrows(ApiException.class, () -> Graphs.validate(invalid));
    }
  }
}
