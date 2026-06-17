import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanLotsGrid } from "@/components/dashboard/masterplan-lots-grid";
import { getMasterplansWithLots } from "@/lib/actions/masterplans";
import { countPropertiesByStatus } from "@/lib/property-status";

export default async function PlansPage() {
  const plansWithLots = await getMasterplansWithLots();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans de masse</h1>
          <p className="text-muted-foreground">
            Visualisez vos lotissements et le statut de chaque lot
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau plan
          </Link>
        </Button>
      </div>

      {plansWithLots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun plan de masse enregistré.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plansWithLots.map(({ masterplan, lots }) => {
            const stats = countPropertiesByStatus(lots);
            return (
              <Link key={masterplan.id} href={`/dashboard/plans/${masterplan.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <p className="font-semibold">{masterplan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lots.length}/{masterplan.total_lots} lot
                        {masterplan.total_lots !== 1 ? "s" : ""} renseigné
                        {lots.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <LotStatusSummary
                      libres={stats.libres}
                      reserves={stats.reserves}
                      vendus={stats.vendus}
                      compact
                    />

                    <MasterplanLotsGrid
                      lots={lots}
                      totalLots={masterplan.total_lots}
                      columns={8}
                      maxVisible={48}
                      showLegend={false}
                      emptyMessage="Aucun lot pour l'instant."
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
