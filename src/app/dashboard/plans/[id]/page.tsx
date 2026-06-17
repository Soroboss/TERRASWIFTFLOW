import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LotListingCard } from "@/components/dashboard/lot-listing-card";
import { MasterplanImageUpload } from "@/components/plans/masterplan-image-upload";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import { getMasterplan, getMasterplanLots } from "@/lib/actions/masterplans";
import { requireSession } from "@/lib/auth";
import { canManageCatalog, canViewAllData } from "@/lib/auth/permissions";
import { getActiveDealsByPropertyIds } from "@/lib/actions/deals";
import { buildLotHrefMap, dealClientName } from "@/lib/dashboard/overview";
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
  const session = await requireSession();
  const canManage = canManageCatalog(session.profile.role);
  const showSoldLots = canViewAllData(session.profile.role);
  const [masterplan, lots] = await Promise.all([
    getMasterplan(id),
    getMasterplanLots(id),
  ]);

  if (!masterplan) notFound();

  const { libres, reserves, vendus } = countPropertiesByStatus(lots);
  const dealsByProperty = await getActiveDealsByPropertyIds(lots.map((lot) => lot.id));
  const lotHrefById = buildLotHrefMap(
    lots.map((lot) => lot.id),
    dealsByProperty
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{masterplan.name}</h1>
        <p className="text-muted-foreground">Plan de masse — vente cash ou échelonnée par lot</p>
      </div>

      <LotStatusSummary
        libres={libres}
        reserves={reserves}
        vendus={vendus}
        showSold={showSoldLots}
      />

      <MasterplanLotsGrid
        lots={lots}
        totalLots={masterplan.total_lots}
        columns={4}
        getHref={(lot) => lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
        showSoldInLegend={showSoldLots}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Image du plan de masse</CardTitle>
        </CardHeader>
        <CardContent>
          {canManage && (
            <MasterplanImageUpload masterplanId={masterplan.id} imageUrl={masterplan.image_url} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des lots</CardTitle>
        </CardHeader>
        <CardContent>
          {lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun lot disponible à afficher.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lots.map((lot) => {
                const deal = dealsByProperty.get(lot.id);
                const href = lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`;
                return (
                  <LotListingCard
                    key={lot.id}
                    href={href}
                    lotNumber={lot.lot_number}
                    reference={lot.reference}
                    status={lot.status}
                    statusLabel={STATUS_LABELS[lot.status]}
                    priceLabel={formatFCFA(lot.price_total)}
                    photos={lot.photos}
                    footer={
                      deal ? (
                        <p className="text-xs text-primary">
                          Vente {dealClientName(deal.client) ?? "en cours"} →
                        </p>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
