import { getRecentAuditLog } from "@/lib/actions/platform/audit";
import {
  getGrowthSeries,
  getPlatformKPIs,
  getPlanDistribution,
  getTenantBillingRecords,
} from "@/lib/actions/platform/stats";
import { KpiCard } from "@/components/platform/kpi-card";
import { GrowthChart } from "@/components/platform/growth-chart";
import { PlatformAutonomyNotice } from "@/components/platform/platform-autonomy-notice";
import { TenantBillingTable } from "@/components/platform/tenant-billing-table";
import { formatFCFA } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default async function PlatformOverviewPage() {
  const [kpis, growth, planDist, recentTenants, audit] = await Promise.all([
    getPlatformKPIs(),
    getGrowthSeries(12),
    getPlanDistribution(),
    getTenantBillingRecords(),
    getRecentAuditLog(8),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Vue d&apos;ensemble SaaS</h1>
        <p className="text-muted-foreground">
          Inscriptions, abonnements et équipe interne TerraSwiftFlow
        </p>
      </div>

      <PlatformAutonomyNotice variant="general" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Organisations inscrites"
          value={String(kpis.totalTenants)}
          hint={`+${kpis.newTenants30d} sur 30 jours`}
          icon={Building2}
        />
        <KpiCard
          title="Abonnements actifs"
          value={String(kpis.activeSubscriptions)}
          hint={`${kpis.trialTenants} en essai`}
          icon={CreditCard}
        />
        <KpiCard
          title="MRR estimé"
          value={formatFCFA(kpis.estimatedMrr)}
          hint="Abonnements actifs uniquement"
          icon={TrendingUp}
        />
        <KpiCard
          title="Conversion essai"
          value={`${kpis.trialConversionRate} %`}
          hint={`${kpis.pastDueTenants} impayé(s) · ${kpis.suspendedTenants} suspendu(s)`}
          icon={UserPlus}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GrowthChart data={growth} title="Courbe d'inscriptions & activations (12 semaines)" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planDist.map(({ plan, count }) => {
              const total = Math.max(1, kpis.totalTenants);
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{plan}</span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dernières inscriptions</h2>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <TenantBillingTable tenants={recentTenants.slice(0, 8)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Journal d&apos;activité plateforme</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune action enregistrée.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0">
                  <span>
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-muted-foreground"> · {entry.target_type}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
