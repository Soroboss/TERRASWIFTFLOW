import { createClient } from "@/lib/insforge/server";
import type { Organization, Profile } from "@/types/database";
import { isInsforgeConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export interface SessionContext {
  userId: string;
  profile: Profile;
  organization: Organization;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  if (!isInsforgeConfigured()) return null;

  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user) return null;

    const { data: profile } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const { data: organization } = await insforge.database
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
  if (org.suspended_at) return false;
  if (org.subscription_status === "active") return true;
  if (org.trial_ends_at && new Date(org.trial_ends_at) > new Date()) return true;
  return false;
}
