"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PropertyStatus, PropertyType } from "@/types/database";

interface PropertyFiltersProps {
  q?: string;
  status?: string;
  type?: string;
  hideSoldStatus?: boolean;
}

export function PropertyFilters({
  q = "",
  status = "",
  type = "",
  hideSoldStatus = false,
}: PropertyFiltersProps) {
  const router = useRouter();

  const pushFilters = (next: PropertyFiltersProps) => {
    const params = new URLSearchParams();
    if (next.q?.trim()) params.set("q", next.q.trim());
    if (next.status) params.set("status", next.status);
    if (next.type) params.set("type", next.type);
    const query = params.toString();
    router.push(query ? `/dashboard/biens?${query}` : "/dashboard/biens");
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2 sm:col-span-1">
        <Label htmlFor="property-q">Rechercher</Label>
        <Input
          id="property-q"
          defaultValue={q}
          placeholder="Titre, référence, lot…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pushFilters({
                q: e.currentTarget.value,
                status,
                type,
              });
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="property-status">Statut</Label>
        <Select
          id="property-status"
          value={status}
          onChange={(e) =>
            pushFilters({ q, status: e.target.value as PropertyStatus | "", type })
          }
        >
          <option value="">Tous</option>
          <option value="libre">Libre</option>
          <option value="reserve">Réservé</option>
          {!hideSoldStatus && <option value="vendu">Vendu</option>}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="property-type">Type</Label>
        <Select
          id="property-type"
          value={type}
          onChange={(e) =>
            pushFilters({ q, status, type: e.target.value as PropertyType | "" })
          }
        >
          <option value="">Tous</option>
          <option value="terrain">Terrain</option>
          <option value="maison">Maison</option>
        </Select>
      </div>
    </div>
  );
}
