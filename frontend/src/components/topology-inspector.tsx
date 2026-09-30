"use client";
import { useEffect, useRef } from "react";
import { date, type Detail } from "@/lib/api";
import type { GraphSelection } from "@/lib/graph-layout";

const metric = (value: number | null | undefined, unit: string) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value) +
      " " +
      unit;

export function TopologyInspector({
  data,
  selection,
  onSelect,
  editable,
  busy,
  onDelete,
}: {
  data: Detail;
  selection: GraphSelection;
  onSelect: (value: GraphSelection) => void;
  editable: boolean;
  busy: boolean;
  onDelete: () => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (selection && disclosure.current) disclosure.current.open = true;
  }, [selection]);
  const t = data.topology;
  const link = selection?.kind === "link" ? data.graph.links[selection.index] : undefined;
  const node = selection?.kind === "node" ? selection.index : undefined;
  const incident =
    node === undefined
      ? []
      : data.graph.links
          .map((edge, index) => ({ edge, index }))
          .filter(({ edge }) => edge.from === node || edge.to === node);
  return (
    <aside className="workspace-inspector" aria-label="Inspector">
      <details open ref={disclosure}>
        <summary>Inspector</summary>
        <div className="inspector-content" aria-live="polite">
          {selection && (
            <button type="button" className="text-link" onClick={() => onSelect(null)}>
              Voltar à topologia
            </button>
          )}
          {node !== undefined ? (
            <>
              <h2>Nó {node}</h2>
              <dl className="facts">
                <div>
                  <dt>ID</dt>
                  <dd className="mono">{node}</dd>
                </div>
                <div>
                  <dt>Links incidentes</dt>
                  <dd className="mono">{incident.length}</dd>
                </div>
              </dl>
              {incident.length ? (
                <ul className="inspector-links">
                  {incident.map(({ edge, index }) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: "link", index })}
                      >
                        Link {index}
                        <span className="mono">
                          {edge.from} ↔ {edge.to}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nó sem conexões.</p>
              )}
              <p className="field-hint">
                O arquivo identifica os nós por índice. Nome, tipo e endereço IP não foram
                fornecidos.
              </p>
            </>
          ) : link ? (
            <>
              <h2>Link {selection?.index}</h2>
              <dl className="facts">
                <div>
                  <dt>Origem</dt>
                  <dd>
                    <button
                      className="text-link mono"
                      onClick={() => onSelect({ kind: "node", index: link.from })}
                    >
                      Nó {link.from}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Destino</dt>
                  <dd>
                    <button
                      className="text-link mono"
                      onClick={() => onSelect({ kind: "node", index: link.to })}
                    >
                      Nó {link.to}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Delay</dt>
                  <dd className="mono">{metric(link.delay, "ms")}</dd>
                </div>
                <div>
                  <dt>Banda</dt>
                  <dd className="mono">{metric(link.bandwidth, "Mbps")}</dd>
                </div>
                <div>
                  <dt>Perda</dt>
                  <dd className="mono">{metric(link.loss * 100, "%")}</dd>
                </div>
              </dl>
              <p className="field-hint">Valores configurados no JSON.</p>
            </>
          ) : (
            <>
              <h2>Topologia</h2>
              <code className="topology-id">{t.id}</code>
              <dl className="facts">
                <div>
                  <dt>Nós</dt>
                  <dd className="mono">{t.nodeCount}</dd>
                </div>
                <div>
                  <dt>Links</dt>
                  <dd className="mono">{t.linkCount}</dd>
                </div>
                <div>
                  <dt>Delay médio</dt>
                  <dd className="mono">{metric(t.metrics?.meanLinkDelayMs, "ms")}</dd>
                </div>
                <div>
                  <dt>Banda mínima</dt>
                  <dd className="mono">
                    {metric(t.metrics?.minimumBandwidthMbps, "Mbps")}
                  </dd>
                </div>
                <div>
                  <dt>Autor</dt>
                  <dd>{t.ownerName}</dd>
                </div>
                <div>
                  <dt>Atualizada</dt>
                  <dd>
                    <time dateTime={t.updatedAt}>{date(t.updatedAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt>Formato</dt>
                  <dd>KNS JSON</dd>
                </div>
              </dl>
              <p className="field-hint">
                Selecione um nó ou link no canvas para inspecionar sua configuração.
              </p>
            </>
          )}
        </div>
      </details>
      {editable && (
        <button className="danger-link" disabled={busy} onClick={onDelete}>
          {busy ? "Excluindo…" : "Excluir topologia"}
        </button>
      )}
    </aside>
  );
}
