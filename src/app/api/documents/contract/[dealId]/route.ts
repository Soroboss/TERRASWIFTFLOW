import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/insforge/server";
import { SalesContractPDFDocument } from "@/lib/pdf/contract-pdf";
import { canDownloadContractStage } from "@/lib/sales-contract";
import {
  formatOrganizationDocumentFooter,
  parseCompanyProfile,
} from "@/types/organization-profile";
import type { ContractStage, ContractType, PaymentMode } from "@/types/database";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const { searchParams } = new URL(request.url);
  const stage = (searchParams.get("stage") ?? "definitif") as ContractStage;

  if (stage !== "provisoire" && stage !== "definitif") {
    return NextResponse.json({ error: "Stade de contrat invalide." }, { status: 400 });
  }

  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: deal } = await insforge.database
    .from("deals")
    .select(
      "*, client:clients(full_name, phone), property:properties(title, reference, type, lot_number), organization:organizations(name, company_profile)"
    )
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const dealRow = deal as {
    payment_mode: PaymentMode;
    contract_type: ContractType;
    contract_stage: ContractStage;
    total_amount: number;
    deposit_amount: number | null;
    balance_amount: number | null;
    signed_at: string | null;
    created_at: string;
    client: { full_name: string; phone: string } | null;
    property: { title: string; reference: string; type: string; lot_number: string | null } | null;
    organization: { name: string; company_profile?: unknown } | null;
  };

  if (!canDownloadContractStage(dealRow, stage)) {
    return NextResponse.json(
      {
        error:
          stage === "definitif"
            ? "Le contrat définitif est disponible après paiement intégral (cash ou reliquat)."
            : "Contrat provisoire non disponible pour cette vente.",
      },
      { status: 403 }
    );
  }

  const { data: schedules } = await insforge.database
    .from("payment_schedules")
    .select("*")
    .eq("deal_id", dealId)
    .order("due_date");

  const client = dealRow.client;
  const property = dealRow.property;
  const org = dealRow.organization;
  const orgName = org?.name ?? "TerraSwiftFlow";
  const companyProfile = parseCompanyProfile(org?.company_profile);
  const displayName = companyProfile.legal_name ?? orgName;

  const buffer = await renderToBuffer(
    SalesContractPDFDocument({
      organizationName: displayName,
      organizationFooter: formatOrganizationDocumentFooter(orgName, companyProfile),
      clientName: client?.full_name ?? "—",
      clientPhone: client?.phone ?? "—",
      propertyTitle: property?.title ?? "—",
      propertyReference: property?.reference ?? "—",
      propertyType: property?.type === "terrain" ? "Terrain" : property?.type === "maison" ? "Maison" : undefined,
      lotNumber: property?.lot_number,
      totalAmount: Number(dealRow.total_amount),
      depositAmount: dealRow.deposit_amount ? Number(dealRow.deposit_amount) : null,
      balanceAmount: dealRow.balance_amount ? Number(dealRow.balance_amount) : null,
      paymentMode: dealRow.payment_mode ?? "echelonne",
      signedAt: dealRow.signed_at
        ? formatDate(dealRow.signed_at)
        : formatDate(dealRow.created_at),
      contractType: dealRow.contract_type ?? "acd",
      contractStage: stage,
      schedules: (schedules ?? []).map((s) => ({
        label: s.label as string,
        due_date: formatDate(s.due_date as string),
        amount_due: Number(s.amount_due),
        line_type: s.line_type as string | null,
      })),
    })
  );

  const stageSlug = stage === "definitif" ? "definitif" : "provisoire";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-${stageSlug}-${dealId.slice(0, 8)}.pdf"`,
    },
  });
}
