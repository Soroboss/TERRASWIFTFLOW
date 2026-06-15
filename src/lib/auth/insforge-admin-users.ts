import { createServiceClient } from "@/lib/insforge/admin";

export interface AuthUserRecord {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

function getAdminConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const config = getAdminConfig();
  if (!config) return null;

  const res = await fetch(
    `${config.baseUrl}/api/auth/users?search=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${config.apiKey}` }, cache: "no-store" }
  );

  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      email: string;
      emailVerified?: boolean;
      profile?: { name?: string };
    }>;
  };
  const user = json.data?.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name,
    emailVerified: Boolean(user.emailVerified),
  };
}

async function findAuthUserWithRetry(
  email: string,
  attempts = 5,
  delayMs = 400
): Promise<AuthUserRecord | null> {
  for (let i = 0; i < attempts; i += 1) {
    const user = await findAuthUserByEmail(email);
    if (user) return user;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

export async function createAuthUser(
  email: string,
  password: string,
  name: string
): Promise<{ error?: string }> {
  const config = getAdminConfig();
  if (!config) {
    return { error: "Configuration serveur InsForge incomplète." };
  }

  const res = await fetch(`${config.baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name, emailVerified: true }),
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

async function verifyAuthUserEmailViaRest(userId: string): Promise<boolean> {
  const config = getAdminConfig();
  if (!config) return false;

  const res = await fetch(`${config.baseUrl}/api/database/rpc/platform_verify_user_email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_user_id: userId }),
    cache: "no-store",
  });

  if (!res.ok) return false;
  const text = (await res.text()).trim();
  return text === "true";
}

export async function verifyAuthUserEmail(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data, error } = await service.database.rpc("platform_verify_user_email", {
    p_user_id: userId,
  });

  if (!error && Boolean(data)) {
    return true;
  }

  return verifyAuthUserEmailViaRest(userId);
}

export async function ensureAuthUserEmailVerified(
  userId: string,
  email?: string
): Promise<boolean> {
  if (email) {
    const existing = await findAuthUserByEmail(email);
    if (existing?.emailVerified) return true;
  }

  const verified = await verifyAuthUserEmail(userId);
  if (!verified) return false;

  if (email) {
    const refreshed = await findAuthUserByEmail(email);
    return Boolean(refreshed?.emailVerified);
  }

  return true;
}

export async function provisionAuthUserForInvite(input: {
  email: string;
  password?: string;
  fullName: string;
}): Promise<{ user?: AuthUserRecord; created?: boolean; error?: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  let user = await findAuthUserByEmail(normalizedEmail);
  let created = false;

  if (!user) {
    const pwd = input.password?.trim();
    if (!pwd) {
      return {
        error:
          "Ce compte n'existe pas encore. Indiquez un mot de passe pour créer l'accès immédiatement.",
      };
    }

    const createdResult = await createAuthUser(normalizedEmail, pwd, input.fullName.trim());
    if (createdResult.error) return { error: createdResult.error };

    user = await findAuthUserWithRetry(normalizedEmail);
    if (!user) {
      return { error: "Compte créé mais introuvable. Réessayez dans quelques secondes." };
    }
    created = true;
  }

  if (!user.emailVerified) {
    const verified = await ensureAuthUserEmailVerified(user.id, normalizedEmail);
    if (!verified) {
      return {
        error:
          "Impossible d'activer la connexion immédiate pour ce compte. Réessayez ou contactez le support.",
      };
    }
    user = { ...user, emailVerified: true };
  }

  return { user, created };
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
