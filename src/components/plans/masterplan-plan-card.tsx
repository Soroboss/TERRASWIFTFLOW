import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import type { MasterplanWithLots } from "@/lib/actions/masterplans";
import { countPropertiesByStatus } from "@/lib/property-status";

interface MasterplanPlanCardProps {
  plan: MasterplanWithLots;
  showSoldLots?: boolean;
}

export function MasterplanPlanCard({ plan, showSoldLots = true }: MasterplanPlanCardProps) {
  const { masterplan, lots } = plan;
  const stats = countPropertiesByStatus(lots);
  const progress =
    masterplan.total_lots > 0
      ? Math.min(100, Math.round((lots.length / masterplan.total_lots) * 100))
      : 0;

  return (
    <Link href={`/dashboard/plans/${masterplan.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {masterplan.image_url && (
          <div className="relative aspect-[16/7] w-full border-b bg-muted">
            <Image
              src={masterplan.image_url}
              alt={`Plan ${masterplan.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <CardContent className="space-y-4 p-4">
          <div>
            <p className="font-semibold">{masterplan.name}</p>
            <p className="text-sm text-muted-foreground">
              {lots.length}/{masterplan.total_lots} lot
              {masterplan.total_lots !== 1 ? "s" : ""} renseigné
              {lots.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{progress}% du plan renseigné</p>
          </div>

          <LotStatusSummary
            libres={stats.libres}
            reserves={stats.reserves}
            vendus={stats.vendus}
            compact
            showSold={showSoldLots}
          />

          <MasterplanLotsGrid
            lots={lots}
            totalLots={masterplan.total_lots}
            columns={4}
            maxVisible={48}
            showLegend={false}
            showSoldInLegend={showSoldLots}
            emptyMessage="Aucun lot pour l'instant."
          />
        </CardContent>
      </Card>
    </Link>
  );
}
