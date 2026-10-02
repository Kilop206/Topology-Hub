"use client";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  errorMessage,
  graphNodeCount,
  initialGraph,
  type Detail,
  type Graph,
} from "@/lib/api";
import { useAuth } from "./auth";
import { Icon } from "./icon";
import { GraphPreview } from "./graph-preview";
export function TopologyEditor({ id }: { id?: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [json, setJson] = useState(JSON.stringify(initialGraph, null, 2));
  const [version, setVersion] = useState<number>();
  const [owner, setOwner] = useState<string>();
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    const abort = new AbortController();
    api<Detail>("/topologies/" + id, { signal: abort.signal })
      .then((data) => {
        setTitle(data.topology.title);
        setDescription(data.topology.description);
        setVisibility(data.topology.visibility);
        setVersion(data.topology.version);
        setOwner(data.topology.ownerId);
        setJson(JSON.stringify(data.graph, null, 2));
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [id]);
  let preview: Graph | null = null;
  let validation = "";
  try {
    const candidate = JSON.parse(json);
    const validLegacyNodes = Number.isInteger(candidate.nodes) && candidate.nodes > 0;
    const validTypedNodes =
      Array.isArray(candidate.nodes) &&
      candidate.nodes.length > 0 &&
      candidate.nodes.every(
        (node: unknown) =>
          typeof node === "object" &&
          node !== null &&
          Number.isInteger((node as { id?: unknown }).id),
      ) &&
      new Set(candidate.nodes.map((node: { id: number }) => node.id)).size ===
        candidate.nodes.length;
    if ((validLegacyNodes || validTypedNodes) && Array.isArray(candidate.links))
      preview = candidate;
    else
      validation =
        "Informe nodes como inteiro positivo ou lista de nós com IDs únicos, e links como lista.";
  } catch (e) {
    validation = e instanceof Error ? e.message : "JSON inválido.";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const graph = JSON.parse(json);
      const detail = await api<Detail>(id ? "/topologies/" + id : "/topologies", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({
          title,
          description,
          visibility,
          graph,
          ...(id ? { version } : {}),
        }),
      });
      router.push("/topologies/" + detail.topology.id);
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "O JSON está inválido. Revise a estrutura antes de salvar."
          : errorMessage(e),
      );
    } finally {
      setBusy(false);
    }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      if (file.size > 800000) throw new Error("O arquivo deve ter até 800 KB.");
      const text = await file.text();
      const graph = JSON.parse(text);
      setJson(JSON.stringify(graph, null, 2));
      if (!title)
        setTitle(
          typeof graph.name === "string"
            ? graph.name.slice(0, 120)
            : file.name.replace(/\.json$/i, "").slice(0, 120),
        );
    } catch (e) {
      setError(errorMessage(e));
    }
    event.target.value = "";
  }
  if (authLoading || loading) return <p className="loading-text">Carregando editor…</p>;
  if (!user)
    return (
      <section className="empty-panel">
        <h1>Entre para criar uma topologia.</h1>
        <Link href="/login" className="button">
          Entrar
        </Link>
      </section>
    );
  if (id && (version === undefined || (owner !== user.id && user.role !== "ADMIN")))
    return (
      <section className="empty-panel">
        <h1>Editor indisponível.</h1>
        <p>{error || "Você não pode editar esta topologia."}</p>
        <Link href="/" className="button secondary">
          Voltar
        </Link>
      </section>
    );
  return (
    <>
      <Link className="back-link" href={id ? "/topologies/" + id : "/mine"}>
        ← {id ? title || "Topologia" : "Minhas topologias"}
      </Link>
      <section className="page-heading">
        <div>
          <h1>{id ? "Editar topologia" : "Nova topologia"}</h1>
        </div>
        <div className="action-group">
          <Link className="button ghost" href={id ? "/topologies/" + id : "/mine"}>
            Cancelar
          </Link>
          <button
            type="submit"
            form="topology-editor"
            className="button"
            disabled={busy || !title.trim() || !preview}
          >
            {busy ? "Salvando…" : "Salvar topologia"}
          </button>
        </div>
      </section>
      <form id="topology-editor" onSubmit={submit} className="editor-layout">
        <div className="editor-fields">
          <h2>Metadados</h2>
          <label>
            Nome
            <input
              name="title"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Rede de campus com redundância"
            />
          </label>
          <label>
            Descrição
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qual cenário esta topologia representa?"
            />
          </label>
          <label>
            Visibilidade
            <select
              name="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
            >
              <option value="PRIVATE">Privada — apenas você e administradores</option>
              <option value="PUBLIC">Pública — disponível na comunidade</option>
            </select>
          </label>
          <div className="editor-label">
            <label htmlFor="graph-json">Topologia JSON</label>
            <label className="file-button">
              <Icon name="download" size={16} />
              Importar arquivo
              <input type="file" accept=".json,application/json" onChange={importFile} />
            </label>
          </div>
          <textarea
            className="code-editor"
            id="graph-json"
            spellCheck={false}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={24}
            aria-invalid={!!validation}
            aria-describedby="json-validation"
            required
          />
          <p
            id="json-validation"
            className={validation ? "error" : "field-hint"}
            role="status"
          >
            {validation ||
              (preview
                ? graphNodeCount(preview) + " nós · " + preview.links.length + " links"
                : "")}
          </p>
          <p className="field-hint">
            Formato KNS v1: nodes pode ser a quantidade de nós ou uma lista tipada com
            IDs estáveis; links contém from, to, delay, bandwidth e loss (0 a 1).
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <aside className="preview-panel">
          <div className="preview-heading">
            <h2>Prévia da rede</h2>
          </div>
          {preview ? (
            <GraphPreview graph={preview} large interactive />
          ) : (
            <div className="empty-panel">
              <p>JSON inválido. Revise a estrutura para visualizar a rede.</p>
            </div>
          )}
        </aside>
      </form>
    </>
  );
}
