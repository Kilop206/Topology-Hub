"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, date, errorMessage, type Detail } from "@/lib/api";
import { useAuth } from "./auth";
import { GraphPreview } from "./graph-preview";
import { TopologyInspector } from "./topology-inspector";
import type { GraphSelection } from "@/lib/graph-layout";
import { Icon } from "./icon";
import { JsonViewer } from "./json-viewer";
import { ErrorState, LoadingState } from "./states";
const tabs = ["overview", "nodes", "links", "json", "revisions"] as const;
type Tab = (typeof tabs)[number];
const number = (value: number | null | undefined, unit = "") =>
  value == null
    ? "N/A"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value) +
      (unit ? " " + unit : "");
export function TopologyDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<GraphSelection>(null);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    setData(null);
    setSelection(null);
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
      <LoadingState label="Carregando topologia…" />
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
      <header className="workspace-heading">
        <Link href="/" className="back-link">
          ← Topologias
        </Link>
        <h1>{t.title}</h1>
        <span className="badge">{t.visibility === "PUBLIC" ? "Pública" : "Privada"}</span>
        <code className="revision">rev. {t.version + 1}</code>
        <div className="action-group">
          {editable && (
            <Link className="button secondary" href={"/topologies/" + id + "/edit"}>
              <Icon name="edit" size={16} />
              Editar
            </Link>
          )}
          <a className="button" href={"/api/topologies/" + id + "/download"}>
            <Icon name="download" size={16} />
            Baixar JSON
          </a>
        </div>
      </header>
      {error && <ErrorState message={error} />}
      <div className="workspace-canvas-row">
        <GraphPreview
          graph={data.graph}
          large
          interactive
          selection={selection}
          onSelectionChange={setSelection}
        />
        <TopologyInspector
          data={data}
          selection={selection}
          onSelect={setSelection}
          editable={!!editable}
          busy={busy}
          onDelete={remove}
        />
      </div>
      <div className="engineering-workspace">
        <div
          className="tabs workspace-tabs"
          role="tablist"
          aria-label="Dados da topologia"
          onKeyDown={(event) => {
            const current = tabs.indexOf(tab);
            const index =
              event.key === "ArrowRight"
                ? (current + 1) % tabs.length
                : event.key === "ArrowLeft"
                  ? (current + tabs.length - 1) % tabs.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : -1;
            if (index >= 0) {
              event.preventDefault();
              setTab(tabs[index]);
              setPage(0);
              document.getElementById("tab-" + tabs[index])?.focus();
            }
          }}
        >
          {tabs.map((value) => (
            <button
              id={"tab-" + value}
              role="tab"
              tabIndex={tab === value ? 0 : -1}
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
                    : value === "json"
                      ? "JSON"
                      : "Revisões"}
            </button>
          ))}
        </div>
        <section id="topology-data" role="tabpanel" aria-labelledby={"tab-" + tab}>
          {tab === "overview" ? (
            <div className="overview-content">
              <h2>Configuração de rede</h2>
              <p className="description">{t.description || "Descrição não informada."}</p>
              <div className="metrics-strip">
                <div>
                  <span>Delay médio</span>
                  <strong>{number(t.metrics?.meanLinkDelayMs, "ms")}</strong>
                </div>
                <div>
                  <span>Banda mínima</span>
                  <strong>{number(t.metrics?.minimumBandwidthMbps, "Mbps")}</strong>
                </div>
                <div>
                  <span>Perda máxima</span>
                  <strong>{number(t.metrics?.maximumLossPercent, "%")}</strong>
                </div>
              </div>
              <p className="field-hint">
                Valores configurados nos links do arquivo JSON. Não representam telemetria
                ao vivo nem resultados de simulação.
              </p>
            </div>
          ) : tab === "revisions" ? (
            <div className="overview-content">
              <h2>Revisão atual</h2>
              <p>
                <code>rev. {t.version + 1}</code> · Atualizada em{" "}
                <time dateTime={t.updatedAt}>{date(t.updatedAt)}</time>
              </p>
              <p className="muted">
                O serviço fornece a revisão atual. O histórico de versões ainda não está
                disponível.
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
                            <td>
                              <button
                                className="text-link mono"
                                onClick={() =>
                                  setSelection({ kind: "node", index: node })
                                }
                              >
                                Nó {node}
                              </button>
                            </td>
                            <td className="numeric">{degrees.get(node) || 0}</td>
                          </tr>
                        ))
                      : data.graph.links
                          .slice(page * 50, page * 50 + 50)
                          .map((link, index) => (
                            <tr key={index}>
                              <td>
                                <button
                                  className="text-link mono"
                                  onClick={() =>
                                    setSelection({
                                      kind: "link",
                                      index: page * 50 + index,
                                    })
                                  }
                                >
                                  {page * 50 + index}
                                </button>
                              </td>
                              <td className="mono">{link.from}</td>
                              <td className="mono">{link.to}</td>
                              <td className="numeric">{number(link.delay, "ms")}</td>
                              <td className="numeric">
                                {number(link.bandwidth, "Mbps")}
                              </td>
                              <td className="numeric">{number(link.loss * 100, "%")}</td>
                            </tr>
                          ))}
                  </tbody>
                </table>
                {!total && <p className="table-empty">Nenhuma conexão configurada.</p>}
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
    </>
  );
}
