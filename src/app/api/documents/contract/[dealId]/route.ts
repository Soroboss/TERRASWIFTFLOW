import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/insforge/server";
import { ContractPDFDocument } from "@/lib/pdf/documents";
import {
  formatOrganizationDocumentFooter,
  parseCompanyProfile,
} from "@/types/organization-profile";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const insforge = await createClient();
  const { data: userData } = await insforge.auth.getCurrentUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: deal } = await insforge.database
    .from("deals")
    .select(
      "*, client:clients(full_name, phone), property:properties(title, reference), organization:organizations(name, company_profile)"
    )
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const { data: schedules } = await insforge.database
    .from("payment_schedules")
    .select("*")
    .eq("deal_id", dealId)
    .order("due_date");

  const client = deal.client as { full_name: string; phone: string } | null;
  const property = deal.property as { title: string; reference: string } | null;
  const org = deal.organization as { name: string; company_profile?: unknown } | null;
  const orgName = org?.name ?? "TerraSwiftFlow";
  const companyProfile = parseCompanyProfile(org?.company_profile);
  const displayName = companyProfile.legal_name ?? orgName;

  const buffer = await renderToBuffer(
    ContractPDFDocument({
      organizationName: displayName,
      organizationFooter: formatOrganizationDocumentFooter(orgName, companyProfile),
      clientName: client?.full_name ?? "—",
      clientPhone: client?.phone ?? "—",
      propertyTitle: property?.title ?? "—",
      propertyReference: property?.reference ?? "—",
      totalAmount: Number(deal.total_amount),
      signedAt: deal.signed_at ? formatDate(deal.signed_at as string) : formatDate(deal.created_at as string),
      schedules: (schedules ?? []).map((s) => ({
        label: s.label as string,
        due_date: formatDate(s.due_date as string),
        amount_due: Number(s.amount_due),
      })),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-${dealId.slice(0, 8)}.pdf"`,
    },
  });
}
