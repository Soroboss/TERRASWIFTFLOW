import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealScheduleTable } from "@/components/deals/deal-schedule-table";
import { ScheduleGenerator } from "@/components/deals/schedule-generator";
import { DealActions } from "@/components/deals/deal-actions";
import { getDeal, getDealFinancials } from "@/lib/actions/deals";
import { requireSession } from "@/lib/auth";
import { canCancelDeals } from "@/lib/auth/permissions";
import { formatFCFA, formatDate, formatPhoneCI } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const canManageDeal = canCancelDeals(session.profile.role);
  const [deal, financials] = await Promise.all([
    getDeal(id),
    getDealFinancials(id),
  ]);

  if (!deal || !financials) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant={deal.status === "solde" ? "libre" : deal.status === "annule" ? "vendu" : "reserve"}>
            {deal.status === "en_cours" ? "En cours" : deal.status === "solde" ? "Soldé" : "Annulé"}
          </Badge>
          <h1 className="mt-2 text-2xl font-bold">{deal.property?.title}</h1>
          <p className="text-muted-foreground">
            {deal.client?.full_name} · {formatPhoneCI(deal.client?.phone ?? "")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/api/documents/contract/${deal.id}`} target="_blank">
              <FileText className="h-4 w-4" />Contrat PDF
            </Link>
          </Button>
          {canManageDeal && (
            <DealActions dealId={deal.id} status={deal.status} remaining={financials.remaining} />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Montant total</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatFCFA(financials.total_amount)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Encaissé</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-emerald-700">{formatFCFA(financials.total_paid)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Reste dû</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-amber-700">{formatFCFA(financials.remaining)}</p></CardContent>
        </Card>
      </div>

      {financials.next_schedule && (
        <p className="text-sm text-muted-foreground">
          Prochaine échéance : {financials.next_schedule.label} le {formatDate(financials.next_schedule.due_date)}
        </p>
      )}

      {deal.status === "en_cours" && financials.schedules.length === 0 && (
        <ScheduleGenerator dealId={deal.id} totalAmount={financials.total_amount} />
      )}

      <DealScheduleTable dealId={deal.id} schedules={financials.schedules} />
    </div>
  );
}
