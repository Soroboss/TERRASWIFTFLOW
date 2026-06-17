import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterplanImageUpload } from "@/components/plans/masterplan-image-upload";
import { statusColorClass } from "@/components/biens/property-status-badge";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import { getMasterplan, getMasterplanLots } from "@/lib/actions/masterplans";
import { getDealByPropertyId } from "@/lib/actions/deals";
import { countPropertiesByStatus } from "@/lib/property-status";
import { formatFCFA } from "@/lib/format";
import type { PropertyStatus } from "@/types/database";

const STATUS_LABELS: Record<PropertyStatus, string> = {
  libre: "Libre",
  reserve: "Réservé",
  vendu: "Vendu",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [masterplan, lots] = await Promise.all([
    getMasterplan(id),
    getMasterplanLots(id),
  ]);

  if (!masterplan) notFound();

  const { libres, reserves, vendus } = countPropertiesByStatus(lots);

  const lotHrefById = new Map<string, string>();
  const lotsWithDeals = await Promise.all(
    lots.map(async (lot) => {
      const deal = await getDealByPropertyId(lot.id);
      const href = deal ? `/dashboard/deals/${deal.id}` : `/dashboard/biens/${lot.id}`;
      lotHrefById.set(lot.id, href);
      return { lot, deal };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{masterplan.name}</h1>
        <p className="text-muted-foreground">Plan de masse — vente cash ou échelonnée par lot</p>
      </div>

      <LotStatusSummary libres={libres} reserves={reserves} vendus={vendus} />

      <MasterplanLotsGrid
        lots={lots}
        totalLots={masterplan.total_lots}
        getHref={(lot) => lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Image du plan de masse</CardTitle>
        </CardHeader>
        <CardContent>
          <MasterplanImageUpload masterplanId={masterplan.id} imageUrl={masterplan.image_url} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des lots</CardTitle>
        </CardHeader>
        <CardContent>
          {lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun lot rattaché. Créez des biens terrain et associez-les à ce plan.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lotsWithDeals.map(({ lot, deal }) => (
                <Link
                  key={lot.id}
                  href={lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className={`mt-1 h-4 w-4 shrink-0 rounded-full ${statusColorClass(lot.status)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      Lot {lot.lot_number ?? lot.reference}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{lot.title}</p>
                    <p className="text-xs font-medium">
                      {STATUS_LABELS[lot.status]} · {formatFCFA(lot.price_total)}
                    </p>
                    {deal && (
                      <p className="text-xs text-primary">
                        Vente {Array.isArray(deal.client) ? deal.client[0]?.full_name : deal.client?.full_name ?? "en cours"} →
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
