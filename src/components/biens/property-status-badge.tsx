import type { PropertyStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<PropertyStatus, string> = {
  libre: "Libre",
  reserve: "Réservé",
  vendu: "Vendu",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge variant={status}>{STATUS_LABELS[status]}</Badge>;
}

export function statusColorClass(status: PropertyStatus): string {
  switch (status) {
    case "libre":
      return "bg-emerald-500";
    case "reserve":
      return "bg-amber-500";
    case "vendu":
      return "bg-red-500";
  }
}
