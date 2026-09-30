"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorMessage, type Listing } from "@/lib/api";
import { useAuth } from "./auth";
import { Icon } from "./icon";
import { TopologyCard } from "./topology-card";
import { EmptyState, ErrorState, LoadingState } from "./states";
export function Catalogue({ mine = false }: { mine?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    if (mine && (authLoading || !user)) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<Listing>(
      "/topologies?scope=" +
        (mine ? "mine" : "public") +
        "&page=" +
        page +
        "&q=" +
        encodeURIComponent(search),
      { signal: controller.signal },
    )
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mine, user, authLoading, page, search, retry]);
  if (mine && !authLoading && !user)
    return (
      <section className="empty-panel">
        <Icon name="lock" size={32} />
        <span className="tech-label">AUTHENTICATION REQUIRED</span>
        <h1>Minhas topologias</h1>
        <p>Entre para acessar seus projetos e arquivos privados.</p>
        <Link className="button" href="/login">
          Entrar na minha conta
        </Link>
      </section>
    );
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">USEREX / NETWORK ENGINEERING</div>
          <h1>{mine ? "Minhas topologias" : "Topology Hub"}</h1>
          <p>
            {mine
              ? "Crie, inspecione e versione suas arquiteturas de rede."
              : "Explore arquiteturas de rede. Inspecione os dados. Exporte para o KNS."}
          </p>
        </div>
        <Link className="button" href={user ? "/topologies/new" : "/login"}>
          <Icon name="plus" size={18} />
          Nova topologia
        </Link>
      </section>
      <div className="repository-status">
        <span>
          <Icon name="network" size={15} />
          REPOSITORY / {mine ? "PRIVATE WORKSPACE" : "COMMUNITY"}
        </span>
        <span>FORMAT / KNS JSON</span>
        <span>ORDER / UPDATED DESC</span>
      </div>
      <div className="catalogue-toolbar">
        <div className="tabs">
          <Link href="/" className={!mine ? "selected" : ""}>
            Comunidade
          </Link>
          <Link href="/mine" className={mine ? "selected" : ""}>
            Minhas topologias
          </Link>
        </div>
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            aria-label="Buscar topologias"
            placeholder="Buscar nome ou descrição…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="section-caption">
        <span>
          {loading ? "QUERY / PENDING" : "RESULTS / " + (data?.total || 0)}
        </span>
        <span>METRICS / CONFIGURED LINKS</span>
      </div>
      {error ? (
        <ErrorState message={error} retry={() => setRetry((r) => r + 1)} />
      ) : loading ? (
        <>
          <LoadingState />
          <div className="cards" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </>
      ) : !data?.items.length ? (
        <EmptyState query={q}>
          {!q && (
            <Link
              className="button"
              href={user ? "/topologies/new" : "/register"}
            >
              <Icon name="plus" size={17} />
              Importar topologia
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="cards">
          {data.items.map((t) => (
            <TopologyCard key={t.id} topology={t} />
          ))}
        </div>
      )}
      {data && data.total > data.size && (
        <nav className="pagination" aria-label="Paginação">
          <button
            className="button secondary"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            PAGE {page + 1} / {Math.ceil(data.total / data.size)}
          </span>
          <button
            className="button secondary"
            disabled={(page + 1) * data.size >= data.total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </>
  );
}
