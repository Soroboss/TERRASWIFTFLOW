import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealScheduleTable } from "@/components/deals/deal-schedule-table";
import { ScheduleGenerator } from "@/components/deals/schedule-generator";
import { DealActions } from "@/components/deals/deal-actions";
import { ContractDownloadButtons } from "@/components/deals/contract-download-buttons";
import { AcdWorkflowTracker } from "@/components/deals/acd-workflow-tracker";
import { getDeal, getDealFinancials, getDealRefund } from "@/lib/actions/deals";
import { requireSession } from "@/lib/auth";
import { canCancelDealsWithRefund, canManageDeals } from "@/lib/auth/permissions";
import {
  CONTRACT_STAGE_LABELS,
  CONTRACT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "@/lib/sales-contract";
import { formatFCFA, formatDate, formatPhoneCI } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const canCancelDeal = canCancelDealsWithRefund(session.profile.role);
  const canManageDeal = canManageDeals(session.profile.role);
  const [deal, financials, refund] = await Promise.all([
    getDeal(id),
    getDealFinancials(id),
    getDealRefund(id),
  ]);

  if (!deal || !financials) notFound();

  const paymentMode = deal.payment_mode ?? "echelonne";
  const contractType = deal.contract_type ?? "acd";
  const contractStage = deal.contract_stage ?? "provisoire";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={deal.status === "solde" ? "libre" : deal.status === "annule" ? "vendu" : "reserve"}>
              {deal.status === "en_cours" ? "En cours" : deal.status === "solde" ? "Soldé" : "Annulé"}
            </Badge>
            <Badge variant="outline">{PAYMENT_MODE_LABELS[paymentMode]}</Badge>
            <Badge variant="outline">{CONTRACT_TYPE_LABELS[contractType]}</Badge>
            <Badge variant={contractStage === "definitif" ? "libre" : "reserve"}>
              {CONTRACT_STAGE_LABELS[contractStage]}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{deal.property?.title}</h1>
          <p className="text-muted-foreground">
            {deal.client?.full_name} · {formatPhoneCI(deal.client?.phone ?? "")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ContractDownloadButtons deal={deal} />
          {canCancelDeal && (
            <DealActions
              dealId={deal.id}
              status={deal.status}
              remaining={financials.remaining}
              totalPaid={financials.total_paid}
            />
          )}
        </div>
      </div>

      <AcdWorkflowTracker
        dealId={deal.id}
        contractType={contractType}
        acdStatus={deal.acd_status ?? "non_demarre"}
        acdNotes={deal.acd_notes ?? null}
        acdUpdatedAt={deal.acd_updated_at ?? null}
        canEdit={canManageDeal && deal.status === "en_cours"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatFCFA(financials.total_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Acompte convenu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-700">
              {formatFCFA(deal.deposit_amount ?? (paymentMode === "cash" ? financials.total_amount : 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reliquat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-700">
              {formatFCFA(deal.balance_amount ?? financials.remaining)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-700">{formatFCFA(financials.total_paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reste dû</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-700">{formatFCFA(financials.remaining)}</p>
          </CardContent>
        </Card>
      </div>

      {deal.status === "annule" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">Vente annulée</p>
          {deal.cancelled_at && (
            <p className="mt-1">Le {formatDate(deal.cancelled_at)}</p>
          )}
          {refund && (
            <p className="mt-1">
              Remboursement : {formatFCFA(refund.amount)} via{" "}
              {PAYMENT_METHOD_LABELS[refund.method]}
              {refund.reason ? ` — ${refund.reason}` : ""}
            </p>
          )}
          {!refund && financials.total_paid === 0 && (
            <p className="mt-1 text-muted-foreground">Aucun paiement ni remboursement enregistré.</p>
          )}
        </div>
      )}

      {contractStage === "provisoire" && financials.remaining > 0 && deal.status === "en_cours" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {paymentMode === "cash"
            ? "Contrat définitif disponible après encaissement du paiement cash intégral."
            : "Contrat provisoire actif. Le contrat définitif sera débloqué après paiement du reliquat et solde total."}
        </p>
      )}

      {deal.definitive_contract_at && (
        <p className="text-sm text-muted-foreground">
          Contrat définitif éligible depuis le {formatDate(deal.definitive_contract_at)}
        </p>
      )}

      {financials.next_schedule && (
        <p className="text-sm text-muted-foreground">
          Prochaine échéance : {financials.next_schedule.label} le{" "}
          {formatDate(financials.next_schedule.due_date)}
        </p>
      )}

      {deal.status === "en_cours" && financials.schedules.length === 0 && (
        <ScheduleGenerator
          dealId={deal.id}
          totalAmount={financials.total_amount}
          defaultDeposit={deal.deposit_amount ?? undefined}
        />
      )}

      <DealScheduleTable
        dealId={deal.id}
        schedules={financials.schedules}
        readOnly={deal.status !== "en_cours"}
      />
    </div>
  );
}
