"use server";

import type { SessionContext } from "@/lib/auth";
import { canViewAllData } from "@/lib/auth/permissions";
import { createClient } from "@/lib/insforge/server";

export async function assertClientAccess(
  session: SessionContext,
  clientId: string
): Promise<{ error?: string }> {
  if (canViewAllData(session.profile.role)) return {};

  const insforge = await createClient();
  const { data } = await insforge.database
    .from("clients")
    .select("assigned_agent_id")
    .eq("id", clientId)
    .single();

  if (!data) return { error: "Client introuvable." };
  if (data.assigned_agent_id !== session.userId) {
    return { error: "Accès refusé — ce client ne vous est pas assigné." };
  }
  return {};
}

export async function assertDealAccess(
  session: SessionContext,
  dealId: string
): Promise<{ error?: string }> {
  if (canViewAllData(session.profile.role)) return {};

  const insforge = await createClient();
  const { data } = await insforge.database
    .from("deals")
    .select("agent_id")
    .eq("id", dealId)
    .single();

  if (!data) return { error: "Vente introuvable." };
  if (data.agent_id !== session.userId) {
    return { error: "Accès refusé — cette vente ne vous appartient pas." };
  }
  return {};
}
