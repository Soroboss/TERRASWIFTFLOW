"use server";

import { requireSession } from "@/lib/auth";
import { normalizePhoneCI } from "@/lib/format";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { clientSchema } from "@/lib/validations/schemas";
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
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Client;
}

export async function getOrganizationAgents(): Promise<Profile[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("active", true)
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function createClientAction(input: ClientInput) {
  const parsed = parseInput(clientSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  const insforge = await createClient();
  const data = parsed.data;

  const assignedAgentId =
    session.profile.role === "agent"
      ? session.userId
      : data.assigned_agent_id ?? session.userId;

  const { error } = await insforge.database.from("clients").insert({
    organization_id: session.profile.organization_id,
    full_name: data.full_name,
    phone: normalizePhoneCI(data.phone),
    email: data.email ?? null,
    is_diaspora: data.is_diaspora,
    country: data.country,
    source: data.source ?? null,
    assigned_agent_id: assignedAgentId,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function updateClientAction(id: string, input: ClientInput) {
  const parsed = parseInput(clientSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  await requireSession();
  const insforge = await createClient();
  const data = parsed.data;

  const { error } = await insforge.database
    .from("clients")
    .update({
      full_name: data.full_name,
      phone: normalizePhoneCI(data.phone),
      email: data.email ?? null,
      is_diaspora: data.is_diaspora,
      country: data.country,
      source: data.source ?? null,
      assigned_agent_id: data.assigned_agent_id ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  await requireSession();
  const insforge = await createClient();

  const { error } = await insforge.database.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}
