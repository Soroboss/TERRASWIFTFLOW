"use server";

import { requireSession } from "@/lib/auth";
import { canDeleteCatalog, canManageCatalog, canViewAllData } from "@/lib/auth/permissions";
import { canAgentViewPropertyStatus } from "@/lib/catalog-visibility";
import { normalizeProperties, normalizeProperty } from "@/lib/properties";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { propertySchema } from "@/lib/validations/schemas";
import type { Property, PropertyStatus, PropertyType } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface PropertyInput {
  type: PropertyType;
  title: string;
  reference: string;
  status: PropertyStatus;
  price_total: number;
  surface_m2?: number | null;
  price_per_m2?: number | null;
  location_label?: string | null;
  lat?: number | null;
  lng?: number | null;
  lot_number?: string | null;
  masterplan_id?: string | null;
  rooms?: number | null;
  construction_status?: string | null;
  photos?: string[];
}

export async function getProperties(): Promise<Property[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select(
      "id, organization_id, type, title, reference, status, price_total, surface_m2, price_per_m2, location_label, lat, lng, lot_number, masterplan_id, rooms, construction_status, created_by, created_at, photos"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return normalizeProperties((data ?? []) as Property[]);
}

export type PropertyListItem = Pick<
  Property,
  | "id"
  | "type"
  | "title"
  | "reference"
  | "status"
  | "price_total"
  | "surface_m2"
  | "location_label"
  | "lot_number"
  | "photos"
>;

export interface PropertyListFilters {
  q?: string;
  status?: PropertyStatus;
  type?: PropertyType;
}

/** Liste légère sans photos — chargement plus rapide. */
export async function getPropertiesList(
  filters?: PropertyListFilters
): Promise<PropertyListItem[]> {
  const session = await requireSession();
  const insforge = await createClient();
  let query = insforge.database
    .from("properties")
    .select(
      "id, type, title, reference, status, price_total, surface_m2, location_label, lot_number, photos"
    )
    .order("created_at", { ascending: false });

  const isAgent = !canViewAllData(session.profile.role);
  if (isAgent) {
    query = query.neq("status", "vendu");
  }

  if (filters?.status) {
    if (isAgent && filters.status === "vendu") {
      return [];
    }
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.q?.trim()) {
    const term = filters.q.trim();
    query = query.or(`title.ilike.%${term}%,reference.ilike.%${term}%,lot_number.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    price_total: Number(row.price_total),
    surface_m2: row.surface_m2 ? Number(row.surface_m2) : null,
    photos: Array.isArray(row.photos) ? row.photos : [],
  })) as PropertyListItem[];
}

export async function getProperty(id: string): Promise<Property | null> {
  const session = await requireSession();
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const property = normalizeProperty(data as Property);
  if (!canAgentViewPropertyStatus(property.status, session.profile.role)) {
    return null;
  }
  return property;
}

export async function createPropertyAction(input: PropertyInput) {
  const parsed = parseInput(propertySchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent créer un bien." };
  }

  const insforge = await createClient();
  const data = parsed.data;

  const { error } = await insforge.database.from("properties").insert({
    organization_id: session.profile.organization_id,
    created_by: session.userId,
    type: data.type,
    title: data.title,
    reference: data.reference,
    status: data.status,
    price_total: data.price_total,
    surface_m2: data.surface_m2 ?? null,
    price_per_m2: data.price_per_m2 ?? null,
    location_label: data.location_label ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    lot_number: data.lot_number ?? null,
    masterplan_id: data.masterplan_id ?? null,
    rooms: data.rooms ?? null,
    construction_status: data.construction_status ?? null,
    photos: data.photos ?? [],
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  redirect("/dashboard/biens");
}

export async function updatePropertyAction(id: string, input: PropertyInput) {
  const parsed = parseInput(propertySchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent modifier un bien." };
  }

  const insforge = await createClient();
  const data = parsed.data;

  const { error } = await insforge.database
    .from("properties")
    .update({
      type: data.type,
      title: data.title,
      reference: data.reference,
      status: data.status,
      price_total: data.price_total,
      surface_m2: data.surface_m2 ?? null,
      price_per_m2: data.price_per_m2 ?? null,
      location_label: data.location_label ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      lot_number: data.lot_number ?? null,
      masterplan_id: data.masterplan_id ?? null,
      rooms: data.rooms ?? null,
      construction_status: data.construction_status ?? null,
      photos: data.photos ?? [],
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  revalidatePath(`/dashboard/biens/${id}`);
  redirect(`/dashboard/biens/${id}`);
}

export async function deletePropertyAction(id: string) {
  const session = await requireSession();
  if (!canDeleteCatalog(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent supprimer un bien." };
  }

  const insforge = await createClient();

  const { error } = await insforge.database.from("properties").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  redirect("/dashboard/biens");
}

export async function uploadPropertyPhotoAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCatalog(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  const insforge = await createClient();
  const file = formData.get("file") as File | null;
  const propertyId = formData.get("propertyId") as string | null;

  if (!file || !propertyId) {
    return { error: "Fichier ou bien manquant." };
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: "Fichier trop volumineux (max 5 Mo)." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format non autorisé (JPEG, PNG, WebP, GIF)." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.profile.organization_id}/${propertyId}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("property-photos")
    .upload(path, file);

  if (uploadError) return { error: uploadError.message };
  if (!uploadData?.url) return { error: "URL de photo introuvable." };

  const property = await getProperty(propertyId);
  if (!property) return { error: "Bien introuvable." };

  const photos = [...property.photos, uploadData.url];

  const { error: updateError } = await insforge.database
    .from("properties")
    .update({ photos })
    .eq("id", propertyId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/biens/${propertyId}`);
  return { url: uploadData.url };
}
