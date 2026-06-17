import type { PropertyStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_STATUS_LABELS, propertyStatusDotClass } from "@/lib/property-status";

export { PROPERTY_STATUS_LABELS };

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge variant={status}>{PROPERTY_STATUS_LABELS[status]}</Badge>;
}

export function statusColorClass(status: PropertyStatus): string {
  return propertyStatusDotClass(status);
}
