"use client";
import { useState } from "react";
import type { Graph } from "@/lib/api";
import { Icon } from "./icon";
export function GraphPreview({
  graph,
  large = false,
  interactive = false,
  totalLinks,
}: {
  graph: Graph;
  large?: boolean;
  interactive?: boolean;
  totalLinks?: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const limit = large ? 128 : 32;
  const count = Math.min(graph.nodes, limit);
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (i * Math.PI * 2) / count - Math.PI / 2;
    return { x: 240 + Math.cos(angle) * 145, y: 165 + Math.sin(angle) * 120 };
  });
  const edgeLimit = large ? 500 : 100;
  const edges = graph.links
    .slice(0, edgeLimit)
    .filter(
      (link) =>
        link &&
        Number.isInteger(link.from) &&
        Number.isInteger(link.to) &&
        nodes[link.from] &&
        nodes[link.to],
    );
  const linkCount = totalLinks ?? graph.links.length;
  const degree =
    selected === null
      ? 0
      : graph.links.filter(
          (link) => link && (link.from === selected || link.to === selected),
        ).length;
  return (
    <div className={"graph-canvas" + (large ? " large" : "")}>
      {large && (
        <div className="graph-coordinates">
          <span>LAYOUT / CIRCULAR</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      )}
      <svg
        viewBox="0 0 480 330"
        role={interactive ? "group" : "img"}
        aria-label={
          "Prévia da topologia com " +
          graph.nodes +
          " nós e " +
          linkCount +
          " conexões"
        }
      >
        <g
          transform={
            "translate(240 165) scale(" + zoom + ") translate(-240 -165)"
          }
        >
          {edges.map((link, index) => (
            <line
              key={index}
              className={
                selected !== null &&
                (link.from === selected || link.to === selected)
                  ? "graph-edge selected"
                  : "graph-edge"
              }
              x1={nodes[link.from].x}
              y1={nodes[link.from].y}
              x2={nodes[link.to].x}
              y2={nodes[link.to].y}
            >
              <title>
                {link.from +
                  " ↔ " +
                  link.to +
                  " / " +
                  link.delay +
                  " ms / " +
                  link.bandwidth +
                  " Mbps / loss " +
                  (link.loss * 100).toFixed(2) +
                  "%"}
              </title>
            </line>
          ))}
          {nodes.map((node, index) => (
            <g
              key={index}
              className={"graph-node" + (selected === index ? " selected" : "")}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? "Inspecionar nó " + index : undefined}
              aria-pressed={interactive ? selected === index : undefined}
              onClick={interactive ? () => setSelected(index) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(index);
                      }
                    }
                  : undefined
              }
            >
              <circle cx={node.x} cy={node.y} r={large ? 12 : 9} />
              {large && (
                <text x={node.x} y={node.y + 4} textAnchor="middle">
                  {index}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
      {(graph.nodes > limit || linkCount > edgeLimit) && (
        <span className="preview-note">
          PARTIAL / até {limit} nós e {edgeLimit} links
        </span>
      )}
      {interactive && (
        <>
          <div className="graph-controls">
            <button
              className="icon-button"
              aria-label="Diminuir zoom"
              disabled={zoom <= 0.6}
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            >
              <Icon name="minus" size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Redefinir visualização"
              onClick={() => {
                setZoom(1);
                setSelected(null);
              }}
            >
              <Icon name="reset" size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Aumentar zoom"
              disabled={zoom >= 2}
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <div className="graph-inspector" aria-live="polite">
            {selected === null
              ? "Selecione um nó para inspecionar."
              : "NODE::" + selected + " / " + degree + " links incidentes"}
          </div>
        </>
      )}
    </div>
  );
}
