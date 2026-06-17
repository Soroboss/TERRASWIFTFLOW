import Image from "next/image";
import Link from "next/link";
import {
  formatLotNumberReference,
  getLotPhotoUrl,
} from "@/lib/catalog-visibility";
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
  reference?: string | null;
  title?: string | null;
  photos?: string[] | null;
}

interface MasterplanLotsGridProps {
  lots: MasterplanLotGridItem[];
  totalLots?: number;
  columns?: number;
  maxVisible?: number;
  getHref?: (lot: MasterplanLotGridItem) => string | null;
  emptyMessage?: string;
  showLegend?: boolean;
  showSoldInLegend?: boolean;
  title?: string;
}

function LotGridCell({
  lot,
  href,
}: {
  lot: MasterplanLotGridItem;
  href: string | null;
}) {
  const { number, reference } = formatLotNumberReference(lot);
  const photoUrl = getLotPhotoUrl(lot.photos);
  const statusLabel = PROPERTY_STATUS_LABELS[lot.status];
  const ariaLabel = [number, reference, statusLabel].filter(Boolean).join(", ");

  const content = (
    <div className="flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-0.5 px-1.5 pb-1 pt-1.5 text-center leading-tight">
        {number && (
          <p className="truncate text-[9px] font-semibold sm:text-[10px]">{number}</p>
        )}
        {reference && (
          <p className="truncate text-[8px] text-muted-foreground sm:text-[9px]">{reference}</p>
        )}
      </div>
      <div className="relative mx-1.5 mb-1.5 aspect-square overflow-hidden rounded-sm">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div
            className={`h-full w-full ${propertyStatusColorClass(lot.status)}`}
            aria-hidden
          />
        )}
        <span
          className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-1 ring-white ${propertyStatusDotClass(lot.status)}`}
          title={statusLabel}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="block h-full">
        {content}
      </Link>
    );
  }

  return <div aria-label={ariaLabel}>{content}</div>;
}

export function MasterplanLotsGrid({
  lots,
  totalLots,
  columns = 4,
  maxVisible,
  getHref,
  emptyMessage = "Aucun lot rattaché à ce plan.",
  showLegend = true,
  showSoldInLegend = true,
  title = "Plan de masse",
}: MasterplanLotsGridProps) {
  const visibleLots = maxVisible ? lots.slice(0, maxVisible) : lots;
  const hiddenCount = maxVisible ? Math.max(0, lots.length - maxVisible) : 0;
  const placeholderCount = Math.max(0, (totalLots ?? lots.length) - lots.length);
  const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const legendStatuses = (["libre", "reserve", "vendu"] as PropertyStatus[]).filter(
    (status) => showSoldInLegend || status !== "vendu"
  );

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
      <div className="grid gap-1.5 sm:gap-2" style={gridStyle}>
        {visibleLots.map((lot) => (
          <LotGridCell key={lot.id} lot={lot} href={getHref?.(lot) ?? null} />
        ))}
        {Array.from({ length: placeholderCount }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="flex aspect-[4/5] flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/20 bg-muted/40 p-2"
            title="Lot non renseigné"
          >
            <span className="text-[9px] text-muted-foreground">—</span>
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground sm:text-xs">
          +{hiddenCount} lot{hiddenCount > 1 ? "s" : ""} — ouvrez le plan de masse pour tout voir
        </p>
      )}
      {showLegend && legendStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground sm:text-xs">
          {legendStatuses.map((status) => (
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
