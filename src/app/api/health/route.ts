import { NextResponse } from "next/server";
import { getInsforgeConfigStatus, isInsforgeConfigured } from "@/lib/env";
import { createClient } from "@/lib/insforge/server";

export async function GET() {
  const config = getInsforgeConfigStatus();

  if (!config.configured) {
    return NextResponse.json({
      status: "misconfigured",
      configured: false,
      message: "Renseignez .env.local — voir /setup",
    });
  }

  try {
    const insforge = await createClient();
    const { error } = await insforge.database.from("organizations").select("id").limit(1);

    if (error?.code === "42P01" || error?.message.includes("does not exist")) {
      return NextResponse.json({
        status: "needs_migration",
        configured: true,
        db: false,
        message: "Importez insforge/schema.sql via npx @insforge/cli db import",
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
      configured: isInsforgeConfigured(),
      message: e instanceof Error ? e.message : "Erreur inconnue",
    });
  }
}
