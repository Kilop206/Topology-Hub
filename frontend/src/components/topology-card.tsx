import Link from "next/link";
import { date, type Topology } from "@/lib/api";
import { Icon } from "./icon";
import { GraphPreview } from "./graph-preview";

export function TopologyCard({
  topology: t,
  showAuthor = true,
}: {
  topology: Topology;
  showAuthor?: boolean;
}) {
  const value = (number: number | null | undefined, unit: string) =>
    number == null
      ? "—"
      : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(number) +
        " " +
        unit;
  return (
    <Link className="topology-card" href={"/topologies/" + t.id}>
      <div className="card-preview">
        {t.preview && <GraphPreview graph={t.preview} totalLinks={t.linkCount} />}
      </div>
      <div className="card-content">
        <div className="card-heading">
          <h2>{t.title}</h2>
          <span className="badge">
            <Icon name={t.visibility === "PUBLIC" ? "globe" : "lock"} size={13} />
            {t.visibility === "PUBLIC" ? "Pública" : "Privada"}
          </span>
        </div>
        <p className="card-description">{t.description || "Sem descrição."}</p>
        <dl className="card-metrics">
          <div>
            <dt>Nós</dt>
            <dd>{t.nodeCount}</dd>
          </div>
          <div>
            <dt>Links</dt>
            <dd>{t.linkCount}</dd>
          </div>
          <div>
            <dt>Delay médio</dt>
            <dd>{value(t.metrics?.meanLinkDelayMs, "ms")}</dd>
          </div>
          <div>
            <dt>Banda mínima</dt>
            <dd>{value(t.metrics?.minimumBandwidthMbps, "Mbps")}</dd>
          </div>
        </dl>
        <div className="card-footer">
          {showAuthor && <span>{t.ownerName}</span>}
          <time dateTime={t.updatedAt} title={t.updatedAt}>
            Atualizada em {date(t.updatedAt)}
          </time>
          <code>rev. {t.version + 1}</code>
        </div>
      </div>
    </Link>
  );
}
