import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { MasterplanPlanCard } from "@/components/plans/masterplan-plan-card";
import { getMasterplansWithLots } from "@/lib/actions/masterplans";
import { countPropertiesByStatus } from "@/lib/property-status";

export default async function PlansPage() {
  const plansWithLots = await getMasterplansWithLots();

  const allLots = plansWithLots.flatMap((p) => p.lots);
  const globalStats = countPropertiesByStatus(allLots);
  const totalDeclared = plansWithLots.reduce((sum, p) => sum + p.masterplan.total_lots, 0);
  const totalRenseignes = allLots.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plans de masse</h1>
          <p className="text-muted-foreground">
            Vue couleur des lots — libre, réservé, vendu
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau plan
          </Link>
        </Button>
      </div>

      {plansWithLots.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">Vue globale — {plansWithLots.length} programme(s)</p>
              <p className="text-sm text-muted-foreground">
                {totalRenseignes}/{totalDeclared} lots renseignés sur l&apos;ensemble
              </p>
            </div>
            <LotStatusSummary
              libres={globalStats.libres}
              reserves={globalStats.reserves}
              vendus={globalStats.vendus}
            />
          </CardContent>
        </Card>
      )}

      {plansWithLots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="max-w-md text-muted-foreground">
              Importez votre plan de masse, définissez le nombre de lots et rattachez vos biens
              terrain pour obtenir la même grille colorée que sur le tableau de bord.
            </p>
            <Button asChild>
              <Link href="/dashboard/plans/nouveau">Créer mon premier plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plansWithLots.map((plan) => (
            <MasterplanPlanCard key={plan.masterplan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
