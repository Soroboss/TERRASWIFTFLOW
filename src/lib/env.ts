const PLACEHOLDER_PATTERNS = [
  "votre-projet",
  "votre-cle",
  "your-project",
  "example.com",
  "placeholder",
];

export function isInsforgeConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";
  const apiKey = process.env.INSFORGE_API_KEY ?? "";

  if (!url || !anon || !apiKey) return false;
  if (!url.startsWith("https://") || url.length < 20) return false;
  if (anon.length < 20 || apiKey.length < 10) return false;

  const combined = `${url}${anon}${apiKey}`.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => combined.includes(p));
}

/** @deprecated Utiliser isInsforgeConfigured */
export const isSupabaseConfigured = isInsforgeConfigured;

export function getInsforgeConfigStatus() {
  return {
    configured: isInsforgeConfigured(),
    hasUrl: Boolean(process.env.NEXT_PUBLIC_INSFORGE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY),
    hasApiKey: Boolean(process.env.INSFORGE_API_KEY),
    url: process.env.NEXT_PUBLIC_INSFORGE_URL ?? "",
  };
}

/** @deprecated Utiliser getInsforgeConfigStatus */
export const getSupabaseConfigStatus = getInsforgeConfigStatus;
