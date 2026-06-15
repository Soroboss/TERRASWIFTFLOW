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
  setPendingRegistrationCookie,
} from "@/lib/auth/pending-registration";
import { isPlatformStaffEmail, isPlatformStaffUser } from "@/lib/auth/insforge-admin-users";

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

  const insforge = await createClient();

  const { data: authData, error: authError } = await insforge.auth.signUp({
    email: data.email,
    password: data.password,
    name: data.fullName,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData) {
    return { error: "Erreur lors de la création du compte." };
  }

  if (authData.accessToken) {
    const cookieStore = await cookies();
    setAuthCookies(cookieStore, {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    });
  }

  const selectedPlan = data.plan === "pro" ? "pro" : "starter";
  const pendingInput = {
    email: data.email,
    organizationName: data.organizationName,
    fullName: data.fullName,
    phone: data.phone,
    plan: selectedPlan as Plan,
  };

  if (authData.user?.id) {
    const bootstrap = await bootstrapOrganizationForUser(authData.user.id, pendingInput);
    if (bootstrap.error) return { error: bootstrap.error };
  } else if (authData.requireEmailVerification) {
    await setPendingRegistrationCookie(pendingInput);
  } else {
    return { error: "Erreur lors de la création du compte." };
  }

  if (!authData.accessToken || authData.requireEmailVerification) {
    return {
      needsVerification: true,
      email: data.email,
    };
  }

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
    return { error: error.message };
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
