import { Suspense } from "react";
import { DealForm } from "@/components/deals/deal-form";
import { getAvailableProperties } from "@/lib/actions/deals";
import { getClients } from "@/lib/actions/clients";

export default async function NouveauDealPage() {
  const [properties, clients] = await Promise.all([
    getAvailableProperties(),
    getClients(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle vente</h1>
        <p className="text-muted-foreground">
          Cash ou échelonné — acompte, reliquat et contrat ACD, lettre villageoise ou approbation
          travaux
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Chargement du formulaire…</p>}>
        <DealForm properties={properties} clients={clients} />
      </Suspense>
    </div>
  );
}
