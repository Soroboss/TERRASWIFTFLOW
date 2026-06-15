import { MasterplanCreateForm } from "@/components/plans/masterplan-create-form";

export default function NouveauPlanPage() {
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
