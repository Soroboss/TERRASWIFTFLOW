"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import {
  provisionAuthUserForInvite,
} from "@/lib/auth/insforge-admin-users";
import { canManageTeam, requirePlatformSession } from "@/lib/platform/auth";
import { parseInput } from "@/lib/validations/parse";
import { platformStaffMemberSchema } from "@/lib/validations/schemas";
import type { PlatformRole, PlatformUser } from "@/types/platform";
import { revalidatePath } from "next/cache";

export async function getPlatformTeam(): Promise<PlatformUser[]> {
  await requirePlatformSession();
  const service = createServiceClient();

  const { data } = await service.database
    .from("platform_users")
    .select("*")
    .order("created_at", { ascending: true });

  return (data ?? []) as PlatformUser[];
}

export async function addPlatformTeamMemberAction(
  email: string,
  role: PlatformRole,
  fullName?: string,
  password?: string
) {
  const session = await requirePlatformSession();
  if (!canManageTeam(session.platformUser.role)) {
    return { error: "Seul un super administrateur peut gérer l'équipe." };
  }

  const parsed = parseInput(platformStaffMemberSchema, {
    email,
    role,
    fullName: fullName ?? "",
    password: password ?? "",
  });
  if ("error" in parsed) return { error: parsed.error };

  const normalizedEmail = parsed.data.email.toLowerCase();
  const displayName = parsed.data.fullName.trim();

  const provisioned = await provisionAuthUserForInvite({
    email: normalizedEmail,
    password: parsed.data.password,
    fullName: displayName,
  });
  if (provisioned.error || !provisioned.user) {
    return { error: provisioned.error ?? "Impossible de préparer le compte." };
  }

  const authUser = provisioned.user;
  const created = Boolean(provisioned.created);

  const service = createServiceClient();

  const { data: tenantProfile } = await service.database
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (tenantProfile) {
    return {
      error:
        "Ce compte est rattaché à une organisation cliente. L'équipe plateforme utilise des comptes staff dédiés, séparés des entreprises inscrites.",
    };
  }

  const { error } = await service.database.from("platform_users").upsert(
    {
      id: authUser.id,
      email: authUser.email,
      full_name: displayName || authUser.name || authUser.email.split("@")[0],
      role: parsed.data.role,
      active: true,
    },
    { onConflict: "id" }
  );

  if (error) return { error: "Impossible d'ajouter ce membre." };

  await logPlatformAction(session.userId, "platform.team_add", "platform_user", authUser.id, {
    email: normalizedEmail,
    role: parsed.data.role,
    created,
  });

  revalidatePath("/platform/equipe");
  return {
    success: true,
    created,
    message: created
      ? "Compte staff créé avec connexion immédiate — aucun code e-mail requis."
      : "Membre ajouté à l'équipe plateforme avec connexion immédiate.",
  };
}

export async function updatePlatformTeamMemberAction(
  userId: string,
  input: { role?: PlatformRole; active?: boolean; full_name?: string }
) {
  const session = await requirePlatformSession();
  if (!canManageTeam(session.platformUser.role)) {
    return { error: "Droits insuffisants." };
  }

  if (userId === session.userId && input.active === false) {
    return { error: "Vous ne pouvez pas vous désactiver vous-même." };
  }

  const payload: { role?: PlatformRole; active?: boolean; full_name?: string } = {};
  if (input.role) payload.role = input.role;
  if (input.active !== undefined) payload.active = input.active;
  if (input.full_name?.trim()) payload.full_name = input.full_name.trim();

  if (Object.keys(payload).length === 0) {
    return { error: "Aucune modification à enregistrer." };
  }

  const service = createServiceClient();
  const { error } = await service.database.from("platform_users").update(payload).eq("id", userId);

  if (error) return { error: "Mise à jour impossible." };

  await logPlatformAction(session.userId, "platform.team_update", "platform_user", userId, payload);

  revalidatePath("/platform/equipe");
  return { success: true };
}

export async function removePlatformTeamMemberAction(userId: string) {
  const session = await requirePlatformSession();
  if (!canManageTeam(session.platformUser.role)) {
    return { error: "Droits insuffisants." };
  }

  if (userId === session.userId) {
    return { error: "Vous ne pouvez pas retirer votre propre accès admin." };
  }

  const service = createServiceClient();
  const { error } = await service.database.from("platform_users").delete().eq("id", userId);

  if (error) return { error: "Suppression impossible." };

  await logPlatformAction(session.userId, "platform.team_remove", "platform_user", userId, {});

  revalidatePath("/platform/equipe");
  return { success: true };
}
