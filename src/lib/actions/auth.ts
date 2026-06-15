"use server";

import { createClient } from "@/lib/insforge/server";
import { getSessionContext } from "@/lib/auth";
import { getPlatformSession } from "@/lib/platform/auth";
import { isInsforgeConfigured } from "@/lib/env";
import { getClientIp } from "@/lib/security/client-ip";
import {
  AUTH_RATE_LIMIT,
  AUTH_RESEND_RATE_LIMIT,
  checkRateLimit,
} from "@/lib/security/rate-limit";
import { parseInput } from "@/lib/validations/parse";
import {
  loginSchema,
  registerSchema,
  resendEmailSchema,
  verifyEmailSchema,
} from "@/lib/validations/schemas";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { setAuthCookies, clearAuthCookies } from "@insforge/sdk/ssr";
import type { Plan } from "@/types/database";
import {
  bootstrapOrganizationForUser,
  consumePendingRegistrationCookie,
} from "@/lib/auth/pending-registration";
import {
  findAuthUserByEmail,
  isPlatformStaffEmail,
  provisionAuthUserForInvite,
} from "@/lib/auth/insforge-admin-users";
import { createServiceClient } from "@/lib/insforge/admin";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  phone: string;
  plan?: Plan;
}

function authRateLimitMessage(retryAfterSec?: number) {
  const minutes = retryAfterSec ? Math.ceil(retryAfterSec / 60) : 15;
  return `Trop de tentatives. Réessayez dans ${minutes} minute(s).`;
}

async function assertAuthRateLimit(
  bucket: string,
  options: { limit: number; windowMs: number } = AUTH_RATE_LIMIT
) {
  const headerList = await headers();
  const ip = getClientIp(headerList);
  const result = await checkRateLimit(bucket, ip, options);
  if (!result.allowed) {
    return { error: authRateLimitMessage(result.retryAfterSec) };
  }
  return null;
}

export async function registerAction(input: RegisterInput) {
  const limited = await assertAuthRateLimit("auth:register");
  if (limited) return limited;

  const parsed = parseInput(registerSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  if (!isInsforgeConfigured()) {
    return {
      error:
        "InsForge non configuré. Renseignez .env.local puis consultez /setup pour le guide.",
    };
  }

  const data = parsed.data;

  if (await isPlatformStaffEmail(data.email)) {
    return {
      error:
        "Cet e-mail est réservé à l'équipe TerraSwiftFlow. Utilisez la page admin plateforme pour gérer les comptes staff.",
    };
  }

  const selectedPlan = data.plan === "pro" ? "pro" : "starter";
  const pendingInput = {
    email: data.email,
    organizationName: data.organizationName,
    fullName: data.fullName,
    phone: data.phone,
    plan: selectedPlan as Plan,
  };

  const existingUser = await findAuthUserByEmail(data.email);
  if (existingUser) {
    const service = createServiceClient();
    const { data: existingProfile } = await service.database
      .from("profiles")
      .select("id")
      .eq("id", existingUser.id)
      .maybeSingle();

    if (existingProfile) {
      return { error: "Un compte existe déjà avec cet e-mail. Connectez-vous." };
    }
  }

  const provisioned = await provisionAuthUserForInvite({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
  });

  if (provisioned.error || !provisioned.user) {
    return {
      error:
        provisioned.error ??
        "Inscription impossible. Vérifiez vos informations ou contactez le support.",
    };
  }

  const insforge = await createClient();
  const { data: signInData, error: signInError } = await insforge.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (signInError || !signInData?.accessToken) {
    return {
      error:
        existingUser
          ? "Un compte existe déjà avec cet e-mail. Utilisez la connexion ou réinitialisez votre mot de passe."
          : (signInError?.message ?? "Connexion impossible après inscription."),
    };
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: signInData.accessToken,
    refreshToken: signInData.refreshToken,
  });

  const userId = signInData.user?.id ?? provisioned.user.id;
  const bootstrap = await bootstrapOrganizationForUser(userId, pendingInput);
  if (bootstrap.error) return { error: bootstrap.error };

  redirect("/dashboard");
}

/** Active une inscription en attente sans code OTP (SMTP non configuré ou e-mail non reçu). */
export async function completeRegistrationActivationAction(email: string, password: string) {
  const limited = await assertAuthRateLimit("auth:register");
  if (limited) return limited;

  const parsed = parseInput(loginSchema, { email, password });
  if ("error" in parsed) return { error: parsed.error };

  if (!isInsforgeConfigured()) {
    return { error: "InsForge non configuré." };
  }

  const pending = await consumePendingRegistrationCookie(parsed.data.email);
  if (!pending) {
    return {
      error:
        "Session d'inscription expirée. Recommencez l'inscription ou contactez le support.",
    };
  }

  const provisioned = await provisionAuthUserForInvite({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: pending.fullName,
  });

  if (provisioned.error || !provisioned.user) {
    return { error: provisioned.error ?? "Activation impossible." };
  }

  const insforge = await createClient();
  const { data: signInData, error: signInError } = await insforge.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError || !signInData?.accessToken) {
    return { error: signInError?.message ?? "Connexion impossible." };
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: signInData.accessToken,
    refreshToken: signInData.refreshToken,
  });

  const bootstrap = await bootstrapOrganizationForUser(
    signInData.user?.id ?? provisioned.user.id,
    pending
  );
  if (bootstrap.error) return { error: bootstrap.error };

  redirect("/dashboard");
}

export async function verifyEmailAction(email: string, otp: string) {
  const limited = await assertAuthRateLimit("auth:verify");
  if (limited) return limited;

  const parsed = parseInput(verifyEmailSchema, { email, otp });
  if ("error" in parsed) return { error: parsed.error };

  if (!isInsforgeConfigured()) {
    return { error: "InsForge non configuré." };
  }

  const insforge = await createClient();
  const { data, error } = await insforge.auth.verifyEmail({
    email: parsed.data.email,
    otp: parsed.data.otp,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data?.accessToken) {
    return { error: "Code invalide ou expiré." };
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  const userId = data.user?.id;
  if (userId) {
    const pending = await consumePendingRegistrationCookie(parsed.data.email);
    if (pending) {
      const bootstrap = await bootstrapOrganizationForUser(userId, pending);
      if (bootstrap.error) return { error: bootstrap.error };
    }
  }

  redirect("/dashboard");
}

export async function resendVerificationEmailAction(email: string) {
  const limited = await assertAuthRateLimit(
    "auth:resend",
    AUTH_RESEND_RATE_LIMIT
  );
  if (limited) return limited;

  const parsed = parseInput(resendEmailSchema, { email });
  if ("error" in parsed) return { error: parsed.error };

  if (!isInsforgeConfigured()) {
    return { error: "InsForge non configuré." };
  }

  const insforge = await createClient();
  const { error } = await insforge.auth.resendVerificationEmail({
    email: parsed.data.email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
  });

  if (error) {
    return {
      error:
        "Envoi du code impossible (e-mail non configuré). Recommencez l'inscription : votre compte sera activé automatiquement.",
    };
  }

  return { success: true };
}

export async function loginAction(email: string, password: string) {
  const limited = await assertAuthRateLimit("auth:login");
  if (limited) return limited;

  const parsed = parseInput(loginSchema, { email, password });
  if ("error" in parsed) return { error: parsed.error };

  if (!isInsforgeConfigured()) {
    return {
      error:
        "InsForge non configuré. Renseignez .env.local puis consultez /setup pour le guide.",
    };
  }

  const insforge = await createClient();

  const { data, error } = await insforge.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("verif") || message.includes("confirm")) {
      return {
        error:
          "E-mail non vérifié. Demandez à votre responsable de recréer votre accès depuis Équipe, ou saisissez le code reçu par e-mail sur la page d'inscription.",
      };
    }
    return { error: error.message };
  }

  if (!data?.accessToken) {
    return { error: "Connexion impossible." };
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  const [tenantSession, platformSession] = await Promise.all([
    getSessionContext(),
    getPlatformSession(),
  ]);

  if (tenantSession) {
    redirect("/dashboard");
  }
  if (platformSession) {
    redirect("/platform");
  }

  redirect("/compte-en-attente");
}

export async function logoutAction() {
  const insforge = await createClient();
  await insforge.auth.signOut();

  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);

  redirect("/login");
}
