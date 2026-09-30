"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, date, errorMessage, type Detail } from "@/lib/api";
import { useAuth } from "./auth";
import { GraphPreview } from "./graph-preview";
import { Icon } from "./icon";
import { JsonViewer } from "./json-viewer";
import { ErrorState, LoadingState } from "./states";
type Tab = "overview" | "nodes" | "links" | "json";
const number = (value: number | null | undefined, unit = "") =>
  value == null
    ? "N/A"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(
        value,
      ) + (unit ? " " + unit : "");
export function TopologyDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    api<Detail>("/topologies/" + id, { signal: abort.signal })
      .then(setData)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      });
    return () => abort.abort();
  }, [id, retry]);
  async function remove() {
    if (!confirm("Excluir esta topologia permanentemente?")) return;
    setBusy(true);
    try {
      await api("/topologies/" + id, { method: "DELETE" });
      router.push("/mine");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return error ? (
      <ErrorState message={error} retry={() => setRetry((r) => r + 1)} />
    ) : (
      <LoadingState label="LOADING TOPOLOGY…" />
    );
  const t = data.topology;
  const editable = user && (user.id === t.ownerId || user.role === "ADMIN");
  const total = tab === "nodes" ? data.graph.nodes : data.graph.links.length;
  const degrees = new Map<number, number>();
  for (const link of data.graph.links) {
    degrees.set(link.from, (degrees.get(link.from) || 0) + 1);
    degrees.set(link.to, (degrees.get(link.to) || 0) + 1);
  }
  return (
    <>
      <Link href="/" className="back-link">
        ← Repositório de topologias
      </Link>
      <section className="page-heading">
        <div>
          <code className="topology-id">TOPOLOGY / {t.id}</code>
          <h1>{t.title}</h1>
          <div className="topology-status">
            <span className="badge success">
              <Icon name="check" size={13} />
              VALID JSON
            </span>
            <span className="badge">{t.visibility}</span>
            <code>REV {t.version + 1}</code>
            <time title={t.updatedAt}>UPDATED {date(t.updatedAt)}</time>
          </div>
        </div>
        <div className="action-group">
          {editable && (
            <Link
              className="button secondary"
              href={"/topologies/" + id + "/edit"}
            >
              <Icon name="edit" size={16} />
              Editar
            </Link>
          )}
          <a className="button" href={"/api/topologies/" + id + "/download"}>
            <Icon name="download" size={16} />
            Baixar JSON
          </a>
        </div>
      </section>
      {error && <ErrorState message={error} />}
      <div className="detail-layout">
        <div className="engineering-workspace">
          <section className="form-panel graph-panel">
            <div className="module-toolbar">
              <span className="tech-label">TOPOLOGY GRAPH</span>
              <span className="tech-label">
                {t.nodeCount} NODES / {t.linkCount} LINKS
              </span>
            </div>
            <GraphPreview graph={data.graph} large interactive />
          </section>
          <div
            className="tabs workspace-tabs"
            role="tablist"
            aria-label="Dados da topologia"
          >
            {(["overview", "nodes", "links", "json"] as const).map((value) => (
              <button
                id={"tab-" + value}
                role="tab"
                aria-selected={tab === value}
                aria-controls="topology-data"
                key={value}
                className={tab === value ? "selected" : ""}
                onClick={() => {
                  setTab(value);
                  setPage(0);
                }}
              >
                {value === "overview"
                  ? "Visão geral"
                  : value === "nodes"
                    ? "Nós"
                    : value === "links"
                      ? "Links"
                      : "JSON"}
              </button>
            ))}
          </div>
          <section
            id="topology-data"
            role="tabpanel"
            aria-labelledby={"tab-" + tab}
          >
            {tab === "overview" ? (
              <div className="form-panel">
                <h2>Configuração de rede</h2>
                <p className="description">
                  {t.description || "Descrição não informada."}
                </p>
                <div className="metrics-strip">
                  <div>
                    <span>LINK DELAY · AVG</span>
                    <strong>{number(t.metrics?.meanLinkDelayMs, "ms")}</strong>
                  </div>
                  <div>
                    <span>BANDWIDTH · MIN</span>
                    <strong>
                      {number(t.metrics?.minimumBandwidthMbps, "Mbps")}
                    </strong>
                  </div>
                  <div>
                    <span>LINK LOSS · MAX</span>
                    <strong>
                      {number(t.metrics?.maximumLossPercent, "%")}
                    </strong>
                  </div>
                </div>
                <p className="field-hint">
                  Valores configurados nos links do arquivo JSON. Não
                  representam telemetria ao vivo nem resultados de simulação.
                </p>
              </div>
            ) : tab === "json" ? (
              <JsonViewer
                value={data.graph}
                downloadUrl={"/api/topologies/" + id + "/download"}
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      {tab === "nodes" ? (
                        <tr>
                          <th>NODE ID</th>
                          <th>INCIDENT LINKS</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>LINK</th>
                          <th>FROM</th>
                          <th>TO</th>
                          <th>DELAY</th>
                          <th>BANDWIDTH</th>
                          <th>LOSS</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {tab === "nodes"
                        ? Array.from(
                            {
                              length: Math.max(
                                0,
                                Math.min(50, data.graph.nodes - page * 50),
                              ),
                            },
                            (_, i) => page * 50 + i,
                          ).map((node) => (
                            <tr key={node}>
                              <td className="mono">NODE::{node}</td>
                              <td className="numeric">
                                {degrees.get(node) || 0}
                              </td>
                            </tr>
                          ))
                        : data.graph.links
                            .slice(page * 50, page * 50 + 50)
                            .map((link, index) => (
                              <tr key={index}>
                                <td className="mono">{page * 50 + index}</td>
                                <td className="mono">{link.from}</td>
                                <td className="mono">{link.to}</td>
                                <td className="numeric">
                                  {number(link.delay, "ms")}
                                </td>
                                <td className="numeric">
                                  {number(link.bandwidth, "Mbps")}
                                </td>
                                <td className="numeric">
                                  {number(link.loss * 100, "%")}
                                </td>
                              </tr>
                            ))}
                    </tbody>
                  </table>
                  {!total && (
                    <p className="table-empty">
                      0 LINKS / Nenhuma conexão configurada.
                    </p>
                  )}
                </div>
                {total > 50 && (
                  <nav className="pagination" aria-label="Paginação dos dados">
                    <button
                      className="button secondary"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </button>
                    <code>
                      {page + 1} / {Math.ceil(total / 50)}
                    </code>
                    <button
                      className="button secondary"
                      disabled={(page + 1) * 50 >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
        <aside className="form-panel metadata-panel">
          <span className="tech-label">TOPOLOGY INFO</span>
          <dl className="facts">
            <div>
              <dt>Nodes</dt>
              <dd>{t.nodeCount}</dd>
            </div>
            <div>
              <dt>Links</dt>
              <dd>{t.linkCount}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{t.version + 1}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{date(t.createdAt)}</dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>{t.ownerName}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>KNS JSON</dd>
            </div>
          </dl>
          <div className="info-box">
            <Icon name="terminal" size={19} />
            <p>Exporte o JSON e abra no KNS para executar simulações.</p>
          </div>
          {editable && (
            <button className="danger-link" disabled={busy} onClick={remove}>
              {busy ? "Excluindo…" : "Excluir topologia"}
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
