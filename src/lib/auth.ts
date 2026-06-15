import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export interface SessionContext {
  userId: string;
  profile: Profile;
  organization: Organization;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    if (!organization) return null;

    return {
      userId: user.id,
      profile: profile as Profile,
      organization: organization as Organization,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  return session;
}

export function isSubscriptionActive(org: Organization): boolean {
  if (org.subscription_status === "active") return true;
  if (org.trial_ends_at && new Date(org.trial_ends_at) > new Date()) return true;
  return false;
}
