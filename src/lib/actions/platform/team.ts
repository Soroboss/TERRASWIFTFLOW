"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import {
  createAuthUser,
  findAuthUserByEmail,
  verifyAuthUserEmail,
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
  let authUser = await findAuthUserByEmail(normalizedEmail);
  let created = false;

  if (!authUser) {
    const pwd = parsed.data.password?.trim();
    if (!pwd) {
      return {
        error:
          "Ce compte n'existe pas encore. Renseignez un mot de passe pour créer le compte staff.",
      };
    }

    const createdResult = await createAuthUser(normalizedEmail, pwd, displayName);
    if (createdResult.error) return { error: createdResult.error };

    authUser = await findAuthUserByEmail(normalizedEmail);
    if (!authUser) {
      return { error: "Compte créé mais introuvable. Réessayez dans quelques secondes." };
    }

    const verified = await verifyAuthUserEmail(authUser.id);
    if (!verified) {
      return {
        error:
          "Compte créé mais l'e-mail n'a pas pu être validé. Contactez le support technique.",
      };
    }

    created = true;
  }

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
      ? "Compte staff créé et ajouté à l'équipe. Communiquez le mot de passe au collaborateur."
      : "Membre ajouté à l'équipe plateforme.",
  };
}

export async function updatePlatformTeamMemberAction(
  userId: string,
  input: { role?: PlatformRole; active?: boolean }
) {
  const session = await requirePlatformSession();
  if (!canManageTeam(session.platformUser.role)) {
    return { error: "Droits insuffisants." };
  }

  if (userId === session.userId && input.active === false) {
    return { error: "Vous ne pouvez pas vous désactiver vous-même." };
  }

  const service = createServiceClient();
  const { error } = await service.database.from("platform_users").update(input).eq("id", userId);

  if (error) return { error: "Mise à jour impossible." };

  await logPlatformAction(session.userId, "platform.team_update", "platform_user", userId, input);

  revalidatePath("/platform/equipe");
  return { success: true };
}
