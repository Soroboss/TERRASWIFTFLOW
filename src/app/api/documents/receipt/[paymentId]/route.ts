import { amountToWordsFCFA } from "@/lib/amount-words";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReceiptPDFDocument } from "@/lib/pdf/documents";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import type { PaymentMethod } from "@/types/database";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { paymentId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select(
      "*, deal:deals(client:clients(full_name), property:properties(title)), organization:organizations(name)"
    )
    .eq("id", params.paymentId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const deal = payment.deal as {
    client?: { full_name: string };
    property?: { title: string };
  } | null;
  const org = payment.organization as { name: string } | null;

  const buffer = await renderToBuffer(
    ReceiptPDFDocument({
      organizationName: org?.name ?? "TerraSwiftFlow",
      receiptNumber: payment.receipt_number as string,
      paidAt: formatDate(payment.paid_at as string),
      clientName: deal?.client?.full_name ?? "—",
      propertyTitle: deal?.property?.title ?? "—",
      amount: Number(payment.amount),
      amountWords: amountToWordsFCFA(Number(payment.amount)),
      method: PAYMENT_METHOD_LABELS[payment.method as PaymentMethod],
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recu-${payment.receipt_number}.pdf"`,
    },
  });
}
