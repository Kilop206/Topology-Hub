package com.userex.hub;

import com.fasterxml.jackson.databind.JsonNode;

public final class Graphs {

  private Graphs() {}

  public static void validate(JsonNode graph) {
    if (
      graph == null ||
      !graph.isObject() ||
      !graph.path("nodes").isIntegralNumber() ||
      !graph.path("nodes").canConvertToInt() ||
      graph.path("nodes").asInt() < 1 ||
      graph.path("nodes").asInt() > 5000 ||
      !graph.path("links").isArray() ||
      graph.path("links").size() > 20000
    ) throw new ApiException(
      400,
      "JSON KNS inválido: informe nodes entre 1 e 5000 e um array links com até 20000 conexões."
    );
    if (
      graph
        .toString()
        .getBytes(java.nio.charset.StandardCharsets.UTF_8)
        .length > 800000
    ) throw new ApiException(400, "A topologia excede 800 KB.");
    int nodes = graph.path("nodes").asInt();
    for (int index = 0; index < graph.path("links").size(); index++) {
      var link = graph.path("links").get(index);
      String path = "links[" + index + "]";
      for (String endpoint : new String[] { "from", "to" })
        if (
          !link.path(endpoint).isIntegralNumber() ||
          !link.path(endpoint).canConvertToInt() ||
          link.path(endpoint).asInt() < 0 ||
          link.path(endpoint).asInt() >= nodes
        ) throw new ApiException(
          400,
          "A conexão referencia um nó inexistente. Use IDs de 0 a " +
            (nodes - 1) +
            ".",
          path + "." + endpoint
        );
      if (
        link.path("from").asInt() == link.path("to").asInt()
      ) throw new ApiException(
        400,
        "Uma conexão deve unir dois nós distintos."
      );
      metric(link, "delay", 0, Double.MAX_VALUE, path);
      metric(link, "bandwidth", Double.MIN_VALUE, Double.MAX_VALUE, path);
      metric(link, "loss", 0, 1, path);
    }
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
