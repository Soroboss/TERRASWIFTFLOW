import { ActivityForm } from "@/components/activities/activity-form";
import { getClients } from "@/lib/actions/clients";

export default async function NouvelleRelancePage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planifier une relance</h1>
        <p className="text-muted-foreground">Appel, visite ou relance de paiement</p>
      </div>
      <ActivityForm clients={clients} />
    </div>
  );
}
