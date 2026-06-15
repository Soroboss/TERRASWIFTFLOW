"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { logPlatformAction } from "@/lib/actions/platform/audit";
import { canManageTeam, requirePlatformSession } from "@/lib/platform/auth";
import { parseInput } from "@/lib/validations/parse";
import { platformStaffMemberSchema } from "@/lib/validations/schemas";
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

async function createStaffAuthUser(
  email: string,
  password: string,
  name: string
): Promise<{ error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) {
    return { error: "Configuration serveur InsForge incomplète." };
  }

  const res = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (body?.message?.toLowerCase().includes("already")) {
      return {};
    }
    return { error: body?.message ?? "Impossible de créer le compte staff." };
  }

  return {};
}

async function verifyStaffAuthEmail(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data, error } = await service.database.rpc("platform_verify_user_email", {
    p_user_id: userId,
  });

  return !error && Boolean(data);
}

async function assertStaffNotTenantUser(userId: string): Promise<{ error?: string }> {
  const service = createServiceClient();
  const { data: tenantProfile } = await service.database
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (tenantProfile) {
    return {
      error:
        "Ce compte est rattaché à une organisation cliente. Utilisez un e-mail dédié au staff TerraSwiftFlow.",
    };
  }

  return {};
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

    const createdResult = await createStaffAuthUser(normalizedEmail, pwd, displayName);
    if (createdResult.error) return { error: createdResult.error };

    authUser = await findAuthUserByEmail(normalizedEmail);
    if (!authUser) {
      return { error: "Compte créé mais introuvable. Réessayez dans quelques secondes." };
    }

    const verified = await verifyStaffAuthEmail(authUser.id);
    if (!verified) {
      return {
        error:
          "Compte créé mais l'e-mail n'a pas pu être validé. Contactez le support technique.",
      };
    }

    created = true;
  }

  const tenantCheck = await assertStaffNotTenantUser(authUser.id);
  if (tenantCheck.error) return { error: tenantCheck.error };

  const service = createServiceClient();
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
