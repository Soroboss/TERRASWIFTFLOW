const PLACEHOLDER_PATTERNS = [
  "votre-projet",
  "votre-cle",
  "your-project",
  "example.com",
  "placeholder",
];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !anon || !service) return false;
  if (!url.startsWith("https://") || url.length < 20) return false;
  if (anon.length < 20 || service.length < 20) return false;

  const combined = `${url}${anon}${service}`.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => combined.includes(p));
}

export function getSupabaseConfigStatus() {
  return {
    configured: isSupabaseConfigured(),
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  };
}
