import type { PlanUsage } from "@/lib/actions/tenant-summary";

interface PlanUsageSummaryProps {
  usage: PlanUsage;
}

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number | null;
}) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : null;
  const nearLimit = max !== null && used >= max;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className={nearLimit ? "font-medium text-amber-700" : "text-muted-foreground"}>
          {used}
          {max !== null ? ` / ${max}` : " (illimité)"}
        </span>
      </div>
      {max !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${nearLimit ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PlanUsageSummary({ usage }: PlanUsageSummaryProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">Utilisation de votre espace</p>
      <UsageBar label="Biens enregistrés" used={usage.properties} max={null} />
      <UsageBar label="Agents actifs" used={usage.agents} max={usage.maxAgents} />
      <UsageBar label="Ventes en cours" used={usage.activeDeals} max={null} />
      <UsageBar label="Plans de masse" used={usage.masterplans} max={null} />
    </div>
  );
}
