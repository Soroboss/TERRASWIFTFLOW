import { NextResponse } from "next/server";
import { getSupabaseConfigStatus, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const config = getSupabaseConfigStatus();

  if (!config.configured) {
    return NextResponse.json({
      status: "misconfigured",
      configured: false,
      message: "Renseignez .env.local — voir /setup",
    });
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);

    if (error?.code === "42P01" || error?.message.includes("does not exist")) {
      return NextResponse.json({
        status: "needs_migration",
        configured: true,
        db: false,
        message: "Exécutez supabase/full_schema.sql dans Supabase SQL Editor",
      });
    }

    if (error) {
      return NextResponse.json({
        status: "error",
        configured: true,
        db: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      status: "ok",
      configured: true,
      db: true,
      message: "Prêt pour les tests locaux",
    });
  } catch (e) {
    return NextResponse.json({
      status: "error",
      configured: isSupabaseConfigured(),
      message: e instanceof Error ? e.message : "Erreur inconnue",
    });
  }
}
