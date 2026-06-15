"use server";

import { requireSession } from "@/lib/auth";
import { normalizePhoneCI } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Client, Profile } from "@/types/database";
import type { ClientSource } from "@/types/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ClientInput {
  full_name: string;
  phone: string;
  email?: string | null;
  is_diaspora: boolean;
  country: string;
  source?: ClientSource | null;
  assigned_agent_id?: string | null;
}

export async function getClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Client;
}

export async function getOrganizationAgents(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("active", true)
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function createClientAction(input: ClientInput) {
  const session = await requireSession();
  const supabase = createClient();

  const assignedAgentId =
    session.profile.role === "agent"
      ? session.userId
      : input.assigned_agent_id ?? session.userId;

  const { error } = await supabase.from("clients").insert({
    organization_id: session.profile.organization_id,
    full_name: input.full_name,
    phone: normalizePhoneCI(input.phone),
    email: input.email ?? null,
    is_diaspora: input.is_diaspora,
    country: input.country,
    source: input.source ?? null,
    assigned_agent_id: assignedAgentId,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function updateClientAction(id: string, input: ClientInput) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: input.full_name,
      phone: normalizePhoneCI(input.phone),
      email: input.email ?? null,
      is_diaspora: input.is_diaspora,
      country: input.country,
      source: input.source ?? null,
      assigned_agent_id: input.assigned_agent_id ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}
