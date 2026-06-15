import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyStatusBadge } from "@/components/biens/property-status-badge";
import { getProperties } from "@/lib/actions/properties";
import { formatFCFA } from "@/lib/format";

export default async function BiensPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biens immobiliers</h1>
          <p className="text-muted-foreground">
            {properties.length} bien{properties.length !== 1 ? "s" : ""} enregistré
            {properties.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/biens/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau bien
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Aucun bien enregistré pour le moment.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/biens/nouveau">Ajouter votre premier bien</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/dashboard/biens/${property.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{property.title}</p>
                      <p className="text-xs text-muted-foreground">{property.reference}</p>
                    </div>
                    <PropertyStatusBadge status={property.status} />
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatFCFA(property.price_total)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{property.type === "terrain" ? "Terrain" : "Maison"}</span>
                    {property.lot_number && <span>• Lot {property.lot_number}</span>}
                    {property.surface_m2 && <span>• {property.surface_m2} m²</span>}
                    {property.location_label && <span>• {property.location_label}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
