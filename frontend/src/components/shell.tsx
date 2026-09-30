"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { Icon } from "./icon";
import { ErrorState } from "./states";
import { api, errorMessage } from "@/lib/api";
export function Shell({ children }: { children: ReactNode }) {
  const { user, loading, setUser, error: connectionError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="UserEx / Topology Hub">
          <span className="brand-mark">
            <Icon name="network" size={24} />
          </span>
          <span className="brand-lockup">
            <strong>
              USER<span>EX</span>
            </strong>
            <small>/ TOPOLOGY HUB</small>
          </span>
        </Link>
        <div className="workspace">
          <Icon name="terminal" size={18} />
          <span>SYS / NETWORK LAB</span>
        </div>
        <nav aria-label="Navegação principal">
          <Link
            title="Explorar topologias"
            className={pathname === "/" ? "nav-item active" : "nav-item"}
            href="/"
          >
            <Icon name="grid" />
            <span>Explorar topologias</span>
          </Link>
          <Link
            title="Minhas topologias"
            className={pathname === "/mine" ? "nav-item active" : "nav-item"}
            href="/mine"
          >
            <Icon name="folder" />
            <span>Minhas topologias</span>
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              title="Administração"
              className={pathname === "/admin" ? "nav-item active" : "nav-item"}
              href="/admin"
            >
              <Icon name="shield" />
              <span>Administração</span>
            </Link>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="tech-label">KNS / ECOSYSTEM</span>
          <p>
            Network architectures
            <br />
            are data.
          </p>
          <a
            href="https://github.com/Kilop206/KNS"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="network" size={16} />
            Simulador KNS
            <Icon name="external" size={13} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <Icon name="terminal" size={14} />
          <span>HUB v0.1.0</span>
          <span className="muted">UserEx</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            <span>USEREX</span> /{" "}
            {pathname === "/admin" ? "ACCESS CONTROL" : "TOPOLOGY REPOSITORY"}
          </span>
          <div className="account">
            {loading ? (
              <span className="tech-label">SESSION / LOADING</span>
            ) : user ? (
              <>
                <span className="avatar">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="account-name">{user.displayName}</span>
                <span className="badge">{user.role}</span>
                <button
                  className="icon-button"
                  title="Sair"
                  aria-label="Sair"
                  disabled={loggingOut}
                  onClick={logout}
                >
                  <Icon name="logout" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-link">
                  Entrar
                </Link>
                <Link href="/register" className="button small">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </header>
        <main id="main-content">
          {(error || connectionError) && (
            <ErrorState message={error || connectionError} />
          )}{" "}
          {children}
        </main>
        <footer>
          <span>USEREX // TOPOLOGY HUB</span>
          <span>Making users feel like coders.</span>
        </footer>
      </div>
    </div>
  );
}
