import type { MasterplanLotSummary } from "@/lib/actions/masterplans";
import { canViewAllData } from "@/lib/auth/permissions";
import { countPropertiesByStatus } from "@/lib/property-status";
import type { PropertyStatus, UserRole } from "@/types/database";

export type ActiveDealByProperty = {
  id: string;
  property_id: string;
  status: string;
  agent_id?: string | null;
  client?: { full_name: string } | { full_name: string }[] | null;
};

export interface LotHrefViewer {
  role: UserRole;
  userId: string;
}

export function resolveLotHref(
  propertyId: string,
  deal: ActiveDealByProperty | undefined,
  viewer: LotHrefViewer
): string {
  const propertyHref = `/dashboard/biens/${propertyId}`;
  if (!deal?.id) return propertyHref;

  const canAccessDeal =
    canViewAllData(viewer.role) || deal.agent_id === viewer.userId;

  return canAccessDeal ? `/dashboard/deals/${deal.id}` : propertyHref;
}

export function buildLotHrefMap(
  propertyIds: string[],
  dealsByPropertyId: Map<string, ActiveDealByProperty>,
  viewer: LotHrefViewer
): Map<string, string> {
  const hrefs = new Map<string, string>();
  for (const propertyId of propertyIds) {
    hrefs.set(
      propertyId,
      resolveLotHref(propertyId, dealsByPropertyId.get(propertyId), viewer)
    );
  }
  return hrefs;
}

export function dealClientName(
  client: ActiveDealByProperty["client"]
): string | null {
  if (!client) return null;
  if (Array.isArray(client)) return client[0]?.full_name ?? null;
  return client.full_name;
}

export function emptyCounts() {
  return { libres: 0, reserves: 0, vendus: 0, total: 0 };
}

export function countsFromStatuses(statuses: PropertyStatus[]) {
  return {
    libres: statuses.filter((s) => s === "libre").length,
    reserves: statuses.filter((s) => s === "reserve").length,
    vendus: statuses.filter((s) => s === "vendu").length,
    total: statuses.length,
  };
}

export function getOverviewStats(
  overviewLots: MasterplanLotSummary[],
  propertyCounts: { libres: number; reserves: number; vendus: number; total: number }
) {
  if (overviewLots.length > 0) {
    return countPropertiesByStatus(overviewLots);
  }
  return {
    libres: propertyCounts.libres,
    reserves: propertyCounts.reserves,
    vendus: propertyCounts.vendus,
  };
}
