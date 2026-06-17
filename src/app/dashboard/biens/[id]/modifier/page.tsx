import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/biens/property-form";
import { getMasterplans } from "@/lib/actions/masterplans";
import { getProperty } from "@/lib/actions/properties";
import { requireSession } from "@/lib/auth";
import { requireManagerOrOwner } from "@/lib/auth/access";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModifierBienPage({ params }: PageProps) {
  const session = await requireSession();
  requireManagerOrOwner(session, "/dashboard/biens");
  const { id } = await params;
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
