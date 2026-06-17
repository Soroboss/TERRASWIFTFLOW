import type { PropertyStatus } from "@/types/database";

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  libre: "Libre",
  reserve: "Réservé",
  vendu: "Vendu",
};

export function propertyStatusColorClass(status: PropertyStatus): string {
  switch (status) {
    case "libre":
      return "bg-emerald-400/80";
    case "reserve":
      return "bg-amber-400/80";
    case "vendu":
      return "bg-red-400/80";
  }
}

export function propertyStatusDotClass(status: PropertyStatus): string {
  switch (status) {
    case "libre":
      return "bg-emerald-500";
    case "reserve":
      return "bg-amber-500";
    case "vendu":
      return "bg-red-500";
  }
}

export function countPropertiesByStatus<T extends { status: PropertyStatus }>(items: T[]) {
  return {
    libres: items.filter((p) => p.status === "libre").length,
    reserves: items.filter((p) => p.status === "reserve").length,
    vendus: items.filter((p) => p.status === "vendu").length,
  };
}
