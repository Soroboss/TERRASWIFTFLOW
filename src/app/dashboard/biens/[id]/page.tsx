import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletePropertyButton } from "@/components/biens/delete-property-button";
import { PropertyStatusBadge } from "@/components/biens/property-status-badge";
import { PropertyPhotoUpload } from "@/components/biens/property-photo-upload";
import { getProperty } from "@/lib/actions/properties";
import { formatFCFA, formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BienDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <PropertyStatusBadge status={property.status} />
            <span className="text-xs text-muted-foreground">
              {property.type === "terrain" ? "Terrain" : "Maison"}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-muted-foreground">Réf. {property.reference}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/biens/${id}/modifier`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <DeletePropertyButton propertyId={id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix total</span>
              <span className="font-semibold">{formatFCFA(property.price_total)}</span>
            </div>
            {property.surface_m2 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Surface</span>
                <span>{property.surface_m2} m²</span>
              </div>
            )}
            {property.price_per_m2 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix au m²</span>
                <span>{formatFCFA(property.price_per_m2)}</span>
              </div>
            )}
            {property.location_label && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Localisation</span>
                <span>{property.location_label}</span>
              </div>
            )}
            {property.lot_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">N° de lot</span>
                <span>{property.lot_number}</span>
              </div>
            )}
            {property.rooms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pièces</span>
                <span>{property.rooms}</span>
              </div>
            )}
            {property.construction_status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Construction</span>
                <span>{property.construction_status}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le</span>
              <span>{formatDate(property.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyPhotoUpload propertyId={property.id} photos={property.photos} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
