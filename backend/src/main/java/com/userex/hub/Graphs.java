package com.userex.hub;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.Set;

public final class Graphs {

  private static final Set<String> DEVICE_TYPES = Set.of(
    "unknown",
    "computer",
    "router",
    "switch",
    "access_point",
    "server",
    "phone",
    "printer",
    "iot",
    "network_segment"
  );

  private static final Set<String> LINK_MODES = Set.of(
    "full_duplex",
    "half_duplex",
    "simplex"
  );

  private Graphs() {}

  public static void validate(JsonNode graph) {
    if (graph == null || !graph.isObject()) {
      throw invalidGraph();
    }
    if (
      graph.has("schema_version") &&
      (!graph.path("schema_version").isTextual() ||
        !graph.path("schema_version").asText().equals("1.0"))
    ) {
      throw new ApiException(400, "schema_version de topologia não suportada.");
    }

    Set<Integer> ids = nodeIds(graph);
    if (ids.isEmpty() || ids.size() > 5000) {
      throw invalidGraph();
    }
    if (!graph.path("links").isArray() || graph.path("links").size() > 20000) {
      throw invalidGraph();
    }
    if (
      graph
        .toString()
        .getBytes(java.nio.charset.StandardCharsets.UTF_8)
        .length > 800000
    ) throw new ApiException(400, "A topologia excede 800 KB.");

    for (int index = 0; index < graph.path("links").size(); index++) {
      var link = graph.path("links").get(index);
      String path = "links[" + index + "]";
      if (!link.isObject()) {
        throw new ApiException(400, "Conexão inválida.", path);
      }
      for (String endpoint : new String[] { "from", "to" }) {
        JsonNode value = link.get(endpoint);
        if (
          value == null ||
          !value.isIntegralNumber() ||
          !value.canConvertToInt() ||
          !ids.contains(value.asInt())
        ) throw new ApiException(
          400,
          "A conexão referencia um nó inexistente.",
          path + "." + endpoint
        );
      }
      if (link.path("from").asInt() == link.path("to").asInt()) {
        throw new ApiException(
          400,
          "Uma conexão deve unir dois nós distintos.",
          path
        );
      }
      metric(link, "delay", 0, Double.MAX_VALUE, path);
      metric(link, "bandwidth", Double.MIN_VALUE, Double.MAX_VALUE, path);
      metric(link, "loss", 0, 1, path);

      JsonNode mode = link.get("mode");
      if (mode != null && (!mode.isTextual() || !LINK_MODES.contains(mode.asText()))) {
        throw new ApiException(400, "Modo de conexão inválido.", path + ".mode");
      }

      JsonNode queueCapacity = link.get("queue_capacity");
      if (
        queueCapacity != null &&
        (!queueCapacity.isIntegralNumber() ||
          !queueCapacity.canConvertToInt() ||
          queueCapacity.asInt() < 0)
      ) {
        throw new ApiException(400, "queue_capacity inválido.", path + ".queue_capacity");
      }

      JsonNode inferred = link.get("inferred");
      if (inferred != null && !inferred.isBoolean()) {
        throw new ApiException(400, "inferred deve ser booleano.", path + ".inferred");
      }

      JsonNode evidence = link.get("evidence");
      if (evidence != null && !evidence.isTextual()) {
        throw new ApiException(400, "evidence deve ser texto.", path + ".evidence");
      }
    }
  }

  public static int nodeCount(JsonNode graph) {
    return nodeIds(graph).size();
  }

  public static Set<Integer> nodeIds(JsonNode graph) {
    JsonNode nodes = graph.path("nodes");
    if (nodes.isIntegralNumber() && nodes.canConvertToInt()) {
      int count = nodes.asInt();
      if (count < 1 || count > 5000) {
        return Set.of();
      }
      Set<Integer> ids = new HashSet<>();
      for (int id = 0; id < count; id++) ids.add(id);
      return ids;
    }

    if (!nodes.isArray() || nodes.isEmpty() || nodes.size() > 5000) {
      return Set.of();
    }

    Set<Integer> ids = new HashSet<>();
    for (int index = 0; index < nodes.size(); index++) {
      JsonNode node = nodes.get(index);
      String path = "nodes[" + index + "]";
      JsonNode id = node == null ? null : node.get("id");
      if (
        node == null ||
        !node.isObject() ||
        id == null ||
        !id.isIntegralNumber() ||
        !id.canConvertToInt() ||
        id.asInt() < 0 ||
        !ids.add(id.asInt())
      ) {
        throw new ApiException(400, "ID de nó inválido ou duplicado.", path + ".id");
      }

      JsonNode type = node.get("type");
      if (type != null && (!type.isTextual() || !DEVICE_TYPES.contains(type.asText()))) {
        throw new ApiException(400, "Tipo de dispositivo inválido.", path + ".type");
      }

      for (String field : new String[] { "external_id", "label", "evidence" }) {
        JsonNode value = node.get(field);
        if (value != null && !value.isTextual()) {
          throw new ApiException(400, "Campo de nó deve ser texto.", path + "." + field);
        }
      }

      JsonNode addresses = node.get("addresses");
      if (addresses != null) {
        if (!addresses.isArray()) {
          throw new ApiException(400, "addresses deve ser uma lista.", path + ".addresses");
        }
        for (JsonNode address : addresses) {
          if (!address.isTextual()) {
            throw new ApiException(400, "addresses deve conter apenas texto.", path + ".addresses");
          }
        }
      }

      JsonNode position = node.get("position");
      if (position != null) {
        if (!position.isObject()) {
          throw new ApiException(400, "position deve ser um objeto.", path + ".position");
        }
        for (String axis : new String[] { "x", "y" }) {
          JsonNode value = position.get(axis);
          if (
            value == null ||
            !value.isNumber() ||
            !Double.isFinite(value.asDouble())
          ) {
            throw new ApiException(400, "Coordenada de posição inválida.", path + ".position." + axis);
          }
        }
        if (position.size() != 2) {
          throw new ApiException(400, "position aceita apenas x e y.", path + ".position");
        }
      }
    }
    return ids;
  }

  private static ApiException invalidGraph() {
    return new ApiException(
      400,
      "JSON KNS inválido: informe nodes como inteiro positivo ou lista tipada e links como array."
    );
  }

  private static void metric(
    JsonNode link,
    String name,
    double min,
    double max,
    String path
  ) {
    JsonNode value = link.get(name);
    if (
      value == null ||
      !value.isNumber() ||
      !Double.isFinite(value.asDouble()) ||
      value.asDouble() < min ||
      value.asDouble() > max
    ) throw new ApiException(
      400,
      "Valor inválido em " +
        name +
        ". Delay deve ser >= 0, bandwidth > 0 e loss entre 0 e 1.",
      path + "." + name
    );
  }
}
