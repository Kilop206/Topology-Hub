"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, date, errorMessage, type User, type Listing } from "@/lib/api";
import { useAuth } from "./auth";
import { Icon } from "./icon";
type Users = { items: User[]; total: number; page: number; size: number };
type Stats = {
  users: number;
  topologies: number;
  publicTopologies: number;
  activeUsers: number;
};
type Audit = {
  id: string;
  action: string;
  targetId: string;
  actorId: string;
  createdAt: string;
};
export function Admin() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats>();
  const [users, setUsers] = useState<Users>();
  const [topologies, setTopologies] = useState<Listing>();
  const [audit, setAudit] = useState<Audit[]>([]);
  const [tab, setTab] = useState<"users" | "topologies" | "audit">("users");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [fetching, setFetching] = useState(true);
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const abort = new AbortController();
    setError("");
    setFetching(true);
    Promise.all([
      api<Stats>("/admin/stats", { signal: abort.signal }),
      api<Users>("/admin/users?page=" + page, { signal: abort.signal }),
      api<Listing>("/topologies?scope=all&size=20&page=" + page, {
        signal: abort.signal,
      }),
      api<Audit[]>("/admin/audit", { signal: abort.signal }),
    ])
      .then(([s, u, t, a]) => {
        setStats(s);
        setUsers(u);
        setTopologies(t);
        setAudit(a);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!abort.signal.aborted) setFetching(false);
      });
    return () => abort.abort();
  }, [user, page, refresh]);
  async function change(target: User, role: User["role"], active: boolean) {
    if (
      !confirm(
        "Alterar o acesso de " +
          target.displayName +
          "? As sessões existentes serão encerradas.",
      )
    )
      return;
    setBusy(target.id);
    try {
      await api("/admin/users/" + target.id, {
        method: "PATCH",
        body: JSON.stringify({ role, active }),
      });
      setRefresh((r) => r + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function remove(id: string) {
    if (!confirm("Excluir permanentemente esta topologia?")) return;
    setBusy(id);
    try {
      await api("/topologies/" + id, { method: "DELETE" });
      setRefresh((r) => r + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  if (loading) return <p>Verificando acesso…</p>;
  if (user?.role !== "ADMIN")
    return (
      <section className="empty-panel">
        <Icon name="shield" size={40} />
        <h1>Acesso administrativo.</h1>
        <p>Entre com uma conta de administrador para continuar.</p>
        <Link href="/login" className="button">
          Entrar
        </Link>
      </section>
    );
  const total = tab === "users" ? users?.total : topologies?.total;
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <Icon name="shield" size={17} />
            ACCESS / ADMIN
          </div>
          <h1>Administração</h1>
          <p>
            Gerencie permissões, modere topologias e inspecione o histórico de
            alterações.
          </p>
        </div>
      </section>
      <div className="stats-grid">
        {[
          ["Usuários", stats?.users],
          ["Contas ativas", stats?.activeUsers],
          ["Topologias", stats?.topologies],
          ["Publicadas", stats?.publicTopologies],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="catalogue-toolbar">
        <div className="tabs">
          {(["users", "topologies", "audit"] as const).map((value) => (
            <button
              key={value}
              className={tab === value ? "selected" : ""}
              onClick={() => {
                setTab(value);
                setPage(0);
              }}
            >
              {value === "users"
                ? "Usuários"
                : value === "topologies"
                  ? "Topologias"
                  : "Atividade recente"}
            </button>
          ))}
        </div>
        <button className="text-link" onClick={() => setRefresh((r) => r + 1)}>
          Atualizar
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {fetching ? (
        <p className="loading-text">Carregando administração…</p>
      ) : (
        <div className="table-wrap">
          {tab === "users" ? (
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users?.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.displayName}</strong>
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <select
                        aria-label={"Perfil de " + u.displayName}
                        disabled={u.id === user.id || !!busy}
                        value={u.role}
                        onChange={(e) =>
                          change(u, e.target.value as User["role"], u.active)
                        }
                      >
                        <option value="USER">Usuário</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </td>
                    <td>
                      <span className={"badge " + (u.active ? "public" : "")}>
                        {u.active ? "Ativo" : "Desativado"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-link"
                        disabled={u.id === user.id || !!busy}
                        onClick={() => change(u, u.role, !u.active)}
                      >
                        {u.active ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "topologies" ? (
            <table>
              <thead>
                <tr>
                  <th>Topologia</th>
                  <th>Autor</th>
                  <th>Visibilidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {topologies?.items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={"/topologies/" + t.id}>{t.title}</Link>
                      <small>
                        {t.nodeCount} nós · {t.linkCount} conexões
                      </small>
                    </td>
                    <td>{t.ownerName}</td>
                    <td>{t.visibility === "PUBLIC" ? "Pública" : "Privada"}</td>
                    <td>
                      <div className="action-group">
                        <Link
                          className="text-link"
                          href={"/topologies/" + t.id + "/edit"}
                        >
                          Editar
                        </Link>
                        <button
                          className="danger-link"
                          disabled={!!busy}
                          onClick={() => remove(t.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Registro</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {{
                        "topology.create": "Topologia criada",
                        "topology.update": "Topologia atualizada",
                        "topology.delete": "Topologia excluída",
                        "user.access.update": "Acesso alterado",
                      }[a.action] || a.action}
                    </td>
                    <td className="id-cell">{a.targetId}</td>
                    <td>{date(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab !== "audit" && !!total && total > 20 && (
        <nav className="pagination" aria-label="Paginação">
          <button
            className="button secondary"
            disabled={page === 0 || fetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(total / 20)}
          </span>
          <button
            className="button secondary"
            disabled={(page + 1) * 20 >= total || fetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </>
  );
}
