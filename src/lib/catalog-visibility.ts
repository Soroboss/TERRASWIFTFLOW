import { canViewAllData } from "@/lib/auth/permissions";
import type { PropertyStatus, UserRole } from "@/types/database";

/** Les agents commerciaux ne voient pas les lots déjà vendus. */
export function filterLotsForCommercialAgent<T extends { status: PropertyStatus }>(
  lots: T[],
  role: UserRole
): T[] {
  if (canViewAllData(role)) return lots;
  return lots.filter((lot) => lot.status !== "vendu");
}

export function canAgentViewPropertyStatus(status: PropertyStatus, role: UserRole): boolean {
  if (canViewAllData(role)) return true;
  return status !== "vendu";
}

export function getLotPhotoUrl(photos?: string[] | null): string | null {
  if (!photos?.length) return null;
  return photos[0] ?? null;
}

export function formatLotNumberReference(lot: {
  lot_number?: string | null;
  reference?: string | null;
  title?: string | null;
}): { number: string | null; reference: string | null } {
  const number = lot.lot_number?.trim() || null;
  const reference = lot.reference?.trim() || null;
  if (!number && !reference && lot.title?.trim()) {
    return { number: lot.title.trim(), reference: null };
  }
  return { number: number ? `N° ${number}` : null, reference };
}
