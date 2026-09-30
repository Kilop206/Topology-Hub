import Link from "next/link";
import { date, type Topology } from "@/lib/api";
import { Icon } from "./icon";
import { GraphPreview } from "./graph-preview";
export function TopologyCard({ topology: t }: { topology: Topology }) {
  const value = (number: number | null | undefined, unit: string) =>
    number == null
      ? "N/A"
      : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
          number,
        ) +
        " " +
        unit;
  return (
    <Link className="topology-card" href={"/topologies/" + t.id}>
      <div className="card-heading">
        <h2>{t.title}</h2>
        <span className="badge">
          <Icon name={t.visibility === "PUBLIC" ? "globe" : "lock"} size={12} />
          {t.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE"}
        </span>
      </div>
      <code className="topology-id" title={t.id}>
        ID / {t.id}
      </code>
      {t.preview && <GraphPreview graph={t.preview} totalLinks={t.linkCount} />}
      <div className="card-metrics">
        <div>
          <span>NODES</span>
          <strong>{t.nodeCount}</strong>
        </div>
        <div>
          <span>LINKS</span>
          <strong>{t.linkCount}</strong>
        </div>
        <div>
          <span>LINK DELAY · AVG</span>
          <strong>{value(t.metrics?.meanLinkDelayMs, "ms")}</strong>
        </div>
        <div>
          <span>BANDWIDTH · MIN</span>
          <strong>{value(t.metrics?.minimumBandwidthMbps, "Mbps")}</strong>
        </div>
      </div>
      <p className="card-description">{t.description || "Sem descrição."}</p>
      <div className="card-footer">
        <span title={t.ownerName}>{t.ownerName}</span>
        <time>{date(t.updatedAt)}</time>
        <code>REV {t.version + 1}</code>
      </div>
    </Link>
  );
}
