import Link from "next/link";
export default function NotFound() {
  return (
    <section className="empty-panel">
      <h1>Página não encontrada.</h1>
      <p>Essa conexão não leva a uma página disponível.</p>
      <Link href="/" className="button">
        Explorar topologias
      </Link>
    </section>
  );
}
