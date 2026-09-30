"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, errorMessage, type Listing, type Topology } from "@/lib/api";
import { useAuth } from "./auth";
import { Icon } from "./icon";
import { TopologyCard } from "./topology-card";
import { EmptyState, ErrorState, LoadingState } from "./states";

type Order = "updated" | "name" | "nodes" | "delay";
const pageSize = 12;
export function Catalogue({ mine = false }: { mine?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<Order>("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibility, setVisibility] = useState("all");
  const [minNodes, setMinNodes] = useState("");
  const [data, setData] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const filterCount = Number(visibility !== "all") + Number(Number(minNodes) > 0);
  // The API supports search and pagination, but not ordering/filtering.
  // Fetch the entire matching result only when those controls need it,
  // so ordering never silently applies to just the visible page.
  const needsAll = order !== "updated" || filterCount > 0;
  const requestPage = needsAll ? 0 : page;
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
    async function fetchResults() {
      const path =
        "/topologies?scope=" +
        (mine ? "mine" : "public") +
        "&q=" +
        encodeURIComponent(search);
      const first = await api<Listing>(
        path + "&size=" + (needsAll ? 50 : pageSize) + "&page=" + requestPage,
        { signal: controller.signal },
      );
      if (!needsAll) return first;
      const items = new Map<string, Topology>(first.items.map((t) => [t.id, t]));
      const pages = Math.ceil(first.total / first.size);
      for (let index = 1; index < pages; index++) {
        const next = await api<Listing>(path + "&size=50&page=" + index, {
          signal: controller.signal,
        });
        next.items.forEach((t) => items.set(t.id, t));
      }
      return { ...first, items: [...items.values()] };
    }
    fetchResults()
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mine, user, authLoading, requestPage, search, retry, needsAll]);
  const filtered = useMemo(() => {
    const items = (data?.items || []).filter(
      (t) =>
        (visibility === "all" || t.visibility === visibility) &&
        t.nodeCount >= (Number(minNodes) || 0),
    );
    return items.sort((a, b) => {
      let comparison = 0;
      if (order === "name") comparison = a.title.localeCompare(b.title, "pt-BR");
      else if (order === "nodes") comparison = b.nodeCount - a.nodeCount;
      else if (order === "delay")
        comparison =
          (a.metrics?.meanLinkDelayMs ?? Infinity) -
          (b.metrics?.meanLinkDelayMs ?? Infinity);
      else comparison = b.updatedAt.localeCompare(a.updatedAt);
      return comparison || a.id.localeCompare(b.id);
    });
  }, [data, visibility, minNodes, order]);
  const total = needsAll ? filtered.length : data?.total || 0;
  const items = needsAll
    ? filtered.slice(page * pageSize, (page + 1) * pageSize)
    : filtered;
  if (mine && !authLoading && !user)
    return (
      <section className="empty-panel">
        <Icon name="lock" size={32} />
        <h1>Minhas topologias</h1>
        <p>Entre para acessar seus projetos e arquivos privados.</p>
        <Link className="button" href="/login">
          Entrar na minha conta
        </Link>
      </section>
    );
  return (
    <>
      <section className="page-heading repository-heading">
        <h1>Topology Hub</h1>
        <Link className="button" href={user ? "/topologies/new" : "/login"}>
          <Icon name="plus" size={18} />
          Nova topologia
        </Link>
      </section>
      <nav className="tabs repository-tabs" aria-label="Repositórios">
        <Link
          href="/"
          className={!mine ? "selected" : ""}
          aria-current={!mine ? "page" : undefined}
        >
          Comunidade
        </Link>
        <Link
          href="/mine"
          className={mine ? "selected" : ""}
          aria-current={mine ? "page" : undefined}
        >
          Minhas topologias
        </Link>
      </nav>
      <div className="catalogue-toolbar">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            aria-label="Buscar topologias"
            placeholder="Buscar topologias…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button secondary"
          aria-expanded={filtersOpen}
          aria-controls="topology-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Icon name="filters" size={17} />
          Filtros{filterCount > 0 ? " (" + filterCount + ")" : ""}
        </button>
        <label className="sort-control">
          Ordenar
          <select
            aria-label="Ordenar topologias"
            value={order}
            onChange={(e) => {
              setOrder(e.target.value as Order);
              setPage(0);
            }}
          >
            <option value="updated">Atualização recente</option>
            <option value="name">Nome A–Z</option>
            <option value="nodes">Mais nós</option>
            <option value="delay">Menor delay médio</option>
          </select>
        </label>
      </div>
      {filtersOpen && (
        <div className="repository-filters" id="topology-filters">
          {mine && (
            <label>
              Visibilidade
              <select
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">Todas</option>
                <option value="PUBLIC">Pública</option>
                <option value="PRIVATE">Privada</option>
              </select>
            </label>
          )}
          <label>
            Mínimo de nós
            <input
              type="number"
              min="0"
              max="5000"
              value={minNodes}
              placeholder="0"
              onChange={(e) => {
                setMinNodes(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <button
            className="text-link"
            onClick={() => {
              setMinNodes("");
              setVisibility("all");
              setPage(0);
            }}
          >
            Limpar filtros
          </button>
        </div>
      )}
      <p className="result-count" role="status">
        {loading
          ? needsAll
            ? "Carregando resultados para ordenar e filtrar…"
            : "Carregando…"
          : total + (total === 1 ? " topologia" : " topologias")}
      </p>
      {error ? (
        <ErrorState message={error} retry={() => setRetry((r) => r + 1)} />
      ) : loading ? (
        <LoadingState />
      ) : !items.length ? (
        <EmptyState query={q}>
          {!q && !filterCount && (
            <Link className="button" href={user ? "/topologies/new" : "/register"}>
              <Icon name="plus" size={17} />
              Importar topologia
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="topology-collection" data-view="list">
          {items.map((t) => (
            <TopologyCard key={t.id} topology={t} showAuthor={!mine} />
          ))}
        </div>
      )}
      {total > pageSize && (
        <nav className="pagination" aria-label="Paginação">
          <button
            className="button secondary"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(total / pageSize)}
          </span>
          <button
            className="button secondary"
            disabled={(page + 1) * pageSize >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </>
  );
}
