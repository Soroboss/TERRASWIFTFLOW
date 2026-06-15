"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import { canManageBilling, requirePlatformSession } from "@/lib/platform/auth";
import type { Plan, SubscriptionStatus } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function updateTenantSubscriptionAction(
  tenantId: string,
  input: {
    plan?: Plan;
    subscription_status?: SubscriptionStatus;
    trial_ends_at?: string | null;
    billing_email?: string | null;
    notes?: string | null;
    suspended?: boolean;
  }
) {
  const session = await requirePlatformSession();
  if (!canManageBilling(session.platformUser.role)) {
    return { error: "Droits insuffisants pour modifier les abonnements." };
  }

  const service = createServiceClient();
  const payload: Record<string, unknown> = {};

  if (input.plan) payload.plan = input.plan;
  if (input.subscription_status) payload.subscription_status = input.subscription_status;
  if (input.trial_ends_at !== undefined) payload.trial_ends_at = input.trial_ends_at;
  if (input.billing_email !== undefined) payload.billing_email = input.billing_email;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.suspended !== undefined) {
    payload.suspended_at = input.suspended ? new Date().toISOString() : null;
  }

  const { error } = await service.database
    .from("organizations")
    .update(payload)
    .eq("id", tenantId);

  if (error) return { error: "Mise à jour impossible." };

  await logPlatformAction(
    session.userId,
    "tenant.subscription_update",
    "organization",
    tenantId,
    payload
  );

  revalidatePath("/platform");
  revalidatePath("/platform/tenants");
  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/abonnements");

  return { success: true };
}

export async function activateTenantAction(tenantId: string) {
  return updateTenantSubscriptionAction(tenantId, {
    subscription_status: "active",
    suspended: false,
  });
}

export async function extendTrialAction(tenantId: string, days: number) {
  const session = await requirePlatformSession();
  if (!canManageBilling(session.platformUser.role)) {
    return { error: "Droits insuffisants." };
  }

  const service = createServiceClient();
  const { data: org } = await service.database
    .from("organizations")
    .select("trial_ends_at")
    .eq("id", tenantId)
    .single();

  const base = org?.trial_ends_at ? new Date(org.trial_ends_at) : new Date();
  if (base.getTime() < Date.now()) base.setTime(Date.now());
  base.setDate(base.getDate() + days);

  return updateTenantSubscriptionAction(tenantId, {
    subscription_status: "trial",
    trial_ends_at: base.toISOString(),
    suspended: false,
  });
}
