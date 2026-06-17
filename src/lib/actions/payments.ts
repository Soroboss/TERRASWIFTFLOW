"use server";

import { requireSession } from "@/lib/auth";
import { assertDealAccess } from "@/lib/auth/resource-access";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { recordPaymentSchema } from "@/lib/validations/schemas";
import type { PaymentMethod } from "@/types/database";
import type { Payment } from "@/types/entities";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import { startOfMonth, format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function recordPaymentAction(input: {
  deal_id: string;
  schedule_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
}) {
  const parsed = parseInput(recordPaymentSchema, input);
  if ("error" in parsed) return { error: parsed.error };

  const session = await requireSession();
  const data = parsed.data;
  const access = await assertDealAccess(session, data.deal_id);
  if (access.error) return { error: access.error };

  const insforge = await createClient();

  const { data: receiptNumber, error: rpcError } = await insforge.database.rpc(
    "next_receipt_number",
    { org_id: session.profile.organization_id }
  );

  if (rpcError || !receiptNumber) {
    return { error: "Impossible de générer le numéro de reçu." };
  }

  const { data: payment, error } = await insforge.database
    .from("payments")
    .insert({
      deal_id: data.deal_id,
      schedule_id: data.schedule_id,
      organization_id: session.profile.organization_id,
      amount: data.amount,
      method: data.method,
      paid_at: data.paid_at,
      receipt_number: receiptNumber as string,
      recorded_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${data.deal_id}`);
  revalidatePath("/dashboard/encaissements");
  revalidatePath("/dashboard");

  return { success: true, paymentId: payment.id as string, receiptNumber: receiptNumber as string };
}

export async function getPaymentsForDeal(dealId: string): Promise<Payment[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("payments")
    .select("*")
    .eq("deal_id", dealId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Payment[];
}

export async function getPayment(id: string): Promise<Payment | null> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Payment;
}

export interface RecentPaymentRow {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  receipt_number: string;
  deal_id: string;
  client_name: string;
  property_title: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  label: string;
  amount: number;
}

export async function getRecentPayments(
  agentId?: string | null,
  limit = 12
): Promise<RecentPaymentRow[]> {
  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("payments")
    .select(
      "id, amount, method, paid_at, receipt_number, deal_id, deal:deals(agent_id, client:clients(full_name), property:properties(title))"
    )
    .order("paid_at", { ascending: false })
    .limit(limit * 3);

  if (error) throw new Error(error.message);

  const rows: RecentPaymentRow[] = [];

  for (const row of data ?? []) {
    const deal = row.deal as
      | {
          agent_id?: string;
          client?: { full_name: string } | null;
          property?: { title: string } | null;
        }
      | null
      | undefined;

    if (agentId && deal?.agent_id !== agentId) continue;

    rows.push({
      id: row.id as string,
      amount: Number(row.amount),
      method: row.method as PaymentMethod,
      paid_at: row.paid_at as string,
      receipt_number: row.receipt_number as string,
      deal_id: row.deal_id as string,
      client_name: deal?.client?.full_name ?? "—",
      property_title: deal?.property?.title ?? "—",
    });

    if (rows.length >= limit) break;
  }

  return rows;
}

export async function getMonthlyPaymentBreakdown(
  agentId?: string | null
): Promise<PaymentMethodBreakdown[]> {
  const insforge = await createClient();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data, error } = await insforge.database
    .from("payments")
    .select("amount, method, deal:deals(agent_id)")
    .gte("paid_at", monthStart);

  if (error) throw new Error(error.message);

  const totals = new Map<PaymentMethod, number>();

  for (const row of data ?? []) {
    const deal = row.deal as { agent_id?: string } | null | undefined;
    if (agentId && deal?.agent_id !== agentId) continue;

    const method = row.method as PaymentMethod;
    totals.set(method, (totals.get(method) ?? 0) + Number(row.amount));
  }

  return [...totals.entries()]
    .map(([method, amount]) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}
