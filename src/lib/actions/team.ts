"use server";

import { requireSession } from "@/lib/auth";
import {
  isPlatformStaffUser,
  provisionAuthUserForInvite,
} from "@/lib/auth/insforge-admin-users";
import { createServiceClient } from "@/lib/insforge/admin";
import { normalizePhoneCI } from "@/lib/format";
import { parseInput } from "@/lib/validations/parse";
import { tenantTeamMemberSchema } from "@/lib/validations/schemas";
import type { Profile, UserRole } from "@/types/database";
import { revalidatePath } from "next/cache";

const STARTER_AGENT_LIMIT = 3;

function canManageOrganizationTeam(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}

export async function getOrganizationTeam(): Promise<Profile[]> {
  const session = await requireSession();
  const service = createServiceClient();

  const { data, error } = await service.database
    .from("profiles")
    .select("*")
    .eq("organization_id", session.profile.organization_id)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as Profile[];
}

export async function addOrganizationTeamMemberAction(
  email: string,
  role: UserRole,
  fullName: string,
  password?: string,
  phone?: string
) {
  const session = await requireSession();
  if (!canManageOrganizationTeam(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent gérer l'équipe." };
  }

  if (role === "owner") {
    return { error: "Un collaborateur ne peut pas être créé avec le rôle propriétaire." };
  }

  const parsed = parseInput(tenantTeamMemberSchema, {
    email,
    role,
    fullName,
    password: password ?? "",
    phone: phone ?? "",
  });
  if ("error" in parsed) return { error: parsed.error };

  const service = createServiceClient();
  const normalizedEmail = parsed.data.email.toLowerCase();
  const displayName = parsed.data.fullName.trim();

  const { data: team } = await service.database
    .from("profiles")
    .select("id")
    .eq("organization_id", session.profile.organization_id)
    .eq("active", true);

  if (session.organization.plan === "starter" && (team?.length ?? 0) >= STARTER_AGENT_LIMIT) {
    return {
      error: `Le plan Starter est limité à ${STARTER_AGENT_LIMIT} utilisateurs. Passez au plan Pro pour en ajouter davantage.`,
    };
  }

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

  if (await isPlatformStaffUser(authUser.id)) {
    return {
      error:
        "Cet e-mail est réservé à l'équipe TerraSwiftFlow (admin SaaS). Utilisez une autre adresse pour votre organisation.",
    };
  }

  const { data: existingProfile } = await service.database
    .from("profiles")
    .select("id, organization_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.organization_id === session.profile.organization_id) {
      return { error: "Ce collaborateur fait déjà partie de votre organisation." };
    }
    return {
      error:
        "Ce compte est déjà rattaché à une autre organisation. Utilisez un autre e-mail.",
    };
  }

  const { error } = await service.database.from("profiles").insert({
    id: authUser.id,
    organization_id: session.profile.organization_id,
    full_name: displayName,
    role: parsed.data.role,
    phone: parsed.data.phone ? normalizePhoneCI(parsed.data.phone) : null,
    active: true,
  });

  if (error) return { error: "Impossible d'ajouter ce collaborateur." };

  revalidatePath("/dashboard/equipe");
  return {
    success: true,
    created,
    message: created
      ? "Collaborateur créé avec connexion immédiate. Il peut se connecter tout de suite avec l'e-mail et le mot de passe définis — aucun code e-mail requis."
      : "Collaborateur ajouté. Connexion immédiate activée avec son mot de passe existant.",
  };
}

export async function updateOrganizationTeamMemberAction(
  userId: string,
  input: {
    role?: UserRole;
    active?: boolean;
    full_name?: string;
    phone?: string | null;
  }
) {
  const session = await requireSession();
  if (!canManageOrganizationTeam(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  if (userId === session.userId && input.active === false) {
    return { error: "Vous ne pouvez pas vous désactiver vous-même." };
  }

  if (input.role === "owner") {
    return { error: "Le rôle propriétaire ne peut pas être attribué depuis cette page." };
  }

  const service = createServiceClient();
  const { data: member } = await service.database
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (!member || member.organization_id !== session.profile.organization_id) {
    return { error: "Collaborateur introuvable." };
  }

  if (member.role === "owner" && input.role) {
    return { error: "Le propriétaire du compte ne peut pas être rétrogradé ici." };
  }

  const payload: {
    role?: UserRole;
    active?: boolean;
    full_name?: string;
    phone?: string | null;
  } = {};

  if (input.role) payload.role = input.role;
  if (input.active !== undefined) payload.active = input.active;
  if (input.full_name?.trim()) payload.full_name = input.full_name.trim();
  if (input.phone !== undefined) {
    payload.phone = input.phone ? normalizePhoneCI(input.phone) : null;
  }

  if (Object.keys(payload).length === 0) {
    return { error: "Aucune modification à enregistrer." };
  }

  const { error } = await service.database.from("profiles").update(payload).eq("id", userId);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function removeOrganizationTeamMemberAction(userId: string) {
  const session = await requireSession();
  if (!canManageOrganizationTeam(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  if (userId === session.userId) {
    return { error: "Vous ne pouvez pas retirer votre propre accès." };
  }

  const service = createServiceClient();
  const { data: member } = await service.database
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (!member || member.organization_id !== session.profile.organization_id) {
    return { error: "Collaborateur introuvable." };
  }

  if (member.role === "owner") {
    return { error: "Le propriétaire du compte ne peut pas être retiré." };
  }

  const { error: deleteError } = await service.database.from("profiles").delete().eq("id", userId);

  if (deleteError) {
    const { error: deactivateError } = await service.database
      .from("profiles")
      .update({ active: false })
      .eq("id", userId);

    if (deactivateError) {
      return {
        error:
          "Impossible de retirer ce collaborateur (données liées). Désactivez-le via Modifier.",
      };
    }
  }

  revalidatePath("/dashboard/equipe");
  return { success: true };
}
