"use server";

import { requireSession } from "@/lib/auth";
import { normalizeProperties } from "@/lib/properties";
import { createClient } from "@/lib/insforge/server";
import type { Masterplan, Property } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getMasterplans(): Promise<Masterplan[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("masterplans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Masterplan[];
}

export async function getMasterplan(id: string): Promise<Masterplan | null> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("masterplans")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Masterplan;
}

export async function getMasterplanLots(masterplanId: string): Promise<Property[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select("*")
    .eq("masterplan_id", masterplanId)
    .order("lot_number", { ascending: true });

  if (error) throw new Error(error.message);
  return normalizeProperties((data ?? []) as Property[]);
}

export async function createMasterplanAction(name: string, totalLots: number) {
  const session = await requireSession();
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
