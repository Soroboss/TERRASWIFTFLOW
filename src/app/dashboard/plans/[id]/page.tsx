import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterplanImageUpload } from "@/components/plans/masterplan-image-upload";
import { statusColorClass } from "@/components/biens/property-status-badge";
import { getMasterplan, getMasterplanLots } from "@/lib/actions/masterplans";
import { getDealByPropertyId } from "@/lib/actions/deals";
import { formatFCFA } from "@/lib/format";
import type { PropertyStatus } from "@/types/database";

const STATUS_LABELS: Record<PropertyStatus, string> = {
  libre: "Libre",
  reserve: "Réservé",
  vendu: "Vendu",
};

interface PageProps {
  params: { id: string };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = params;
  const [masterplan, lots] = await Promise.all([
    getMasterplan(id),
    getMasterplanLots(id),
  ]);

  if (!masterplan) notFound();

  const libres = lots.filter((l) => l.status === "libre").length;
  const reserves = lots.filter((l) => l.status === "reserve").length;
  const vendus = lots.filter((l) => l.status === "vendu").length;

  const lotsWithDeals = await Promise.all(
    lots.map(async (lot) => {
      const deal = await getDealByPropertyId(lot.id);
      return { lot, deal };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{masterplan.name}</h1>
        <p className="text-muted-foreground">Plan de masse — vente échelonnée par lot</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{libres}</p>
            <p className="text-xs text-muted-foreground">Libres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{reserves}</p>
            <p className="text-xs text-muted-foreground">Réservés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{vendus}</p>
            <p className="text-xs text-muted-foreground">Vendus</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{lots.length}/{masterplan.total_lots}</p>
            <p className="text-xs text-muted-foreground">Lots rattachés</p>
          </CardContent>
        </Card>
      </div>

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
          <CardTitle className="text-lg">Grille des lots</CardTitle>
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
                  href={deal ? `/dashboard/deals/${deal.id}` : `/dashboard/biens/${lot.id}`}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className={`mt-1 h-4 w-4 shrink-0 rounded-full ${statusColorClass(lot.status)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      Lot {lot.lot_number ?? lot.reference}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{lot.title}</p>
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

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Libre</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Réservé</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Vendu</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
