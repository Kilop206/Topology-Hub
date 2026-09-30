"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-panel">
      <h1>Não foi possível abrir esta página.</h1>
      <p>Tente novamente para retomar seu trabalho.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </section>
  );
}
