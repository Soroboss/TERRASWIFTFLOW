import { createServiceClient } from "@/lib/insforge/admin";

export interface AuthUserRecord {
  id: string;
  email: string;
  name?: string;
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
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

export async function createAuthUser(
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
    return { error: body?.message ?? "Impossible de créer le compte." };
  }

  return {};
}

export async function verifyAuthUserEmail(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data, error } = await service.database.rpc("platform_verify_user_email", {
    p_user_id: userId,
  });

  return !error && Boolean(data);
}

export async function isPlatformStaffUser(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service.database
    .from("platform_users")
    .select("id")
    .eq("id", userId)
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}

export async function isPlatformStaffEmail(email: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service.database
    .from("platform_users")
    .select("id")
    .ilike("email", email.trim())
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}
