import type { ReactNode } from "react";
import { Icon } from "./icon";
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <span className="tech-label">Não foi possível concluir</span>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "Nenhuma topologia encontrada.",
  query,
  children,
}: {
  title?: string;
  query?: string;
  children?: ReactNode;
}) {
  return (
    <section className="empty-panel">
      <Icon name="network" size={32} />
      <h2>{title}</h2>
      {query && <p className="query-display">Busca: “{query}”</p>}
      <p>Altere a busca ou importe uma topologia no formato KNS.</p>
      {children}
    </section>
  );
}
export function LoadingState({ label = "Carregando topologias…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="tech-label">{label}</span>
      <div className="progress-line" />
    </div>
  );
}
