import type { Graph } from "./api";

export type GraphSelection = { kind: "node" | "link"; index: number } | null;
export type GraphLayout = "auto" | "circle" | "grid";

// Keep positions deterministic. Small networks expose connectivity through BFS
// layers; large networks use a grid to avoid overlapping thousands of labels.
export function graphLayout(graph: Graph, count: number, layout: GraphLayout) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count * 1.6)));
  let width = Math.max(800, columns * 72 + 120);
  let height = Math.max(480, Math.ceil(count / columns) * 64 + 120);
  const points = Array.from({ length: count }, (_, i) => ({
    x: 80 + ((i % columns) * (width - 160)) / Math.max(1, columns - 1),
    y:
      80 +
      (Math.floor(i / columns) * (height - 160)) /
        Math.max(1, Math.ceil(count / columns) - 1),
  }));
  if (layout === "circle") {
    width = Math.max(800, count * 16);
    height = width * 0.65;
    points.forEach((point, i) => {
      const angle = (i * Math.PI * 2) / count - Math.PI / 2;
      point.x = width / 2 + Math.cos(angle) * (width / 2 - 80);
      point.y = height / 2 + Math.sin(angle) * (height / 2 - 64);
    });
  } else if (layout === "auto" && count <= 128) {
    const adjacency = Array.from({ length: count }, () => new Set<number>());
    for (const link of graph.links) {
      if (link && adjacency[link.from] && adjacency[link.to]) {
        adjacency[link.from].add(link.to);
        adjacency[link.to].add(link.from);
      }
    }
    const visited = new Set<number>();
    const layers: number[][] = [];
    const roots = Array.from({ length: count }, (_, i) => i).sort(
      (a, b) => adjacency[b].size - adjacency[a].size || a - b,
    );
    for (const root of roots) {
      if (visited.has(root)) continue;
      let frontier = [root];
      visited.add(root);
      while (frontier.length) {
        layers.push(frontier);
        const next: number[] = [];
        for (const node of frontier)
          for (const neighbor of adjacency[node]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              next.push(neighbor);
            }
          }
        frontier = next;
      }
    }
    width = Math.max(800, layers.length * 120 + 120);
    height = Math.max(
      480,
      Math.max(1, ...layers.map((layer) => layer.length)) * 56 + 120,
    );
    layers.forEach((layer, column) =>
      layer.forEach((node, row) => {
        points[node] = {
          x:
            layers.length === 1
              ? width / 2
              : 80 + (column * (width - 160)) / (layers.length - 1),
          y: (height - (layer.length - 1) * 56) / 2 + row * 56,
        };
      }),
    );
  }
  if (count === 1) points[0] = { x: width / 2, y: height / 2 };
  return { points, width, height };
}
