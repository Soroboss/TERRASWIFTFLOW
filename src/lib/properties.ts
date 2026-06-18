import type { Property } from "@/types/database";
import { parseMapZone } from "@/lib/map-zone";

export function normalizeProperty(row: Property): Property {
  return {
    ...row,
    photos: Array.isArray(row.photos) ? row.photos : [],
    price_total: Number(row.price_total),
    surface_m2: row.surface_m2 ? Number(row.surface_m2) : null,
    price_per_m2: row.price_per_m2 ? Number(row.price_per_m2) : null,
    map_zone: row.map_zone ? parseMapZone(row.map_zone) : null,
  };
}

export function normalizeProperties(rows: Property[]): Property[] {
  return rows.map(normalizeProperty);
}
