import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm text-amber-950">
      Supabase non configuré — l&apos;authentification ne fonctionnera pas.{" "}
      <Link href="/setup" className="font-semibold underline underline-offset-2">
        Guide de configuration locale →
      </Link>
    </div>
  );
}
