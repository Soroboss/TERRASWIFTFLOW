import { createClient } from "@/lib/insforge/server";
import { createServiceClient } from "@/lib/insforge/admin";
import type { PlatformRole, PlatformUser } from "@/types/platform";
import { redirect } from "next/navigation";

export interface PlatformSession {
  userId: string;
  email: string;
  platformUser: PlatformUser;
}

function getBootstrapEmails(): string[] {
  const raw = process.env.PLATFORM_BOOTSTRAP_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function maybeBootstrapPlatformUser(
  userId: string,
  email: string,
  name?: string | null
): Promise<PlatformUser | null> {
  const bootstrapEmails = getBootstrapEmails();
  if (!bootstrapEmails.includes(email.toLowerCase())) return null;

  const service = createServiceClient();
  const { data, error } = await service.database
    .from("platform_users")
    .insert({
      id: userId,
      email,
      full_name: name ?? email.split("@")[0],
      role: "super_admin",
      active: true,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return data as PlatformUser;
}

export async function getPlatformUser(userId: string): Promise<PlatformUser | null> {
  const service = createServiceClient();
  const { data } = await service.database
    .from("platform_users")
    .select("*")
    .eq("id", userId)
    .eq("active", true)
    .maybeSingle();

  return (data as PlatformUser | null) ?? null;
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  try {
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user?.id || !user.email) return null;

    let platformUser = await getPlatformUser(user.id);

    if (!platformUser) {
      platformUser = await maybeBootstrapPlatformUser(
        user.id,
        user.email,
        user.profile?.name as string | undefined
      );
    }

    if (!platformUser) return null;

    return {
      userId: user.id,
      email: user.email,
      platformUser,
    };
  } catch {
    return null;
  }
}

export async function requirePlatformSession(
  minRole?: PlatformRole
): Promise<PlatformSession> {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  if (minRole === "super_admin" && session.platformUser.role !== "super_admin") {
    redirect("/platform");
  }

  return session;
}

export function canManageTeam(role: PlatformRole): boolean {
  return role === "super_admin";
}

export function canManageBilling(role: PlatformRole): boolean {
  return role === "super_admin" || role === "billing";
}
