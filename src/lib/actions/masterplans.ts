"use server";

import { requireSession } from "@/lib/auth";
import { normalizeProperties } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
import type { Masterplan, Property } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getMasterplans(): Promise<Masterplan[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("masterplans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Masterplan[];
}

export async function getMasterplan(id: string): Promise<Masterplan | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("masterplans")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Masterplan;
}

export async function getMasterplanLots(masterplanId: string): Promise<Property[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("masterplan_id", masterplanId)
    .order("lot_number", { ascending: true });

  if (error) throw new Error(error.message);
  return normalizeProperties((data ?? []) as Property[]);
}

export async function createMasterplanAction(name: string, totalLots: number) {
  const session = await requireSession();
  const supabase = createClient();

  const { data, error } = await supabase
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
  const supabase = createClient();
  const file = formData.get("file") as File | null;
  const masterplanId = formData.get("masterplanId") as string | null;

  if (!file || !masterplanId) {
    return { error: "Fichier ou plan manquant." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.profile.organization_id}/${masterplanId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("masterplan-images")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("masterplan-images")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("masterplans")
    .update({ image_url: urlData.publicUrl })
    .eq("id", masterplanId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/plans/${masterplanId}`);
  return { url: urlData.publicUrl };
}
