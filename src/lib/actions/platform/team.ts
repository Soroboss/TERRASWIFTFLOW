"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import { canManageTeam, requirePlatformSession } from "@/lib/platform/auth";
import type { PlatformRole, PlatformUser } from "@/types/platform";
import { revalidatePath } from "next/cache";

async function findAuthUserByEmail(email: string): Promise<{ id: string; email: string; name?: string } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) return null;

  const res = await fetch(
    `${baseUrl}/api/auth/users?search=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: Array<{ id: string; email: string; profile?: { name?: string } }>;
  };
  const user = json.data?.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.profile?.name };
}

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
  fullName?: string
) {
  const session = await requirePlatformSession();
  if (!canManageTeam(session.platformUser.role)) {
    return { error: "Seul un super administrateur peut gérer l'équipe." };
  }

  const authUser = await findAuthUserByEmail(email.trim());
  if (!authUser) {
    return {
      error:
        "Utilisateur introuvable. La personne doit d'abord créer un compte TerraSwiftFlow (inscription ou invitation).",
    };
  }

  const service = createServiceClient();
  const { error } = await service.database.from("platform_users").upsert(
    {
      id: authUser.id,
      email: authUser.email,
      full_name: fullName?.trim() || authUser.name || authUser.email.split("@")[0],
      role,
      active: true,
    },
    { onConflict: "id" }
  );

  if (error) return { error: "Impossible d'ajouter ce membre." };

  await logPlatformAction(session.userId, "platform.team_add", "platform_user", authUser.id, {
    email,
    role,
  });

  revalidatePath("/platform/equipe");
  return { success: true };
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
