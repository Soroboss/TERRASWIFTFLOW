import { MasterplanCreateForm } from "@/components/plans/masterplan-create-form";
import { requireSession } from "@/lib/auth";
import { requireManagerOrOwner } from "@/lib/auth/access";

export default async function NouveauPlanPage() {
  const session = await requireSession();
  requireManagerOrOwner(session, "/dashboard/plans");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau plan de masse</h1>
        <p className="text-muted-foreground">Créer un lotissement ou projet foncier</p>
      </div>
      <MasterplanCreateForm />
    </div>
  );
}
