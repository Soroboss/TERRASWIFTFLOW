import { amountToWordsFCFA } from "@/lib/amount-words";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/insforge/server";
import { ReceiptPDFDocument } from "@/lib/pdf/documents";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import type { PaymentMethod } from "@/types/database";
import {
  formatOrganizationDocumentFooter,
  parseCompanyProfile,
} from "@/types/organization-profile";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: payment } = await insforge.database
    .from("payments")
    .select(
      "*, deal:deals(client:clients(full_name), property:properties(title)), organization:organizations(name, company_profile)"
    )
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const deal = payment.deal as {
    client?: { full_name: string };
    property?: { title: string };
  } | null;
  const org = payment.organization as { name: string; company_profile?: unknown } | null;
  const orgName = org?.name ?? "TerraSwiftFlow";
  const companyProfile = parseCompanyProfile(org?.company_profile);

  const buffer = await renderToBuffer(
    ReceiptPDFDocument({
      organizationName: companyProfile.legal_name ?? orgName,
      organizationFooter: formatOrganizationDocumentFooter(orgName, companyProfile),
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
