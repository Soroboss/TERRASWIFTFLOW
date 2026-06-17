"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { activitySchema } from "@/lib/validations/schemas";
import type { Activity, ActivityType } from "@/types/entities";
import { getAgentScopeId } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActivityView = "pending" | "overdue" | "today" | "upcoming" | "done";

export interface ActivityListFilters {
  view?: ActivityView;
  type?: ActivityType;
  agent?: string;
}

export interface ActivityStats {
  pending: number;
  overdue: number;
  today: number;
  upcoming: number;
  doneThisMonth: number;
  byType: Record<ActivityType, number>;
}

function todayBounds() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    today,
    todayStart: `${today}T00:00:00`,
    todayEnd: `${today}T23:59:59`,
  };
}

export async function getActivityStats(agentId?: string): Promise<ActivityStats> {
  const session = await requireSession();
  const scopeId = getAgentScopeId(session);
  const effectiveAgentId = scopeId ?? agentId;
  const insforge = await createClient();
  const { todayStart, todayEnd } = todayBounds();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let pendingQ = insforge.database
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("done", false)
    .lte("due_at", todayEnd);
  let overdueQ = insforge.database
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("done", false)
    .lt("due_at", todayStart);
  let todayQ = insforge.database
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("done", false)
    .gte("due_at", todayStart)
    .lte("due_at", todayEnd);
  let upcomingQ = insforge.database
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("done", false)
    .gt("due_at", todayEnd);
  let doneMonthQ = insforge.database
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("done", true)
    .gte("due_at", monthStart.toISOString());
  let pendingRowsQ = insforge.database
    .from("activities")
    .select("type")
    .eq("done", false)
    .lte("due_at", todayEnd);

  if (effectiveAgentId) {
    pendingQ = pendingQ.eq("agent_id", effectiveAgentId);
    overdueQ = overdueQ.eq("agent_id", effectiveAgentId);
    todayQ = todayQ.eq("agent_id", effectiveAgentId);
    upcomingQ = upcomingQ.eq("agent_id", effectiveAgentId);
    doneMonthQ = doneMonthQ.eq("agent_id", effectiveAgentId);
    pendingRowsQ = pendingRowsQ.eq("agent_id", effectiveAgentId);
  }

  const [pending, overdue, todayCount, upcoming, doneMonth, pendingRows] = await Promise.all([
    pendingQ,
    overdueQ,
    todayQ,
    upcomingQ,
    doneMonthQ,
    pendingRowsQ,
  ]);

  if (pending.error) throw new Error(pending.error.message);
  if (overdue.error) throw new Error(overdue.error.message);
  if (todayCount.error) throw new Error(todayCount.error.message);
  if (upcoming.error) throw new Error(upcoming.error.message);
  if (doneMonth.error) throw new Error(doneMonth.error.message);
  if (pendingRows.error) throw new Error(pendingRows.error.message);

  const byType: Record<ActivityType, number> = { appel: 0, visite: 0, relance: 0 };
  for (const row of pendingRows.data ?? []) {
    const type = row.type as ActivityType;
    if (type in byType) byType[type] += 1;
  }

  return {
    pending: pending.count ?? 0,
    overdue: overdue.count ?? 0,
    today: todayCount.count ?? 0,
    upcoming: upcoming.count ?? 0,
    doneThisMonth: doneMonth.count ?? 0,
    byType,
  };
}

export async function getActivitiesList(filters?: ActivityListFilters): Promise<Activity[]> {
  const session = await requireSession();
  const scopeId = getAgentScopeId(session);
  const insforge = await createClient();
  const view = filters?.view ?? "pending";
  const { today, todayStart, todayEnd } = todayBounds();

  let query = insforge.database
    .from("activities")
    .select("*, client:clients(full_name, id)")
    .order("due_at", { ascending: view === "done" ? false : true });

  const agentFilter = scopeId ?? filters?.agent;
  if (agentFilter) {
    query = query.eq("agent_id", agentFilter);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  switch (view) {
    case "overdue":
      query = query.eq("done", false).lt("due_at", todayStart);
      break;
    case "today":
      query = query
        .eq("done", false)
        .gte("due_at", todayStart)
        .lte("due_at", todayEnd);
      break;
    case "upcoming":
      query = query.eq("done", false).gt("due_at", todayEnd);
      break;
    case "done":
      query = query.eq("done", true);
      break;
    default:
      query = query.eq("done", false).lte("due_at", todayEnd);
      break;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function getTodayActivities(agentId?: string): Promise<Activity[]> {
  return getActivitiesList({ view: "pending", agent: agentId });
}

export async function getActivitiesByClientId(clientId: string): Promise<Activity[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("activities")
    .select("*, client:clients(full_name)")
    .eq("client_id", clientId)
    .order("due_at", { ascending: false })
    .limit(10);

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
  const session = await requireSession();
  const insforge = await createClient();

  const { data: activity } = await insforge.database
    .from("activities")
    .select("agent_id, client_id")
    .eq("id", id)
    .single();

  if (!activity) return { error: "Relance introuvable." };

  const scopeId = getAgentScopeId(session);
  if (scopeId && activity.agent_id !== scopeId) {
    return { error: "Accès refusé." };
  }

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
