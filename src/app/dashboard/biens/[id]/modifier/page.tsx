import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/biens/property-form";
import { getMasterplans } from "@/lib/actions/masterplans";
import { getProperty } from "@/lib/actions/properties";

interface PageProps {
  params: { id: string };
}

export default async function ModifierBienPage({ params }: PageProps) {
  const { id } = params;
  const [property, masterplans] = await Promise.all([
    getProperty(id),
    getMasterplans(),
  ]);

  if (!property) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier le bien</h1>
        <p className="text-muted-foreground">{property.title}</p>
      </div>
      <PropertyForm property={property} masterplans={masterplans} />
    </div>
  );
}
