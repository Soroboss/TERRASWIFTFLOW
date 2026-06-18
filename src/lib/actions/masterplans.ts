"use server";

import { requireSession } from "@/lib/auth";
import { canManageCatalog, canViewAllData } from "@/lib/auth/permissions";
import { filterLotsForCommercialAgent } from "@/lib/catalog-visibility";
import { createClient } from "@/lib/insforge/server";
import { normalizeProperties } from "@/lib/properties";
import { parseMapZone } from "@/lib/map-zone";
import type { MapZone, Masterplan, Property, PropertyStatus } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type MasterplanLotSummary = Pick<
  Property,
  "id" | "status" | "lot_number" | "reference" | "title" | "masterplan_id" | "photos"
>;

export interface MasterplanWithLots {
  masterplan: Masterplan;
  lots: MasterplanLotSummary[];
}

const LOT_SUMMARY_COLUMNS =
  "id, status, lot_number, reference, title, masterplan_id, photos";

function normalizeLotSummaries(lots: MasterplanLotSummary[]): MasterplanLotSummary[] {
  return lots.map((lot) => ({
    ...lot,
    photos: Array.isArray(lot.photos) ? lot.photos : [],
  }));
}

export async function getMasterplans(): Promise<Masterplan[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("masterplans")
    .select("id, name, total_lots, image_url, organization_id, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Masterplan[];
}

export async function getMasterplan(id: string): Promise<Masterplan | null> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("masterplans")
    .select("id, name, total_lots, image_url, organization_id, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Masterplan;
}

export async function getMasterplanLots(masterplanId: string): Promise<Property[]> {
  const session = await requireSession();
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select("*")
    .eq("masterplan_id", masterplanId)
    .order("lot_number", { ascending: true });

  if (error) throw new Error(error.message);
  const lots = normalizeProperties((data ?? []) as Property[]);
  return filterLotsForCommercialAgent(lots, session.profile.role);
}

/** 2 requêtes au lieu de N+1 pour la liste des plans. */
export async function getMasterplansWithLots(): Promise<MasterplanWithLots[]> {
  const session = await requireSession();
  const insforge = await createClient();

  const [masterplansResult, lotsResult] = await Promise.all([
    insforge.database
      .from("masterplans")
      .select("id, name, total_lots, image_url, organization_id, created_at")
      .order("created_at", { ascending: false }),
    insforge.database
      .from("properties")
      .select(LOT_SUMMARY_COLUMNS)
      .not("masterplan_id", "is", null)
      .order("lot_number", { ascending: true }),
  ]);

  if (masterplansResult.error) throw new Error(masterplansResult.error.message);
  if (lotsResult.error) throw new Error(lotsResult.error.message);

  const masterplans = (masterplansResult.data ?? []) as Masterplan[];
  const lots = normalizeLotSummaries((lotsResult.data ?? []) as MasterplanLotSummary[]);

  const lotsByPlan = new Map<string, MasterplanLotSummary[]>();
  for (const lot of lots) {
    if (!lot.masterplan_id) continue;
    const list = lotsByPlan.get(lot.masterplan_id) ?? [];
    list.push(lot);
    lotsByPlan.set(lot.masterplan_id, list);
  }

  return masterplans.map((masterplan) => ({
    masterplan,
    lots: filterLotsForCommercialAgent(
      lotsByPlan.get(masterplan.id) ?? [],
      session.profile.role
    ),
  }));
}

export async function getOverviewLotProperties(): Promise<MasterplanLotSummary[]> {
  const session = await requireSession();
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select(LOT_SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  const lots = normalizeLotSummaries((data ?? []) as MasterplanLotSummary[]);
  return filterLotsForCommercialAgent(lots, session.profile.role);
}

export async function getPropertyStatusCounts(): Promise<{
  libres: number;
  reserves: number;
  vendus: number;
  total: number;
}> {
  const session = await requireSession();
  const insforge = await createClient();
  let query = insforge.database.from("properties").select("status");
  if (!canViewAllData(session.profile.role)) {
    query = query.neq("status", "vendu");
  }
  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const statuses = (data ?? []).map((row) => row.status as PropertyStatus);
  return {
    libres: statuses.filter((s) => s === "libre").length,
    reserves: statuses.filter((s) => s === "reserve").length,
    vendus: statuses.filter((s) => s === "vendu").length,
    total: statuses.length,
  };
}

export async function createMasterplanAction(name: string, totalLots: number) {
  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent créer un plan de masse." };
  }

  const insforge = await createClient();

  const { data, error } = await insforge.database
    .from("masterplans")
    .insert({
      organization_id: session.profile.organization_id,
      name,
      total_lots: totalLots,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Erreur de création." };

  revalidatePath("/dashboard/plans");
  redirect(`/dashboard/plans/${data.id}`);
}

export async function uploadMasterplanImageAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  const insforge = await createClient();
  const file = formData.get("file") as File | null;
  const masterplanId = formData.get("masterplanId") as string | null;

  if (!file || !masterplanId) {
    return { error: "Fichier ou plan manquant." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.profile.organization_id}/${masterplanId}.${ext}`;

  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("masterplan-images")
    .upload(path, file);

  if (uploadError) return { error: uploadError.message };
  if (!uploadData?.url) return { error: "URL d'image introuvable." };

  const { error: updateError } = await insforge.database
    .from("masterplans")
    .update({ image_url: uploadData.url })
    .eq("id", masterplanId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/plans/${masterplanId}`);
  return { url: uploadData.url };
}

export async function updatePropertyMapZoneAction(
  propertyId: string,
  mapZone: MapZone | null
) {
  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent configurer les zones." };
  }

  const parsed = mapZone === null ? null : parseMapZone(mapZone);
  if (mapZone !== null && !parsed) {
    return { error: "Zone invalide." };
  }

  const insforge = await createClient();
  const { data: property, error: fetchError } = await insforge.database
    .from("properties")
    .select("id, masterplan_id, organization_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Lot introuvable." };
  }

  if (property.organization_id !== session.profile.organization_id) {
    return { error: "Accès refusé." };
  }

  if (!property.masterplan_id) {
    return { error: "Ce bien n'est pas rattaché à un plan de masse." };
  }

  const { error: updateError } = await insforge.database
    .from("properties")
    .update({ map_zone: parsed })
    .eq("id", propertyId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/plans/${property.masterplan_id}`);
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard");
  return { success: true };
}
