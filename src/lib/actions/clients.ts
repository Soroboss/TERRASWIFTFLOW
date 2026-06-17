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
  return getClientsList();
}

export interface ClientListFilters {
  q?: string;
  source?: ClientSource;
  diaspora?: "oui" | "non";
  agent?: string;
}

export interface ClientStats {
  total: number;
  diaspora: number;
  newThisMonth: number;
  withActiveDeal: number;
  bySource: Record<string, number>;
}

export async function getClientStats(): Promise<ClientStats> {
  const insforge = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalResult,
    diasporaResult,
    newMonthResult,
    activeDealsResult,
    sourcesResult,
  ] = await Promise.all([
    insforge.database.from("clients").select("id", { count: "exact", head: true }),
    insforge.database
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("is_diaspora", true),
    insforge.database
      .from("clients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
    insforge.database
      .from("deals")
      .select("client_id")
      .eq("status", "en_cours"),
    insforge.database.from("clients").select("source"),
  ]);

  if (totalResult.error) throw new Error(totalResult.error.message);
  if (diasporaResult.error) throw new Error(diasporaResult.error.message);
  if (newMonthResult.error) throw new Error(newMonthResult.error.message);
  if (activeDealsResult.error) throw new Error(activeDealsResult.error.message);
  if (sourcesResult.error) throw new Error(sourcesResult.error.message);

  const bySource: Record<string, number> = {};
  for (const row of sourcesResult.data ?? []) {
    const key = (row.source as string | null) ?? "non_renseigne";
    bySource[key] = (bySource[key] ?? 0) + 1;
  }

  const uniqueClientsWithDeal = new Set(
    (activeDealsResult.data ?? []).map((d) => d.client_id as string)
  );

  return {
    total: totalResult.count ?? 0,
    diaspora: diasporaResult.count ?? 0,
    newThisMonth: newMonthResult.count ?? 0,
    withActiveDeal: uniqueClientsWithDeal.size,
    bySource,
  };
}

export async function getClientsList(filters?: ClientListFilters): Promise<Client[]> {
  const insforge = await createClient();
  let query = insforge.database.from("clients").select("*").order("created_at", { ascending: false });

  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  if (filters?.diaspora === "oui") {
    query = query.eq("is_diaspora", true);
  }
  if (filters?.diaspora === "non") {
    query = query.eq("is_diaspora", false);
  }
  if (filters?.agent) {
    query = query.eq("assigned_agent_id", filters.agent);
  }
  if (filters?.q?.trim()) {
    const term = filters.q.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query;
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
