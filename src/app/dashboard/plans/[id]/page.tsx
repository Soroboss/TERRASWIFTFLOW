import { notFound } from "next/navigation";
import { LotListingCard } from "@/components/dashboard/lot-listing-card";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import { MasterplanMapSection } from "@/components/plans/masterplan-map-section";
import type { MasterplanMapLot } from "@/components/plans/masterplan-interactive-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMasterplan, getMasterplanLots } from "@/lib/actions/masterplans";
import { requireSession } from "@/lib/auth";
import { canManageCatalog, canViewAllData } from "@/lib/auth/permissions";
import { getActiveDealsByPropertyIds } from "@/lib/actions/deals";
import { buildLotHrefMap, dealClientName, resolveLotHref } from "@/lib/dashboard/overview";
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
    dealsByProperty,
    { role: session.profile.role, userId: session.userId }
  );

  const viewer = { role: session.profile.role, userId: session.userId };
  const mapLots: MasterplanMapLot[] = lots.map((lot) => ({
    id: lot.id,
    status: lot.status,
    lot_number: lot.lot_number,
    reference: lot.reference,
    title: lot.title,
    price_total: lot.price_total,
    map_zone: lot.map_zone ?? null,
    href: resolveLotHref(lot.id, dealsByProperty.get(lot.id), viewer),
  }));

  const zonesCount = mapLots.filter((l) => l.map_zone).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{masterplan.name}</h1>
        <p className="text-muted-foreground">
          Plan de masse interactif — cliquez sur chaque parcelle pour accéder au lot ou à la vente
        </p>
      </div>

      <LotStatusSummary
        libres={libres}
        reserves={reserves}
        vendus={vendus}
        showSold={showSoldLots}
      />

      <MasterplanMapSection
        masterplanId={masterplan.id}
        imageUrl={masterplan.image_url}
        lots={mapLots}
        canEdit={canManage}
        showSoldLots={showSoldLots}
      />

      <MasterplanLotsGrid
        lots={lots}
        totalLots={masterplan.total_lots}
        columns={4}
        getHref={(lot) => lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
        showSoldInLegend={showSoldLots}
        title={zonesCount > 0 ? "Vue synthétique des lots" : "Plan de masse"}
      />

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
