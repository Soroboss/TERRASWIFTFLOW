import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentFilter } from "@/components/dashboard/agent-filter";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { PaymentScheduleList } from "@/components/dashboard/payment-schedule-list";
import { PaymentMethodBreakdownBar } from "@/components/encaissements/payment-method-breakdown";
import { RecentPaymentsList } from "@/components/encaissements/recent-payments-list";
import { getDashboardKPIs } from "@/lib/actions/dashboard";
import { getMonthlyPaymentBreakdown, getRecentPayments } from "@/lib/actions/payments";
import { getOrganizationAgents } from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { canViewAllData, canViewCompanyRevenue, getAgentScopeId } from "@/lib/auth/permissions";
import { formatFCFA } from "@/lib/format";
import { AlertTriangle, Calendar, Clock, Wallet } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ agent?: string }>;
}

export default async function EncaissementsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const { agent } = await searchParams;
  const agentId = getAgentScopeId(session) ?? agent ?? null;
  const showCompanyRevenue = canViewCompanyRevenue(session.profile.role);

  const [kpis, agents, recentPayments, methodBreakdown] = await Promise.all([
    getDashboardKPIs(agentId),
    canViewAllData(session.profile.role) ? getOrganizationAgents() : Promise.resolve([]),
    getRecentPayments(agentId),
    getMonthlyPaymentBreakdown(agentId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Encaissements</h1>
          <p className="text-muted-foreground">
            {showCompanyRevenue
              ? "Cash, Wave, Orange Money, MTN MoMo et échéanciers"
              : "Vos encaissements et échéances clients"}
          </p>
        </div>
        {canViewAllData(session.profile.role) && (
          <AgentFilter
            agents={agents}
            currentAgentId={agentId ?? undefined}
            basePath="/dashboard/encaissements"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title={showCompanyRevenue ? "Encaissé ce mois" : "Mes encaissements ce mois"}
          value={formatFCFA(kpis.collected_this_month)}
          icon={Wallet}
          valueClassName="text-emerald-700"
        />
        <KpiStatCard
          title={showCompanyRevenue ? "Reste à encaisser" : "Mon reste à encaisser"}
          value={formatFCFA(kpis.total_remaining)}
          subtitle="Ventes en cours"
          icon={Calendar}
        />
        <KpiStatCard
          title="En retard"
          value={String(kpis.overdue_count)}
          subtitle={formatFCFA(kpis.overdue_amount)}
          icon={AlertTriangle}
          valueClassName="text-red-600"
          alert={kpis.overdue_count > 0}
        />
        <KpiStatCard
          title="7 prochains jours"
          value={String(kpis.upcoming_payments.length)}
          subtitle="Échéances à venir"
          icon={Clock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition du mois par mode de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodBreakdownBar
            items={methodBreakdown}
            total={kpis.collected_this_month}
          />
        </CardContent>
      </Card>

      {kpis.overdue_schedules.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Échéances en retard</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentScheduleList
              items={kpis.overdue_schedules}
              variant="overdue"
              emptyMessage=""
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prochains versements (7 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentScheduleList
              items={kpis.upcoming_payments}
              emptyMessage="Aucun versement attendu cette semaine."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Derniers encaissements</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPaymentsList payments={recentPayments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
