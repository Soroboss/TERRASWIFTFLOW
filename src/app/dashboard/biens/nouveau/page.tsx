import { PropertyForm } from "@/components/biens/property-form";
import { getMasterplans } from "@/lib/actions/masterplans";

export default async function NouveauBienPage() {
  const masterplans = await getMasterplans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau bien</h1>
        <p className="text-muted-foreground">Enregistrer un terrain ou une maison</p>
      </div>
      <PropertyForm masterplans={masterplans} />
    </div>
  );
}
