"use server";

import { requireSession } from "@/lib/auth";
import {
  canCancelDeals,
  canManageDeals,
  getAgentScopeId,
} from "@/lib/auth/permissions";
import { assertDealAccess } from "@/lib/auth/resource-access";
import { assertClientAccess } from "@/lib/auth/resource-access";
import {
  buildDealFinancials,
  propertyAvailabilityMessage,
  type PropertyDealCheck,
} from "@/lib/deals";
import { generatePaymentSchedule } from "@/lib/schedule";
import { computeBalanceFromLines } from "@/lib/sales-contract";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { cancelDealSchema, createDealSchema } from "@/lib/validations/schemas";
import type { Client, Deal, PaymentMode, PaymentMethod, Profile, Property, AcdStatus } from "@/types/database";
import type {
  DealFinancials,
  DealRefund,
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

export async function getDealStatusCounts(agentId?: string | null): Promise<DealStatusCounts> {
  const insforge = await createClient();

  const base = () => {
    let q = insforge.database.from("deals").select("id", { count: "exact", head: true });
    if (agentId) q = q.eq("agent_id", agentId);
    return q;
  };

  const [total, enCours, solde, annule] = await Promise.all([
    base(),
    base().eq("status", "en_cours"),
    base().eq("status", "solde"),
    base().eq("status", "annule"),
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
  const session = await requireSession();
  const scopeId = getAgentScopeId(session);
  const insforge = await createClient();
  let query = insforge.database
    .from("deals")
    .select(
      "*, property:properties(title, reference), client:clients(full_name, phone), agent:profiles!deals_agent_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  const agentFilter = scopeId ?? filters?.agent;
  if (agentFilter) {
    query = query.eq("agent_id", agentFilter);
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
  const session = await requireSession();
  const access = await assertClientAccess(session, clientId);
  if (access.error) return [];

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
  const session = await requireSession();
  const access = await assertDealAccess(session, id);
  if (access.error) return null;

  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deals")
    .select(
      "*, property:properties(*), client:clients(*), agent:profiles!deals_agent_id_fkey(*)"
    )
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
      deal: { id: "", organization_id: "", property_id: propertyId, client_id: "", agent_id: "", total_amount: 0, status: "en_cours", payment_mode: "echelonne", contract_type: "acd", deposit_amount: null, balance_amount: null, contract_stage: "provisoire", definitive_contract_at: null, num_months: null, signed_at: null, cancelled_at: null, cancelled_by: null, created_at: "" },
    };
  }

  const { data: activeDeal } = await insforge.database
    .from("deals")
    .select("*, client:clients(full_name), agent:profiles!deals_agent_id_fkey(full_name)")
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

export async function promoteContractStageIfFullyPaid(dealId: string): Promise<void> {
  const financials = await getDealFinancials(dealId);
  if (!financials || financials.remaining > 0) return;

  const insforge = await createClient();
  await insforge.database
    .from("deals")
    .update({
      contract_stage: "definitif",
      definitive_contract_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("contract_stage", "provisoire");
}

async function insertDealScheduleLines(
  dealId: string,
  organizationId: string,
  lines: ReturnType<typeof generatePaymentSchedule>
) {
  const insforge = await createClient();
  await insforge.database.from("payment_schedules").delete().eq("deal_id", dealId);

  if (lines.length === 0) return;

  const { error } = await insforge.database.from("payment_schedules").insert(
    lines.map((line) => ({
      deal_id: dealId,
      organization_id: organizationId,
      due_date: line.due_date,
      amount_due: line.amount_due,
      label: line.label,
      line_type: line.line_type,
    }))
  );

  if (error) throw new Error(error.message);
}

export async function createDealAction(input: {
  property_id: string;
  client_id: string;
  total_amount: number;
  payment_mode: PaymentMode;
  contract_type: "acd" | "lettre_villageoise" | "approbation_travaux";
  deposit_amount?: number;
  num_months?: number;
  first_due_date?: string;
}) {
  const parsed = parseInput(createDealSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  if (!canManageDeals(session.profile.role)) {
    return { error: "Droits insuffisants pour créer une vente." };
  }

  const data = parsed.data;
  const check = await checkPropertyForDeal(data.property_id);

  if (check.blocked) {
    return { error: check.reason };
  }

  const insforge = await createClient();
  const firstDueDate = data.first_due_date ?? new Date().toISOString().slice(0, 10);
  const numMonths = data.num_months ?? 12;

  const scheduleLines =
    data.payment_mode === "cash"
      ? generatePaymentSchedule({
          totalAmount: data.total_amount,
          downPayment: data.total_amount,
          numMonths: 0,
          firstDueDate,
          paymentMode: "cash",
        })
      : generatePaymentSchedule({
          totalAmount: data.total_amount,
          downPayment: data.deposit_amount ?? 0,
          numMonths,
          firstDueDate,
          paymentMode: "echelonne",
        });

  const depositAmount =
    data.payment_mode === "cash" ? data.total_amount : (data.deposit_amount ?? 0);
  const balanceAmount = computeBalanceFromLines(data.total_amount, depositAmount, scheduleLines);

  const { data: deal, error } = await insforge.database
    .from("deals")
    .insert({
      organization_id: session.profile.organization_id,
      property_id: data.property_id,
      client_id: data.client_id,
      agent_id: session.userId,
      total_amount: data.total_amount,
      payment_mode: data.payment_mode,
      contract_type: data.contract_type,
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
      contract_stage: "provisoire",
      num_months: data.payment_mode === "echelonne" ? numMonths : null,
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

  try {
    await insertDealScheduleLines(
      deal.id as string,
      session.profile.organization_id,
      scheduleLines
    );
  } catch (scheduleError) {
    await insforge.database.from("deals").delete().eq("id", deal.id);
    return {
      error:
        scheduleError instanceof Error
          ? scheduleError.message
          : "Erreur lors de la création de l'échéancier.",
    };
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
    paymentMode: deal.payment_mode ?? "echelonne",
  });

  const insforge = await createClient();

  try {
    await insertDealScheduleLines(input.deal_id, session.profile.organization_id, lines);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur échéancier." };
  }

  const balanceAmount = computeBalanceFromLines(
    Number(deal.total_amount),
    input.down_payment,
    lines
  );

  const { error: dealUpdateError } = await insforge.database
    .from("deals")
    .update({
      deposit_amount: input.down_payment,
      balance_amount: balanceAmount,
      num_months: input.num_months,
    })
    .eq("id", input.deal_id);

  if (dealUpdateError) return { error: dealUpdateError.message };

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
  const session = await requireSession();
  if (!canCancelDeals(session.profile.role)) {
    return { error: "Seuls le propriétaire et les managers peuvent clôturer une vente." };
  }

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

  await promoteContractStageIfFullyPaid(dealId);

  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/biens");
  revalidatePath("/dashboard/plans");
  return { success: true };
}

export async function cancelDealAction(input: {
  deal_id: string;
  refund_amount?: number;
  refund_method?: PaymentMethod;
  reason?: string;
}) {
  const parsed = parseInput(cancelDealSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  if (!canCancelDeals(session.profile.role)) {
    return {
      error:
        "Seuls le propriétaire (DG) et les managers peuvent annuler une vente. Les agents commerciaux n'ont pas cette autorisation.",
    };
  }

  const dealId = parsed.data.deal_id;
  const access = await assertDealAccess(session, dealId);
  if (access.error) return { error: access.error };

  const deal = await getDeal(dealId);
  if (!deal) return { error: "Vente introuvable." };
  if (deal.status !== "en_cours") {
    return { error: "Seules les ventes en cours peuvent être annulées." };
  }

  const financials = await getDealFinancials(dealId);
  if (!financials) return { error: "Vente introuvable." };

  const totalPaid = financials.total_paid;
  const refundAmount = parsed.data.refund_amount ?? 0;

  if (totalPaid > 0) {
    if (refundAmount <= 0 || !parsed.data.refund_method) {
      return {
        error: `Cette vente a reçu ${totalPaid} FCFA : un remboursement intégral est obligatoire pour annuler.`,
      };
    }
    if (refundAmount < totalPaid) {
      return {
        error: `Le remboursement doit couvrir la totalité des encaissements (${totalPaid} FCFA).`,
      };
    }
  } else if (refundAmount > 0) {
    return { error: "Aucun paiement enregistré — remboursement non requis." };
  }

  const insforge = await createClient();
  const now = new Date().toISOString();

  if (totalPaid > 0 && parsed.data.refund_method) {
    const { error: refundError } = await insforge.database.from("deal_refunds").insert({
      deal_id: dealId,
      organization_id: session.profile.organization_id,
      amount: refundAmount,
      method: parsed.data.refund_method,
      refunded_at: now,
      recorded_by: session.userId,
      reason: parsed.data.reason?.trim() || null,
    });

    if (refundError) return { error: refundError.message };
  }

  const { error } = await insforge.database
    .from("deals")
    .update({
      status: "annule",
      cancelled_at: now,
      cancelled_by: session.userId,
      contract_stage: "provisoire",
    })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/deals");
  revalidatePath("/dashboard/biens");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/encaissements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getDealRefund(dealId: string): Promise<DealRefund | null> {
  const session = await requireSession();
  const access = await assertDealAccess(session, dealId);
  if (access.error) return null;

  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deal_refunds")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...data,
    amount: Number(data.amount),
  } as DealRefund;
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
      agent_id?: string | null;
      client?: { full_name: string } | { full_name: string }[] | null;
      agent?: { full_name: string } | { full_name: string }[] | null;
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
      agent_id?: string | null;
      client?: { full_name: string } | { full_name: string }[] | null;
      agent?: { full_name: string } | { full_name: string }[] | null;
    }
  >();

  if (uniqueIds.length === 0) return result;

  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("deals")
    .select(
      "id, property_id, status, agent_id, client:clients(full_name), agent:profiles!deals_agent_id_fkey(full_name)"
    )
    .in("property_id", uniqueIds)
    .in("status", ["en_cours", "solde"]);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const deal = row as {
      id: string;
      property_id: string;
      status: string;
      agent_id?: string | null;
      client?: { full_name: string } | { full_name: string }[] | null;
      agent?: { full_name: string } | { full_name: string }[] | null;
    };
    result.set(deal.property_id, deal);
  }

  return result;
}

export type DealPipelineStage = "reservation" | "paiements" | "solde" | "annule";

export interface DealPipelineItem extends DealWithRelations {
  total_paid: number;
  payment_percent: number;
  pipeline_stage: DealPipelineStage;
}

function resolvePipelineStage(
  status: Deal["status"],
  totalAmount: number,
  totalPaid: number
): DealPipelineStage {
  if (status === "annule") return "annule";
  if (status === "solde") return "solde";
  if (totalPaid <= 0) return "reservation";
  return "paiements";
}

export async function getDealsPipeline(filters?: DealListFilters): Promise<DealPipelineItem[]> {
  const deals = await getDealsList(filters);
  if (deals.length === 0) return [];

  const dealIds = deals.map((d) => d.id);
  const insforge = await createClient();
  const { data: paymentRows, error } = await insforge.database
    .from("payments")
    .select("deal_id, amount")
    .in("deal_id", dealIds);

  if (error) throw new Error(error.message);

  const paidByDeal = new Map<string, number>();
  for (const row of paymentRows ?? []) {
    const id = row.deal_id as string;
    paidByDeal.set(id, (paidByDeal.get(id) ?? 0) + Number(row.amount));
  }

  return deals.map((deal) => {
    const totalAmount = Number(deal.total_amount);
    const total_paid = paidByDeal.get(deal.id) ?? 0;
    const payment_percent =
      totalAmount > 0 ? Math.min(100, Math.round((total_paid / totalAmount) * 100)) : 0;

    return {
      ...deal,
      total_paid,
      payment_percent,
      pipeline_stage: resolvePipelineStage(deal.status, totalAmount, total_paid),
    };
  });
}

export async function updateAcdStatusAction(input: {
  deal_id: string;
  acd_status: AcdStatus;
  acd_notes?: string | null;
}) {
  const session = await requireSession();
  const access = await assertDealAccess(session, input.deal_id);
  if (access.error) return { error: access.error };

  const insforge = await createClient();
  const { error } = await insforge.database
    .from("deals")
    .update({
      acd_status: input.acd_status,
      acd_notes: input.acd_notes?.trim() || null,
      acd_updated_at: new Date().toISOString(),
    })
    .eq("id", input.deal_id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${input.deal_id}`);
  return { success: true };
}
