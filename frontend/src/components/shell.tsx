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
  const [navigationOpen, setNavigationOpen] = useState(false);
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
      <aside className={"sidebar" + (navigationOpen ? " navigation-open" : "")}>
        <Link href="/" className="brand" aria-label="UserEx / Topology Hub">
          <span className="brand-mark">
            <Icon name="network" size={24} />
          </span>
          <span className="brand-lockup">
            <strong>
              USER<span>EX</span>
            </strong>
            <small>Topology Hub</small>
          </span>
        </Link>
        <button
          type="button"
          className="icon-button navigation-toggle"
          aria-label="Navegação"
          aria-expanded={navigationOpen}
          aria-controls="primary-navigation"
          onClick={() => setNavigationOpen(!navigationOpen)}
        >
          <Icon name={navigationOpen ? "close" : "menu"} />
        </button>
        <nav
          id="primary-navigation"
          aria-label="Navegação principal"
          onClick={() => setNavigationOpen(false)}
        >
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
        <a
          className="kns-link nav-item"
          href="https://github.com/Kilop206/KNS"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="external" size={18} />
          <span>Simulador KNS</span>
        </a>
        <div className="account">
          {loading ? (
            <span className="tech-label">Carregando conta…</span>
          ) : user ? (
            <>
              <span className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
              <span className="account-name">{user.displayName}</span>
              <small className="tech-label">IA {user.plan}</small>

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
      </aside>
      <div className="main-shell">
        <main id="main-content">
          {(error || connectionError) && (
            <ErrorState message={error || connectionError} />
          )}{" "}
          {children}
        </main>
      </div>
    </div>
  );
}
