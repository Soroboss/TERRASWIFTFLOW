"use server";

import { requireSession } from "@/lib/auth";
import { canManageOrganizationSettings } from "@/lib/auth/permissions";
import { normalizePhoneCI } from "@/lib/format";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { organizationSettingsSchema } from "@/lib/validations/schemas";
import type { Organization } from "@/types/database";
import {
  parseCompanyProfile,
  type CompanyProfile,
} from "@/types/organization-profile";
import { revalidatePath } from "next/cache";

export interface OrganizationSettings {
  organization: Organization;
  profile: CompanyProfile;
}

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const session = await requireSession();
  const insforge = await createClient();

  const { data, error } = await insforge.database
    .from("organizations")
    .select("*")
    .eq("id", session.profile.organization_id)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Organisation introuvable.");

  const organization = data as Organization & { company_profile?: unknown };

  return {
    organization,
    profile: parseCompanyProfile(organization.company_profile),
  };
}

export async function updateOrganizationSettingsAction(input: {
  name: string;
  billing_email?: string | null;
  profile: CompanyProfile;
}) {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent modifier les paramètres." };
  }

  const parsed = parseInput(organizationSettingsSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const data = parsed.data;
  const profile: CompanyProfile = {
    ...data.profile,
    contact_phone: data.profile.contact_phone
      ? normalizePhoneCI(data.profile.contact_phone)
      : null,
    whatsapp: data.profile.whatsapp ? normalizePhoneCI(data.profile.whatsapp) : null,
  };

  const insforge = await createClient();
  const { error } = await insforge.database
    .from("organizations")
    .update({
      name: data.name,
      billing_email: data.billing_email ?? null,
      company_profile: profile,
    })
    .eq("id", session.profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/parametres");
  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function updatePublicSlugAction(slug: string) {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  const normalized = slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const insforge = await createClient();
  const { error } = await insforge.database
    .from("organizations")
    .update({ public_slug: normalized || null })
    .eq("id", session.profile.organization_id);

  if (error) {
    if (error.message.includes("idx_organizations_public_slug")) {
      return { error: "Cet identifiant public est déjà utilisé." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/parametres");
  return { success: true };
}

export async function uploadOrganizationLogoAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session.profile.role)) {
    return { error: "Droits insuffisants." };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Fichier manquant." };

  if (!file.type.startsWith("image/")) {
    return { error: "Le logo doit être une image (JPEG, PNG, WebP)." };
  }

  const insforge = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${session.profile.organization_id}/logo-${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await insforge.storage
    .from("organization-assets")
    .upload(path, file);

  if (uploadError) {
    return {
      error:
        uploadError.message.includes("Bucket not found") ||
        uploadError.message.includes("not found")
          ? "Bucket organization-assets manquant. Créez-le dans InsForge Storage."
          : uploadError.message,
    };
  }

  if (!uploadData?.url) return { error: "URL du logo introuvable." };

  const settings = await getOrganizationSettings();
  const profile = { ...settings.profile, logo_url: uploadData.url };

  const { error: updateError } = await insforge.database
    .from("organizations")
    .update({ company_profile: profile })
    .eq("id", session.profile.organization_id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/parametres");
  return { url: uploadData.url };
}
