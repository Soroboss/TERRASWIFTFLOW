import { createServiceClient } from "@/lib/insforge/admin";
import { isPlatformStaffUser } from "@/lib/auth/insforge-admin-users";
import { normalizePhoneCI } from "@/lib/format";
import { TRIAL_DAYS } from "@/lib/pricing";
import type { Plan } from "@/types/database";
import { addDays } from "date-fns";
import { cookies } from "next/headers";

const COOKIE_NAME = "tsf_pending_registration";
const COOKIE_MAX_AGE = 60 * 60;

export interface PendingRegistration {
  email: string;
  organizationName: string;
  fullName: string;
  phone: string;
  plan: Plan;
}

export async function setPendingRegistrationCookie(data: PendingRegistration) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function consumePendingRegistrationCookie(
  email: string
): Promise<PendingRegistration | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  cookieStore.delete(COOKIE_NAME);

  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as PendingRegistration;
    if (data.email.toLowerCase() !== email.toLowerCase()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function bootstrapOrganizationForUser(
  userId: string,
  input: Pick<PendingRegistration, "organizationName" | "fullName" | "phone" | "plan">
): Promise<{
  error?: string;
  organizationId?: string;
  trialEndsAt?: string;
  plan?: Plan;
}> {
  if (await isPlatformStaffUser(userId)) {
    return {
      error:
        "Ce compte est réservé à l'équipe TerraSwiftFlow et ne peut pas créer d'organisation cliente.",
    };
  }

  const service = createServiceClient();

  const { data: existingProfile } = await service.database
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    return {};
  }

  const trialEndsAt = addDays(new Date(), TRIAL_DAYS).toISOString();
  const selectedPlan = input.plan === "pro" ? "pro" : "starter";

  const { data: org, error: orgError } = await service.database
    .from("organizations")
    .insert({
      name: input.organizationName,
      plan: selectedPlan,
      subscription_status: "trial",
      trial_ends_at: trialEndsAt,
      modules: {},
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: "Impossible de créer l'organisation." };
  }

  const { error: profileError } = await service.database.from("profiles").insert({
    id: userId,
    organization_id: org.id,
    full_name: input.fullName,
    role: "owner",
    phone: normalizePhoneCI(input.phone),
    active: true,
  });

  if (profileError) {
    return { error: "Impossible de créer le profil utilisateur." };
  }

  return {
    organizationId: org.id,
    trialEndsAt,
    plan: selectedPlan,
  };
}
