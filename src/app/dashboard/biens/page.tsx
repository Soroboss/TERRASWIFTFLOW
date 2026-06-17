import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyStatusBadge } from "@/components/biens/property-status-badge";
import { PropertyFilters } from "@/components/biens/property-filters";
import { LotStatusSummary } from "@/components/dashboard/lot-status-summary";
import { getPropertiesList, type PropertyListFilters } from "@/lib/actions/properties";
import { getPropertyStatusCounts } from "@/lib/actions/masterplans";
import { requireSession } from "@/lib/auth";
import { canManageCatalog, canViewAllData } from "@/lib/auth/permissions";
import { formatLotNumberReference, getLotPhotoUrl } from "@/lib/catalog-visibility";
import { propertyStatusColorClass } from "@/lib/property-status";
import { formatFCFA } from "@/lib/format";
import type { PropertyStatus, PropertyType } from "@/types/database";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}

export default async function BiensPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const canManage = canManageCatalog(session.profile.role);
  const showSoldLots = canViewAllData(session.profile.role);
  const params = await searchParams;
  const filters: PropertyListFilters = {
    q: params.q,
    status: params.status as PropertyStatus | undefined,
    type: params.type as PropertyType | undefined,
  };

  const [properties, counts] = await Promise.all([
    getPropertiesList(filters),
    getPropertyStatusCounts(),
  ]);

  const hasFilters = Boolean(params.q || params.status || params.type);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biens immobiliers</h1>
          <p className="text-muted-foreground">
            Terrains et maisons — cash ou paiement échelonné
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/dashboard/biens/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau bien
            </Link>
          </Button>
        )}
      </div>

      <LotStatusSummary
        libres={counts.libres}
        reserves={counts.reserves}
        vendus={counts.vendus}
        showSold={showSoldLots}
      />

      <PropertyFilters
        q={params.q}
        status={params.status}
        type={params.type}
        hideSoldStatus={!showSoldLots}
      />

      <p className="text-sm text-muted-foreground">
        {properties.length} bien{properties.length !== 1 ? "s" : ""} affiché
        {properties.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtres actifs)" : ` sur ${counts.total}`}
      </p>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Aucun bien ne correspond à vos filtres."
                : "Aucun bien enregistré pour le moment."}
            </p>
            {!hasFilters && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/biens/nouveau">Ajouter votre premier bien</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const { number, reference } = formatLotNumberReference(property);
            const photoUrl = getLotPhotoUrl(property.photos);
            return (
              <Link key={property.id} href={`/dashboard/biens/${property.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-[16/10] w-full border-b bg-muted">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div
                        className={`h-full w-full ${propertyStatusColorClass(property.status)}`}
                        aria-hidden
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {number && <p className="truncate font-semibold">{number}</p>}
                        {reference && (
                          <p className="truncate text-xs text-muted-foreground">{reference}</p>
                        )}
                        {!number && !reference && (
                          <p className="truncate font-semibold">{property.title}</p>
                        )}
                      </div>
                      <PropertyStatusBadge status={property.status} />
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatFCFA(property.price_total)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{property.type === "terrain" ? "Terrain" : "Maison"}</span>
                      {property.surface_m2 && <span>• {property.surface_m2} m²</span>}
                      {property.location_label && <span>• {property.location_label}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
