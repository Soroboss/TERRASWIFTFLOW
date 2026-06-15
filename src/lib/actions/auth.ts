"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneCI } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/env";
import { addDays } from "date-fns";
import { redirect } from "next/navigation";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  phone: string;
}

export async function registerAction(input: RegisterInput) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase non configuré. Renseignez .env.local puis consultez /setup pour le guide.",
    };
  }

  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte." };
  }

  const service = createServiceClient();
  const trialEndsAt = addDays(new Date(), 14).toISOString();

  const { data: org, error: orgError } = await service
    .from("organizations")
    .insert({
      name: input.organizationName,
      plan: "starter",
      subscription_status: "trial",
      trial_ends_at: trialEndsAt,
      modules: {},
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: "Impossible de créer l'organisation." };
  }

  const { error: profileError } = await service.from("profiles").insert({
    id: authData.user.id,
    organization_id: org.id,
    full_name: input.fullName,
    role: "owner",
    phone: normalizePhoneCI(input.phone),
    active: true,
  });

  if (profileError) {
    return { error: "Impossible de créer le profil utilisateur." };
  }

  redirect("/dashboard");
}

export async function loginAction(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase non configuré. Renseignez .env.local puis consultez /setup pour le guide.",
    };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
