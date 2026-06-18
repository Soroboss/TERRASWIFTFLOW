import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { DEMO_LOT_STATS, DEMO_LOTS, DEMO_PROGRAM_NAME } from "@/lib/dashboard-demo";

export function LandingMasterplanPreview() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-primary">TerraSwiftFlow</p>
        <p className="text-[10px] text-muted-foreground sm:text-xs">{DEMO_PROGRAM_NAME}</p>
      </div>
      <LotStatusSummary
        libres={DEMO_LOT_STATS.libres}
        reserves={DEMO_LOT_STATS.reserves}
        vendus={DEMO_LOT_STATS.vendus}
        compact
      />
      <div className="overflow-hidden rounded-xl border bg-slate-950 p-2 ring-1 ring-white/10">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Plan interactif · lots cliquables
        </p>
        <div className="rounded-lg bg-slate-900/80 p-1.5">
          <MasterplanLotsGrid
            lots={DEMO_LOTS.slice(0, 24)}
            totalLots={24}
            columns={6}
            showLegend
            title="Grille des lots"
          />
        </div>
      </div>
    </div>
  );
}
