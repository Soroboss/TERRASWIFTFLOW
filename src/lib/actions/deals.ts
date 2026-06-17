"use server";

import { requireSession } from "@/lib/auth";
import {
  buildDealFinancials,
  propertyAvailabilityMessage,
  type PropertyDealCheck,
} from "@/lib/deals";
import { generatePaymentSchedule } from "@/lib/schedule";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { createDealSchema } from "@/lib/validations/schemas";
import type { Client, Deal, Profile, Property } from "@/types/database";
import type {
  DealFinancials,
  DealWithRelations,
  Payment,
  PaymentSchedule,
} from "@/types/entities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getDeals(): Promise<DealWithRelations[]> {
  return getDealsList();
}

export type DealStatus = Deal["status"];

export interface DealListFilters {
  q?: string;
  status?: DealStatus;
  agent?: string;
}

export interface DealStatusCounts {
  total: number;
  en_cours: number;
  solde: number;
  annule: number;
}

export async function getDealStatusCounts(): Promise<DealStatusCounts> {
  const insforge = await createClient();

  const [total, enCours, solde, annule] = await Promise.all([
    insforge.database.from("deals").select("id", { count: "exact", head: true }),
    insforge.database
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "en_cours"),
    insforge.database
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "solde"),
    insforge.database
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "annule"),
  ]);

  if (total.error) throw new Error(total.error.message);
  if (enCours.error) throw new Error(enCours.error.message);
  if (solde.error) throw new Error(solde.error.message);
  if (annule.error) throw new Error(annule.error.message);

  return {
    total: total.count ?? 0,
    en_cours: enCours.count ?? 0,
    solde: solde.count ?? 0,
    annule: annule.count ?? 0,
  };
}

export async function getDealsList(filters?: DealListFilters): Promise<DealWithRelations[]> {
  const insforge = await createClient();
  let query = insforge.database
    .from("deals")
    .select("*, property:properties(title, reference), client:clients(full_name, phone), agent:profiles(full_name)")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.agent) {
    query = query.eq("agent_id", filters.agent);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let deals = (data ?? []) as DealWithRelations[];

  if (filters?.q?.trim()) {
    const term = filters.q.trim().toLowerCase();
    deals = deals.filter((d) => {
      const clientName = d.client?.full_name?.toLowerCase() ?? "";
      const propertyTitle = d.property?.title?.toLowerCase() ?? "";
      const propertyRef = d.property?.reference?.toLowerCase() ?? "";
      return (
        clientName.includes(term) ||
        propertyTitle.includes(term) ||
        propertyRef.includes(term)
      );
    });
  }

  return deals;
}

export async function getDealsByClientId(clientId: string): Promise<DealWithRelations[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deals")
    .select("*, property:properties(title, reference), client:clients(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DealWithRelations[];
}

export async function getDeal(id: string): Promise<DealWithRelations | null> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deals")
    .select("*, property:properties(*), client:clients(*), agent:profiles(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as DealWithRelations;
}

export async function checkPropertyForDeal(
  propertyId: string
): Promise<PropertyDealCheck> {
  const insforge = await createClient();

  const { data: property } = await insforge.database
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return {
      blocked: true,
      reason: "Bien introuvable.",
      deal: { id: "", organization_id: "", property_id: propertyId, client_id: "", agent_id: "", total_amount: 0, status: "en_cours", signed_at: null, created_at: "" },
    };
  }

  const { data: activeDeal } = await insforge.database
    .from("deals")
    .select("*, client:clients(full_name), agent:profiles(full_name)")
    .eq("property_id", propertyId)
    .in("status", ["en_cours", "solde"])
    .maybeSingle();

  const prop = property as Property;

  if (prop.status !== "libre" || activeDeal) {
    return {
      blocked: true,
      reason: propertyAvailabilityMessage(prop, activeDeal as Deal & { client?: { full_name: string }; agent?: { full_name: string } }),
      deal: activeDeal as Deal & { client?: Pick<Client, "full_name">; agent?: Pick<Profile, "full_name"> },
    };
  }

  return { blocked: false, property: prop };
}

export async function getAvailableProperties(): Promise<Property[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("properties")
    .select("*")
    .eq("status", "libre")
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []) as Property[];
}

export async function createDealAction(input: {
  property_id: string;
  client_id: string;
  total_amount: number;
}) {
  const parsed = parseInput(createDealSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  const data = parsed.data;
  const check = await checkPropertyForDeal(data.property_id);

  if (check.blocked) {
    return { error: check.reason };
  }

  const insforge = await createClient();
  const { data: deal, error } = await insforge.database
    .from("deals")
    .insert({
      organization_id: session.profile.organization_id,
      property_id: data.property_id,
      client_id: data.client_id,
      agent_id: session.userId,
      total_amount: data.total_amount,
      status: "en_cours",
      signed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("idx_deals_one_active_per_property") || error.message.includes("PROPERTY_UNAVAILABLE")) {
      return { error: "Anti-double-vente : ce bien possède déjà une vente active." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/deals");
  revalidatePath("/dashboard/biens");
  revalidatePath("/dashboard/plans");
  redirect(`/dashboard/deals/${deal.id}`);
}

export async function generateScheduleAction(input: {
  deal_id: string;
  down_payment: number;
  num_months: number;
  first_due_date: string;
}) {
  const session = await requireSession();
  const deal = await getDeal(input.deal_id);
  if (!deal) return { error: "Vente introuvable." };

  const lines = generatePaymentSchedule({
    totalAmount: Number(deal.total_amount),
    downPayment: input.down_payment,
    numMonths: input.num_months,
    firstDueDate: input.first_due_date,
  });

  const insforge = await createClient();

  await insforge.database.from("payment_schedules").delete().eq("deal_id", input.deal_id);

  const { error } = await insforge.database.from("payment_schedules").insert(
    lines.map((line) => ({
      deal_id: input.deal_id,
      organization_id: session.profile.organization_id,
      due_date: line.due_date,
      amount_due: line.amount_due,
      label: line.label,
    }))
  );

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${input.deal_id}`);
  return { success: true };
}

export async function updateScheduleLineAction(input: {
  schedule_id: string;
  deal_id: string;
  due_date: string;
  amount_due: number;
  label: string;
}) {
  await requireSession();
  const insforge = await createClient();

  const { error } = await insforge.database
    .from("payment_schedules")
    .update({
      due_date: input.due_date,
      amount_due: input.amount_due,
      label: input.label,
    })
    .eq("id", input.schedule_id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${input.deal_id}`);
  return { success: true };
}

export async function getDealFinancials(dealId: string): Promise<DealFinancials | null> {
  const deal = await getDeal(dealId);
  if (!deal) return null;

  const insforge = await createClient();
  const [{ data: schedules }, { data: payments }] = await Promise.all([
    insforge.database.from("payment_schedules").select("*").eq("deal_id", dealId).order("due_date"),
    insforge.database.from("payments").select("*").eq("deal_id", dealId).order("paid_at"),
  ]);

  return buildDealFinancials(
    deal,
    (schedules ?? []) as PaymentSchedule[],
    (payments ?? []) as Payment[]
  );
}

export async function markDealSoldeAction(dealId: string) {
  const financials = await getDealFinancials(dealId);
  if (!financials) return { error: "Vente introuvable." };
  if (financials.remaining > 0) {
    return { error: `Encaissement incomplet — reste ${financials.remaining} FCFA.` };
  }

  const insforge = await createClient();
  const { error } = await insforge.database
    .from("deals")
    .update({ status: "solde" })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/biens");
  revalidatePath("/dashboard/plans");
  return { success: true };
}

export async function cancelDealAction(dealId: string) {
  await requireSession();
  const insforge = await createClient();

  const { error } = await insforge.database
    .from("deals")
    .update({ status: "annule" })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/biens");
  revalidatePath("/dashboard/plans");
  redirect("/dashboard/deals");
}

export async function getDealByPropertyId(propertyId: string): Promise<{
  id: string;
  status: string;
  client?: { full_name: string } | { full_name: string }[] | null;
} | null> {
  const map = await getActiveDealsByPropertyIds([propertyId]);
  const deal = map.get(propertyId);
  if (!deal) return null;
  return {
    id: deal.id,
    status: deal.status,
    client: deal.client,
  };
}

export async function getActiveDealsByPropertyIds(
  propertyIds: string[]
): Promise<
  Map<
    string,
    {
      id: string;
      property_id: string;
      status: string;
      client?: { full_name: string } | { full_name: string }[] | null;
    }
  >
> {
  const uniqueIds = [...new Set(propertyIds)];
  const result = new Map<
    string,
    {
      id: string;
      property_id: string;
      status: string;
      client?: { full_name: string } | { full_name: string }[] | null;
    }
  >();

  if (uniqueIds.length === 0) return result;

  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deals")
    .select("id, property_id, status, client:clients(full_name)")
    .in("property_id", uniqueIds)
    .in("status", ["en_cours", "solde"]);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const deal = row as {
      id: string;
      property_id: string;
      status: string;
      client?: { full_name: string } | { full_name: string }[] | null;
    };
    result.set(deal.property_id, deal);
  }

  return result;
}
