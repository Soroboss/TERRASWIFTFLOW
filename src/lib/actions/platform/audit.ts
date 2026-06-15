"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { requirePlatformSession } from "@/lib/platform/auth";

export async function logPlatformAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
) {
  const service = createServiceClient();
  await service.database.from("platform_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

export async function getRecentAuditLog(limit = 20) {
  await requirePlatformSession();
  const service = createServiceClient();

  const { data, error } = await service.database
    .from("platform_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
