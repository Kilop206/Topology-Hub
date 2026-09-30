"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, type User } from "@/lib/api";
import { useAuth } from "./auth";
import { Icon } from "./icon";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState({ google: false, github: false });
  useEffect(() => {
    api<typeof providers>("/auth/oauth/providers")
      .then(setProviders)
      .catch(() => {});
    const code = new URLSearchParams(window.location.search).get("error");
    if (code)
      setError(
        code === "email_in_use"
          ? "Este e-mail já usa outro método de login. Entre com o método original."
          : code === "account_disabled"
            ? "Sua conta foi desativada. Contate o administrador."
            : "Não foi possível concluir o login social. Tente novamente.",
      );
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input = {
      email: form.get("email"),
      password: form.get("password"),
      ...(register ? { displayName: form.get("displayName") } : {}),
    };
    try {
      const user = await api<User>(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setUser(user);
      router.push("/mine");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <h2>{register ? "Crie sua conta" : "Entrar no Topology Hub"}</h2>
        <p className="muted">
          {register
            ? "Crie uma conta para salvar e compartilhar topologias."
            : "Acesse suas topologias e permissões."}
        </p>
        <div className="social-buttons">
          {(["google", "github"] as const).map((name) =>
            providers[name] ? (
              <a className="button secondary" href={"/api/auth/oauth/" + name} key={name}>
                <strong>{name === "google" ? "G" : "GH"}</strong>Continuar com{" "}
                {name === "google" ? "Google" : "GitHub"}
              </a>
            ) : (
              <button
                className="button secondary"
                key={name}
                disabled
                title="O administrador ainda não configurou este provedor"
              >
                {name === "google" ? "Google" : "GitHub"} indisponível
              </button>
            ),
          )}
        </div>
        <div className="or-divider">
          <span>ou use seu e-mail</span>
        </div>
        <form onSubmit={submit}>
          {register && (
            <label>
              Nome
              <input
                name="displayName"
                autoComplete="name"
                required
                maxLength={80}
                placeholder="Como podemos chamar você?"
              />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="voce@exemplo.com"
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
              maxLength={72}
              placeholder={register ? "Pelo menos 12 caracteres" : "Sua senha"}
            />
          </label>
          {register && (
            <p className="field-hint">
              Use uma senha única, com 12 a 72 caracteres (até 72 bytes).
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Aguarde…" : register ? "Criar minha conta" : "Entrar"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Já tem uma conta?" : "Novo por aqui?"}{" "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </div>
    </section>
  );
}
