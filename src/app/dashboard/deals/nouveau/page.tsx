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
        <p className="text-muted-foreground">Associer un bien libre à un client — anti-double-vente activé</p>
      </div>
      <DealForm properties={properties} clients={clients} />
    </div>
  );
}
