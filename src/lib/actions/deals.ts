"use server";

import { requireSession } from "@/lib/auth";
import {
  buildDealFinancials,
  propertyAvailabilityMessage,
  type PropertyDealCheck,
} from "@/lib/deals";
import { generatePaymentSchedule } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*, property:properties(*), client:clients(*), agent:profiles(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DealWithRelations[];
}

export async function getDeal(id: string): Promise<DealWithRelations | null> {
  const supabase = createClient();
  const { data, error } = await supabase
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
  const supabase = createClient();

  const { data: property } = await supabase
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

  const { data: activeDeal } = await supabase
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
  const supabase = createClient();
  const { data, error } = await supabase
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
  const session = await requireSession();
  const check = await checkPropertyForDeal(input.property_id);

  if (check.blocked) {
    return { error: check.reason };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .insert({
      organization_id: session.profile.organization_id,
      property_id: input.property_id,
      client_id: input.client_id,
      agent_id: session.userId,
      total_amount: input.total_amount,
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
  redirect(`/dashboard/deals/${data.id}`);
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

  const supabase = createClient();

  await supabase.from("payment_schedules").delete().eq("deal_id", input.deal_id);

  const { error } = await supabase.from("payment_schedules").insert(
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
  const supabase = createClient();

  const { error } = await supabase
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

  const supabase = createClient();
  const [{ data: schedules }, { data: payments }] = await Promise.all([
    supabase.from("payment_schedules").select("*").eq("deal_id", dealId).order("due_date"),
    supabase.from("payments").select("*").eq("deal_id", dealId).order("paid_at"),
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

  const supabase = createClient();
  const { error } = await supabase
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
  const supabase = createClient();

  const { error } = await supabase
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
  const supabase = createClient();
  const { data } = await supabase
    .from("deals")
    .select("id, status, client:clients(full_name)")
    .eq("property_id", propertyId)
    .in("status", ["en_cours", "solde"])
    .maybeSingle();

  return data as {
    id: string;
    status: string;
    client?: { full_name: string } | { full_name: string }[] | null;
  } | null;
}
