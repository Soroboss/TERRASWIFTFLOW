"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/insforge/server";
import { parseInput } from "@/lib/validations/parse";
import { recordPaymentSchema } from "@/lib/validations/schemas";
import type { PaymentMethod } from "@/types/database";
import type { Payment } from "@/types/entities";
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
  const insforge = await createClient();
  const data = parsed.data;

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
