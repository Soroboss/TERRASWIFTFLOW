import Link from "next/link";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import {
  MasterplanLotsGrid,
  type MasterplanLotGridItem,
} from "@/components/dashboard/masterplan-lots-grid";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DashboardOverviewPanelProps {
  organizationName: string;
  programName?: string | null;
  trialDaysLeft?: number | null;
  libres: number;
  reserves: number;
  vendus: number;
  lots: MasterplanLotGridItem[];
  totalLots?: number;
  collectedThisMonth: number;
  getLotHref?: (lot: MasterplanLotGridItem) => string | null;
  programHref?: string | null;
  showCollectedBanner?: boolean;
  gridMaxVisible?: number;
  className?: string;
  shadow?: "sm" | "lg";
}

export function DashboardOverviewPanel({
  organizationName,
  programName,
  trialDaysLeft,
  libres,
  reserves,
  vendus,
  lots,
  totalLots,
  collectedThisMonth,
  getLotHref,
  programHref,
  showCollectedBanner = true,
  gridMaxVisible,
  className,
  shadow = "sm",
}: DashboardOverviewPanelProps) {
  const programLabel = programName ?? organizationName;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 sm:p-5",
        shadow === "lg" ? "shadow-2xl shadow-primary/10" : "shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary sm:text-sm">TerraSwiftFlow</p>
          {programHref ? (
            <Link href={programHref} className="text-[10px] text-muted-foreground hover:text-primary sm:text-xs">
              {programLabel}
            </Link>
          ) : (
            <p className="text-[10px] text-muted-foreground sm:text-xs">{programLabel}</p>
          )}
        </div>
        {trialDaysLeft !== null && trialDaysLeft !== undefined && trialDaysLeft >= 0 && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 sm:text-xs">
            {trialDaysLeft} j. essai
          </span>
        )}
      </div>

      <LotStatusSummary libres={libres} reserves={reserves} vendus={vendus} />

      <MasterplanLotsGrid
        lots={lots}
        totalLots={totalLots}
        maxVisible={gridMaxVisible}
        getHref={getLotHref}
        emptyMessage="Créez un plan de masse et rattachez vos lots pour les voir ici."
      />

      {showCollectedBanner && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2 sm:p-3">
          <p className="text-[10px] text-emerald-900 sm:text-sm">
            Encaissé ce mois :{" "}
            <span className="font-bold">{formatFCFA(collectedThisMonth)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
