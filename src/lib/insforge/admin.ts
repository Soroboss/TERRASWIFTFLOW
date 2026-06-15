import { createAdminClient } from "@insforge/sdk";

export function createServiceClient() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("INSFORGE_API_KEY et NEXT_PUBLIC_INSFORGE_URL requis.");
  }

  return createAdminClient({ baseUrl, apiKey });
}
