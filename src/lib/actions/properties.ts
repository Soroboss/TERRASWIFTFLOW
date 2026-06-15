"use server";

import { requireSession } from "@/lib/auth";
import { normalizeProperties, normalizeProperty } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return normalizeProperties((data ?? []) as Property[]);
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return normalizeProperty(data as Property);
}

export async function createPropertyAction(input: PropertyInput) {
  const session = await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("properties").insert({
    organization_id: session.profile.organization_id,
    created_by: session.userId,
    type: input.type,
    title: input.title,
    reference: input.reference,
    status: input.status,
    price_total: input.price_total,
    surface_m2: input.surface_m2 ?? null,
    price_per_m2: input.price_per_m2 ?? null,
    location_label: input.location_label ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    lot_number: input.lot_number ?? null,
    masterplan_id: input.masterplan_id ?? null,
    rooms: input.rooms ?? null,
    construction_status: input.construction_status ?? null,
    photos: input.photos ?? [],
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  redirect("/dashboard/biens");
}

export async function updatePropertyAction(id: string, input: PropertyInput) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      type: input.type,
      title: input.title,
      reference: input.reference,
      status: input.status,
      price_total: input.price_total,
      surface_m2: input.surface_m2 ?? null,
      price_per_m2: input.price_per_m2 ?? null,
      location_label: input.location_label ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      lot_number: input.lot_number ?? null,
      masterplan_id: input.masterplan_id ?? null,
      rooms: input.rooms ?? null,
      construction_status: input.construction_status ?? null,
      photos: input.photos ?? [],
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  revalidatePath(`/dashboard/biens/${id}`);
  redirect(`/dashboard/biens/${id}`);
}

export async function deletePropertyAction(id: string) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/biens");
  redirect("/dashboard/biens");
}

export async function uploadPropertyPhotoAction(formData: FormData) {
  const session = await requireSession();
  const supabase = createClient();
  const file = formData.get("file") as File | null;
  const propertyId = formData.get("propertyId") as string | null;

  if (!file || !propertyId) {
    return { error: "Fichier ou bien manquant." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.profile.organization_id}/${propertyId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("property-photos")
    .upload(path, file, { upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("property-photos")
    .getPublicUrl(path);

  const property = await getProperty(propertyId);
  if (!property) return { error: "Bien introuvable." };

  const photos = [...property.photos, urlData.publicUrl];

  const { error: updateError } = await supabase
    .from("properties")
    .update({ photos })
    .eq("id", propertyId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/biens/${propertyId}`);
  return { url: urlData.publicUrl };
}
