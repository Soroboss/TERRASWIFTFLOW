"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { activitySchema } from "@/lib/validations/schemas";
import type { Activity, ActivityType } from "@/types/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getTodayActivities(agentId?: string): Promise<Activity[]> {
  const insforge = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = insforge.database
    .from("activities")
    .select("*, client:clients(full_name)")
    .eq("done", false)
    .lte("due_at", `${today}T23:59:59`)
    .order("due_at");

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function getActivities(): Promise<Activity[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
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
  const parsed = parseInput(activitySchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  const insforge = await createClient();
  const data = parsed.data;

  const { error } = await insforge.database.from("activities").insert({
    organization_id: session.profile.organization_id,
    client_id: data.client_id,
    agent_id: session.userId,
    type: data.type,
    note: data.note ?? null,
    due_at: data.due_at,
    done: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  redirect("/dashboard/relances");
}

export async function toggleActivityDoneAction(id: string, done: boolean) {
  await requireSession();
  const insforge = await createClient();

  const { error } = await insforge.database.from("activities").update({ done }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteActivityAction(id: string) {
  await requireSession();
  const insforge = await createClient();

  const { error } = await insforge.database.from("activities").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/relances");
  return { success: true };
}
