import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/actions/dashboard";
import { getOverviewStats } from "@/lib/dashboard/overview";
import { formatDate, formatFCFA } from "@/lib/format";
import { formatFcfa, getPlanById } from "@/lib/pricing";
import { DashboardOverviewPanel } from "@/components/dashboard/dashboard-overview-panel";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PaymentScheduleList } from "@/components/dashboard/payment-schedule-list";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityList } from "@/components/activities/activity-list";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Handshake,
  Map as MapIcon,
  Users,
  Bell,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const { organization, profile } = session;
  const agentFilter = profile.role === "agent" ? profile.id : null;

  const {
    kpis,
    activities,
    propertyCounts,
    primaryMasterplan,
    overviewLots,
    lotHrefById,
    headlineCounts,
  } = await getDashboardPageData(agentFilter);

  const { libres, reserves, vendus } = getOverviewStats(overviewLots, propertyCounts);

  const trialDaysLeft =
    organization.subscription_status === "trial" && organization.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const planInfo = getPlanById(organization.plan);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            {organization.name} — vente cash ou échelonnée
          </p>
        </div>
        <QuickActions />
      </div>

      {organization.subscription_status === "trial" && trialDaysLeft !== null && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Essai {planInfo.name} — {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant
          {trialDaysLeft > 1 ? "s" : ""}
          {organization.trial_ends_at && <> (expire le {formatDate(organization.trial_ends_at)})</>}
          {" · "}
          Puis {formatFcfa(planInfo.priceMonthly)} FCFA/mois —{" "}
          <Link href="/dashboard/abonnement" className="font-medium underline">
            gérer l&apos;abonnement
          </Link>
        </div>
      )}

      {kpis.overdue_count > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">
              {kpis.overdue_count} échéance{kpis.overdue_count > 1 ? "s" : ""} en retard (
              {formatFCFA(kpis.overdue_amount)})
            </p>
            <Link href="/dashboard/encaissements" className="underline">
              Voir les encaissements
            </Link>
          </div>
        </div>
      )}

      <DashboardOverviewPanel
        organizationName={organization.name}
        programName={primaryMasterplan?.masterplan.name ?? null}
        trialDaysLeft={trialDaysLeft}
        libres={libres}
        reserves={reserves}
        vendus={vendus}
        lots={overviewLots}
        totalLots={primaryMasterplan?.masterplan.total_lots}
        collectedThisMonth={kpis.collected_this_month}
        getLotHref={(lot) => lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
        programHref={
          primaryMasterplan
            ? `/dashboard/plans/${primaryMasterplan.masterplan.id}`
            : "/dashboard/plans"
        }
        gridMaxVisible={96}
      />

      {!primaryMasterplan && (
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/plans/nouveau" className="text-primary hover:underline">
            Créez un plan de masse
          </Link>{" "}
          pour visualiser vos lots en couleur.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title="Encaissé ce mois"
          value={formatFCFA(kpis.collected_this_month)}
          subtitle={
            kpis.overdue_count > 0
              ? `${kpis.overdue_count} retard${kpis.overdue_count > 1 ? "s" : ""}`
              : "Cash & échelonné"
          }
          href="/dashboard/encaissements"
          icon={Calendar}
          valueClassName="text-emerald-700"
          alert={kpis.overdue_count > 0}
        />
        <KpiStatCard
          title="Biens"
          value={String(propertyCounts.total)}
          subtitle={`${propertyCounts.libres} libres · ${propertyCounts.reserves} rés. · ${propertyCounts.vendus} vendus`}
          href="/dashboard/biens"
          icon={Building2}
        />
        <KpiStatCard
          title="Clients"
          value={String(headlineCounts.clients)}
          subtitle="Acquéreurs enregistrés"
          href="/dashboard/clients"
          icon={Users}
        />
        <KpiStatCard
          title="Ventes actives"
          value={String(headlineCounts.activeDeals)}
          subtitle={`${formatFCFA(kpis.total_remaining)} restant`}
          href="/dashboard/deals"
          icon={Handshake}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-5 w-5" />
              À faire aujourd&apos;hui
            </h2>
            <Link href="/dashboard/relances" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <ActivityList activities={activities.slice(0, 5)} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapIcon className="h-5 w-5" />
              Prochains versements
            </h2>
            <Link href="/dashboard/encaissements" className="text-sm text-primary hover:underline">
              Encaissements
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <PaymentScheduleList
                items={kpis.upcoming_payments.slice(0, 5)}
                emptyMessage="Aucun versement cette semaine."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
