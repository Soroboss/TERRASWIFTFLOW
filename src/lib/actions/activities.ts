"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Activity, ActivityType } from "@/types/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getTodayActivities(agentId?: string): Promise<Activity[]> {
  const session = await requireSession();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("activities")
    .select("*, client:clients(full_name)")
    .eq("done", false)
    .lte("due_at", `${today}T23:59:59`)
    .order("due_at");

  const filterAgent =
    agentId ?? (session.profile.role === "agent" ? session.userId : null);
  if (filterAgent) {
    query = query.eq("agent_id", filterAgent);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function getActivities(): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, client:clients(full_name)")
    .order("due_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function createActivityAction(input: {
  client_id: string;
  type: ActivityType;
  note?: string;
  due_at: string;
}) {
  const session = await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("activities").insert({
    organization_id: session.profile.organization_id,
    client_id: input.client_id,
    agent_id: session.userId,
    type: input.type,
    note: input.note ?? null,
    due_at: input.due_at,
    done: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  redirect("/dashboard/relances");
}

export async function toggleActivityDoneAction(id: string, done: boolean) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("activities").update({ done }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteActivityAction(id: string) {
  await requireSession();
  const supabase = createClient();

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  return { success: true };
}
