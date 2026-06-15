"use server";

import { requireSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/insforge/admin";
import { getPlanById } from "@/lib/pricing";
import { z } from "zod";

const paymentSchema = z.object({
  method: z.enum(["wave", "orange_money", "mtn", "card"]),
  phone: z.string().optional(),
  cardLast4: z.string().optional(),
  transactionRef: z.string().optional(),
});

export type SubscriptionPaymentInput = z.infer<typeof paymentSchema>;

export async function submitSubscriptionPaymentAction(input: SubscriptionPaymentInput) {
  const session = await requireSession();
  const parsed = paymentSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Informations de paiement invalides." };
  }

  const { method, phone, cardLast4, transactionRef } = parsed.data;

  if (method !== "card" && (!phone || phone.replace(/\D/g, "").length < 8)) {
    return { error: "Indiquez un numéro Mobile Money valide." };
  }

  if (method === "card" && !cardLast4) {
    return { error: "Indiquez les 4 derniers chiffres de la carte ou utilisez le paiement Mobile Money." };
  }

  const plan = getPlanById(session.organization.plan);
  const methodLabel =
    method === "wave"
      ? "Wave"
      : method === "orange_money"
        ? "Orange Money"
        : method === "mtn"
          ? "MTN MoMo"
          : "Carte bancaire";

  const noteLine = `[${new Date().toISOString()}] Demande paiement abonnement ${plan.name} — ${methodLabel}${
    phone ? ` — ${phone}` : ""
  }${cardLast4 ? ` — carte ****${cardLast4}` : ""}${transactionRef ? ` — ref ${transactionRef}` : ""}`;

  const admin = createServiceClient();
  const existingNotes = session.organization.notes ?? "";
  const nextNotes = existingNotes ? `${existingNotes}\n${noteLine}` : noteLine;

  const { error } = await admin.database
    .from("organizations")
    .update({
      subscription_status: "past_due",
      notes: nextNotes,
    })
    .eq("id", session.organization.id);

  if (error) {
    return { error: "Impossible d'enregistrer la demande. Réessayez ou contactez le support." };
  }

  return {
    success: true as const,
    message:
      "Votre demande de paiement a été enregistrée. Notre équipe validera sous 24 h ouvrées. Vous recevrez un e-mail de confirmation.",
  };
}
