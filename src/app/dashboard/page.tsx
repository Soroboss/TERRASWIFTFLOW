import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDashboardKPIs } from "@/lib/actions/dashboard";
import { getMasterplanLots, getMasterplans } from "@/lib/actions/masterplans";
import { getProperties } from "@/lib/actions/properties";
import { getTodayActivities } from "@/lib/actions/activities";
import { getDealByPropertyId } from "@/lib/actions/deals";
import { countPropertiesByStatus } from "@/lib/property-status";
import { formatDate, formatFCFA } from "@/lib/format";
import { formatFcfa, getPlanById } from "@/lib/pricing";
import { DashboardOverviewPanel } from "@/components/dashboard/dashboard-overview-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityList } from "@/components/activities/activity-list";
import {
  Building2,
  Calendar,
  Map as MapIcon,
  Users,
  Handshake,
  Bell,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const { organization, profile } = session;
  const agentFilter = profile.role === "agent" ? profile.id : null;

  const [kpis, activities, properties, masterplans] = await Promise.all([
    getDashboardKPIs(agentFilter),
    getTodayActivities(agentFilter ?? undefined),
    getProperties(),
    getMasterplans(),
  ]);

  const primaryMasterplan = masterplans[0] ?? null;
  const masterplanLots = primaryMasterplan
    ? await getMasterplanLots(primaryMasterplan.id)
    : [];

  const overviewLots = masterplanLots.length > 0 ? masterplanLots : properties;
  const { libres, reserves, vendus } = countPropertiesByStatus(overviewLots);

  const lotHrefById = new Map<string, string>();
  for (const lot of overviewLots) {
    const deal = await getDealByPropertyId(lot.id);
    lotHrefById.set(
      lot.id,
      deal ? `/dashboard/deals/${deal.id}` : `/dashboard/biens/${lot.id}`
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vente cash ou échelonnée — {session.profile.full_name}
        </p>
      </div>

      {organization.subscription_status === "trial" && trialDaysLeft !== null && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Essai {planInfo.name} — {trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""} restant
          {trialDaysLeft > 1 ? "s" : ""}
          {organization.trial_ends_at && <> (expire le {formatDate(organization.trial_ends_at)})</>}
          {" · "}
          Puis {formatFcfa(planInfo.priceMonthly)} FCFA/mois
        </div>
      )}

      <DashboardOverviewPanel
        organizationName={organization.name}
        programName={primaryMasterplan?.name ?? null}
        trialDaysLeft={trialDaysLeft}
        libres={libres}
        reserves={reserves}
        vendus={vendus}
        lots={overviewLots}
        totalLots={primaryMasterplan?.total_lots}
        collectedThisMonth={kpis.collected_this_month}
        getLotHref={(lot) => lotHrefById.get(lot.id) ?? `/dashboard/biens/${lot.id}`}
        programHref={primaryMasterplan ? `/dashboard/plans/${primaryMasterplan.id}` : "/dashboard/plans"}
      />

      {!primaryMasterplan && (
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/plans/nouveau" className="text-primary hover:underline">
            Créez un plan de masse
          </Link>{" "}
          pour afficher vos lots comme sur la présentation commerciale.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/encaissements">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Encaissé ce mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">{formatFCFA(kpis.collected_this_month)}</p>
              {kpis.overdue_count > 0 && (
                <p className="text-xs text-red-600">{kpis.overdue_count} échéance{kpis.overdue_count > 1 ? "s" : ""} en retard</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/biens">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Biens</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{properties.length}</p>
              <p className="text-xs text-muted-foreground">
                {libres} libres · {reserves} réservés · {vendus} vendus
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/clients">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Gérer les acquéreurs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/deals">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventes</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Deals & échéanciers</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-5 w-5" />À faire aujourd&apos;hui
            </h2>
            <Link href="/dashboard/relances" className="text-sm text-primary hover:underline">Voir tout</Link>
          </div>
          <ActivityList activities={activities.slice(0, 5)} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapIcon className="h-5 w-5" />Prochains versements
            </h2>
            <Link href="/dashboard/encaissements" className="text-sm text-primary hover:underline">Encaissements</Link>
          </div>
          <Card>
            <CardContent className="space-y-2 p-4">
              {kpis.upcoming_payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun versement cette semaine.</p>
              ) : (
                kpis.upcoming_payments.slice(0, 5).map((s) => (
                  <Link key={s.schedule_id} href={`/dashboard/deals/${s.deal_id}`} className="block rounded-md border p-2 hover:bg-accent">
                    <p className="text-sm font-medium">{s.client_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.due_date)} · {formatFCFA(s.remaining)}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
