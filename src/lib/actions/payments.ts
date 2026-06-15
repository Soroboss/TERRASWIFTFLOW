"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
  const session = await requireSession();
  const supabase = createClient();

  const { data: receiptNumber, error: rpcError } = await supabase.rpc(
    "next_receipt_number",
    { org_id: session.profile.organization_id }
  );

  if (rpcError || !receiptNumber) {
    return { error: "Impossible de générer le numéro de reçu." };
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      deal_id: input.deal_id,
      schedule_id: input.schedule_id,
      organization_id: session.profile.organization_id,
      amount: input.amount,
      method: input.method,
      paid_at: input.paid_at,
      receipt_number: receiptNumber as string,
      recorded_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/deals/${input.deal_id}`);
  revalidatePath("/dashboard/encaissements");
  revalidatePath("/dashboard");

  return { success: true, paymentId: data.id as string, receiptNumber: receiptNumber as string };
}

export async function getPaymentsForDeal(dealId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("deal_id", dealId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Payment[];
}

export async function getPayment(id: string): Promise<Payment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Payment;
}
