"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createPropertyAction,
  updatePropertyAction,
  type PropertyInput,
} from "@/lib/actions/properties";
import type { Masterplan, Property, PropertyStatus, PropertyType } from "@/types/database";

interface PropertyFormProps {
  property?: Property;
  masterplans: Masterplan[];
}

export function PropertyForm({ property, masterplans }: PropertyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<PropertyType>(property?.type ?? "terrain");
  const [title, setTitle] = useState(property?.title ?? "");
  const [reference, setReference] = useState(property?.reference ?? "");
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? "libre");
  const [priceTotal, setPriceTotal] = useState(String(property?.price_total ?? ""));
  const [surfaceM2, setSurfaceM2] = useState(String(property?.surface_m2 ?? ""));
  const [pricePerM2, setPricePerM2] = useState(String(property?.price_per_m2 ?? ""));
  const [locationLabel, setLocationLabel] = useState(property?.location_label ?? "");
  const [lotNumber, setLotNumber] = useState(property?.lot_number ?? "");
  const [masterplanId, setMasterplanId] = useState(property?.masterplan_id ?? "");
  const [rooms, setRooms] = useState(String(property?.rooms ?? ""));
  const [constructionStatus, setConstructionStatus] = useState(
    property?.construction_status ?? ""
  );

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const input: PropertyInput = {
      type,
      title,
      reference,
      status,
      price_total: Number(priceTotal.replace(/\s/g, "")),
      surface_m2: surfaceM2 ? Number(surfaceM2) : null,
      price_per_m2: pricePerM2 ? Number(pricePerM2) : null,
      location_label: locationLabel || null,
      lot_number: type === "terrain" ? lotNumber || null : null,
      masterplan_id: type === "terrain" && masterplanId ? masterplanId : null,
      rooms: type === "maison" && rooms ? Number(rooms) : null,
      construction_status: type === "maison" ? constructionStatus || null : null,
      photos: property?.photos ?? [],
    };

    const result = property
      ? await updatePropertyAction(property.id, input)
      : await createPropertyAction(input);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property ? "Modifier le bien" : "Nouveau bien"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type de bien</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType)}
            >
              <option value="terrain">Terrain / Parcelle</option>
              <option value="maison">Maison (VEFA)</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PropertyStatus)}
            >
              <option value="libre">Libre</option>
              <option value="reserve">Réservé</option>
              <option value="vendu">Vendu</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Parcelle A12 — Résidence Les Palmiers"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reference">Référence interne</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="REF-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Prix total (FCFA)</Label>
            <Input
              id="price"
              type="number"
              value={priceTotal}
              onChange={(e) => setPriceTotal(e.target.value)}
              placeholder="1250000"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="surface">Surface (m²)</Label>
            <Input
              id="surface"
              type="number"
              value={surfaceM2}
              onChange={(e) => setSurfaceM2(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerM2">Prix au m² (FCFA)</Label>
            <Input
              id="pricePerM2"
              type="number"
              value={pricePerM2}
              onChange={(e) => setPricePerM2(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Input
            id="location"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="Ex. Bingerville, Abidjan"
          />
        </div>

        {type === "terrain" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lot">N° de lot</Label>
              <Input
                id="lot"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="A12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masterplan">Plan de masse</Label>
              <Select
                id="masterplan"
                value={masterplanId}
                onChange={(e) => setMasterplanId(e.target.value)}
              >
                <option value="">— Aucun —</option>
                {masterplans.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {type === "maison" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rooms">Nombre de pièces</Label>
              <Input
                id="rooms"
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="construction">Statut construction</Label>
              <Input
                id="construction"
                value={constructionStatus}
                onChange={(e) => setConstructionStatus(e.target.value)}
                placeholder="Ex. Fondations, Livraison Q4 2026"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : property ? "Mettre à jour" : "Créer le bien"}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
