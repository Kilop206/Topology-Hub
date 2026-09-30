"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Graph } from "@/lib/api";
import { graphLayout, type GraphLayout, type GraphSelection } from "@/lib/graph-layout";
import { Icon } from "./icon";

export function GraphPreview({
  graph,
  large = false,
  interactive = false,
  totalLinks,
  selection,
  onSelectionChange,
}: {
  graph: Graph;
  large?: boolean;
  interactive?: boolean;
  totalLinks?: number;
  selection?: GraphSelection;
  onSelectionChange?: (value: GraphSelection) => void;
}) {
  const [localSelection, setLocalSelection] = useState<GraphSelection>(null);
  const selected = selection === undefined ? localSelection : selection;
  const select = (value: GraphSelection) => {
    setLocalSelection(value);
    onSelectionChange?.(value);
  };
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layout, setLayout] = useState<GraphLayout>("auto");
  const [labels, setLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; pan: typeof pan; moved: boolean } | null>(
    null,
  );
  const limit = large ? 5000 : 32;
  const count = Math.max(0, Math.min(graph.nodes, limit));
  const geometry = useMemo(
    () => graphLayout(graph, count, layout),
    [graph, count, layout],
  );
  const { points, width, height } = geometry;
  const edgeLimit = large ? 20000 : 100;
  const edges = useMemo(
    () =>
      graph.links
        .slice(0, edgeLimit)
        .map((link, index) => ({ link, index }))
        .filter(
          ({ link }) =>
            link &&
            Number.isInteger(link.from) &&
            Number.isInteger(link.to) &&
            points[link.from] &&
            points[link.to],
        ),
    [graph, edgeLimit, points],
  );
  const linkCount = totalLinks ?? graph.links.length;
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  useEffect(() => {
    function changed() {
      setFullscreen(document.fullscreenElement === canvas.current);
    }
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  async function expand() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await canvas.current?.requestFullscreen();
    } catch {
      setFullscreenError("Tela cheia indisponível neste navegador.");
    }
  }
  function activate(event: React.KeyboardEvent<SVGGElement>, value: GraphSelection) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(value);
    }
  }
  return (
    <div ref={canvas} className={"graph-canvas" + (large ? " large" : "")}>
      {interactive && (
        <div className="graph-toolbar">
          <label>
            Layout
            <select
              aria-label="Layout do grafo"
              value={layout}
              onChange={(e) => {
                setLayout(e.target.value as GraphLayout);
                reset();
              }}
            >
              <option value="auto">Automático</option>
              <option value="circle">Circular</option>
              <option value="grid">Grade</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
            IDs dos nós
          </label>
          <div className="graph-view-controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Diminuir zoom"
              disabled={zoom <= 0.25}
              onClick={() => setZoom((z) => Math.max(0.25, z / 1.4))}
            >
              <Icon name="minus" size={17} />
            </button>
            <output className="mono" aria-label="Zoom">
              {Math.round(zoom * 100)}%
            </output>
            <button
              type="button"
              className="icon-button"
              aria-label="Aumentar zoom"
              disabled={zoom >= 16}
              onClick={() => setZoom((z) => Math.min(16, z * 1.4))}
            >
              <Icon name="plus" size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Redefinir visualização"
              title="Ajustar rede à tela"
              onClick={reset}
            >
              <Icon name="reset" size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
              onClick={expand}
            >
              <Icon name={fullscreen ? "collapse" : "expand"} size={17} />
            </button>
          </div>
        </div>
      )}
      <svg
        viewBox={"0 0 " + width + " " + height}
        role={interactive ? "group" : "img"}
        aria-label={
          "Prévia da topologia com " + graph.nodes + " nós e " + linkCount + " conexões"
        }
        onPointerDown={
          interactive
            ? (e) => {
                if (e.button !== 0 || (e.target as Element).closest("[data-element]"))
                  return;
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, pan, moved: false };
              }
            : undefined
        }
        onPointerMove={
          interactive
            ? (e) => {
                if (!drag.current) return;
                const bounds = e.currentTarget.getBoundingClientRect();
                const scale = Math.max(width / bounds.width, height / bounds.height);
                const dx = e.clientX - drag.current.x,
                  dy = e.clientY - drag.current.y;
                if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
                setPan({
                  x: drag.current.pan.x + dx * scale,
                  y: drag.current.pan.y + dy * scale,
                });
              }
            : undefined
        }
        onPointerUp={
          interactive
            ? (e) => {
                if (!drag.current) return;
                if (!drag.current.moved) select(null);
                drag.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            : undefined
        }
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <g
          transform={
            "translate(" +
            (width / 2 + pan.x) +
            " " +
            (height / 2 + pan.y) +
            ") scale(" +
            zoom +
            ") translate(" +
            -width / 2 +
            " " +
            -height / 2 +
            ")"
          }
        >
          {edges.map(({ link, index }) => {
            const active =
              selected?.kind === "link"
                ? selected.index === index
                : selected?.kind === "node" &&
                  (selected.index === link.from || selected.index === link.to);
            return (
              <g
                key={index}
                data-element="link"
                className={"graph-link" + (active ? " selected" : "")}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={
                  interactive
                    ? "Inspecionar link " +
                      index +
                      " de " +
                      link.from +
                      " para " +
                      link.to
                    : undefined
                }
                aria-pressed={
                  interactive
                    ? selected?.kind === "link" && selected.index === index
                    : undefined
                }
                onClick={interactive ? () => select({ kind: "link", index }) : undefined}
                onKeyDown={
                  interactive ? (e) => activate(e, { kind: "link", index }) : undefined
                }
              >
                <title>
                  {link.from +
                    " ↔ " +
                    link.to +
                    " · " +
                    link.delay +
                    " ms · " +
                    link.bandwidth +
                    " Mbps · perda " +
                    (link.loss * 100).toFixed(2) +
                    "%"}
                </title>
                <line
                  className="graph-edge"
                  x1={points[link.from].x}
                  y1={points[link.from].y}
                  x2={points[link.to].x}
                  y2={points[link.to].y}
                />
                {interactive && (
                  <line
                    className="graph-edge-hit"
                    x1={points[link.from].x}
                    y1={points[link.from].y}
                    x2={points[link.to].x}
                    y2={points[link.to].y}
                  />
                )}
              </g>
            );
          })}
          {points.map((point, index) => (
            <g
              key={index}
              data-element="node"
              className={
                "graph-node" +
                (selected?.kind === "node" && selected.index === index ? " selected" : "")
              }
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? "Inspecionar nó " + index : undefined}
              aria-pressed={
                interactive
                  ? selected?.kind === "node" && selected.index === index
                  : undefined
              }
              onClick={interactive ? () => select({ kind: "node", index }) : undefined}
              onKeyDown={
                interactive ? (e) => activate(e, { kind: "node", index }) : undefined
              }
            >
              <circle cx={point.x} cy={point.y} r={large ? 16 : 20} />
              {large && labels && (
                <text x={point.x} y={point.y + 4} textAnchor="middle">
                  {index}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
      {(count < graph.nodes || edges.length < linkCount) && (
        <span className="preview-note">
          Prévia parcial: {count} nós, {edges.length} de {linkCount} links
        </span>
      )}
      {interactive && (
        <div className="canvas-status">
          <span>
            {graph.nodes} nós · {linkCount} links
          </span>
          <span>
            {selected
              ? (selected.kind === "node" ? "Nó " : "Link ") +
                selected.index +
                " selecionado"
              : "Arraste para navegar. Selecione um nó ou link."}
          </span>
        </div>
      )}
      {fullscreenError && (
        <p className="error" role="alert">
          {fullscreenError}
        </p>
      )}
    </div>
  );
}
