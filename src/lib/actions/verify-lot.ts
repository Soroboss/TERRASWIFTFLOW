"use server";

import { createServiceClient } from "@/lib/insforge/admin";
import { isInsforgeConfigured } from "@/lib/env";
import type { PropertyStatus } from "@/types/database";

export interface LotVerificationResult {
  found: boolean;
  error?: string;
  organization_name?: string;
  lot_title?: string;
  lot_reference?: string;
  lot_number?: string | null;
  location_label?: string | null;
  status?: PropertyStatus;
  program_name?: string | null;
  price_total?: number;
  verified_at?: string;
  /** Indique si le lot est occupé sans révéler l'identité du client (RGPD). */
  occupied?: boolean;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function verifyLotPublicAction(input: {
  organization_slug: string;
  reference: string;
}): Promise<LotVerificationResult> {
  if (!isInsforgeConfigured()) {
    return { found: false, error: "Service indisponible." };
  }

  const slug = normalizeSlug(input.organization_slug);
  const reference = input.reference.trim().toUpperCase();

  if (!slug || reference.length < 2) {
    return { found: false, error: "Programme et référence lot requis." };
  }

  try {
    const admin = createServiceClient();
    const orgNameSearch = input.organization_slug.trim().replace(/[%_]/g, "");

    const { data: orgBySlug } = await admin.database
      .from("organizations")
      .select("id, name, public_slug")
      .eq("public_slug", slug)
      .maybeSingle();

    let org: { id: string; name: string; public_slug: string | null } | null = orgBySlug ?? null;

    if (!org && orgNameSearch.length >= 2) {
      const { data: orgsByName } = await admin.database
        .from("organizations")
        .select("id, name, public_slug")
        .ilike("name", `%${orgNameSearch}%`)
        .limit(5);
      org =
        orgsByName?.find((o) => normalizeSlug(o.name as string) === slug) ??
        orgsByName?.[0] ??
        null;
    }

    if (!org) {
      return { found: false, error: "Programme ou promoteur introuvable." };
    }

    const { data: property } = await admin.database
      .from("properties")
      .select(
        "id, title, reference, lot_number, status, location_label, price_total, masterplan_id, masterplan:masterplans(name)"
      )
      .eq("organization_id", org.id)
      .or(`reference.ilike.${reference},lot_number.ilike.${reference}`)
      .maybeSingle();

    if (!property) {
      return {
        found: false,
        error: `Aucun lot « ${reference} » trouvé pour ${org.name}.`,
      };
    }

    const masterplan = property.masterplan as { name: string } | { name: string }[] | null;
    const programName = Array.isArray(masterplan) ? masterplan[0]?.name : masterplan?.name;

    const { data: activeDeal } = await admin.database
      .from("deals")
      .select("id")
      .eq("property_id", property.id)
      .in("status", ["en_cours", "solde"])
      .maybeSingle();

    return {
      found: true,
      organization_name: org.name as string,
      lot_title: property.title as string,
      lot_reference: property.reference as string,
      lot_number: property.lot_number as string | null,
      location_label: property.location_label as string | null,
      status: property.status as PropertyStatus,
      program_name: programName ?? null,
      price_total: Number(property.price_total),
      verified_at: new Date().toISOString(),
      occupied: Boolean(activeDeal) || property.status !== "libre",
    };
  } catch {
    return { found: false, error: "Erreur de vérification. Réessayez." };
  }
}
