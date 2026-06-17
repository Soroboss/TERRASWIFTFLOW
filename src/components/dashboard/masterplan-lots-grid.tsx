import Link from "next/link";
import {
  PROPERTY_STATUS_LABELS,
  propertyStatusColorClass,
  propertyStatusDotClass,
} from "@/lib/property-status";
import type { PropertyStatus } from "@/types/database";

export interface MasterplanLotGridItem {
  id: string;
  status: PropertyStatus;
  lot_number?: string | null;
  reference?: string;
  title?: string;
}

interface MasterplanLotsGridProps {
  lots: MasterplanLotGridItem[];
  totalLots?: number;
  columns?: number;
  getHref?: (lot: MasterplanLotGridItem) => string | null;
  emptyMessage?: string;
  showLegend?: boolean;
  title?: string;
}

export function MasterplanLotsGrid({
  lots,
  totalLots,
  columns = 6,
  getHref,
  emptyMessage = "Aucun lot rattaché à ce plan.",
  showLegend = true,
  title = "Plan de masse",
}: MasterplanLotsGridProps) {
  const placeholderCount = Math.max(0, (totalLots ?? lots.length) - lots.length);
  const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  if (lots.length === 0 && placeholderCount === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-2 sm:p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="grid gap-1" style={gridStyle}>
        {lots.map((lot) => {
          const label = lot.lot_number ?? lot.reference ?? lot.title ?? "Lot";
          const href = getHref?.(lot) ?? null;
          const cell = (
            <div
              title={`${label} — ${PROPERTY_STATUS_LABELS[lot.status]}`}
              className={`aspect-square rounded-sm transition-transform hover:scale-105 ${propertyStatusColorClass(lot.status)}`}
            />
          );

          if (href) {
            return (
              <Link key={lot.id} href={href} aria-label={`${label}, ${PROPERTY_STATUS_LABELS[lot.status]}`}>
                {cell}
              </Link>
            );
          }

          return <div key={lot.id}>{cell}</div>;
        })}
        {Array.from({ length: placeholderCount }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="aspect-square rounded-sm border border-dashed border-muted-foreground/20 bg-muted/40"
            title="Lot non renseigné"
          />
        ))}
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground sm:text-xs">
          {(["libre", "reserve", "vendu"] as PropertyStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${propertyStatusDotClass(status)}`} />
              {PROPERTY_STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
