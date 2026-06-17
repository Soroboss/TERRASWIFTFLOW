import Link from "next/link";
import { Plus, Handshake, AlertTriangle, Calendar, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealStatusSummary } from "@/components/deals/deal-status-summary";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { PaymentScheduleList } from "@/components/dashboard/payment-schedule-list";
import { getDashboardKPIs } from "@/lib/actions/dashboard";
import {
  getDealsList,
  getDealStatusCounts,
  type DealListFilters,
} from "@/lib/actions/deals";
import { getOrganizationAgents } from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { canViewAllData } from "@/lib/auth/permissions";
import { formatFCFA, formatDate } from "@/lib/format";
import type { Deal } from "@/types/database";

const STATUS_LABELS = {
  en_cours: "En cours",
  solde: "Soldé",
  annule: "Annulé",
} as const;

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; agent?: string }>;
}

export default async function DealsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  const filters: DealListFilters = {
    q: params.q,
    status: params.status as Deal["status"] | undefined,
    agent: params.agent,
  };

  const isManager = canViewAllData(session.profile.role);
  const agentId = isManager ? (params.agent ?? null) : session.userId;

  const [deals, counts, kpis, agents] = await Promise.all([
    getDealsList({ ...filters, agent: agentId ?? filters.agent }),
    getDealStatusCounts(),
    getDashboardKPIs(agentId),
    isManager ? getOrganizationAgents() : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(params.q || params.status || params.agent);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground">Paiement échelonné terrain & maison</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/deals/nouveau">
            <Plus className="h-4 w-4" />
            Nouvelle vente
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title="Ventes actives"
          value={String(counts.en_cours)}
          icon={Handshake}
        />
        <KpiStatCard title="Soldées" value={String(counts.solde)} subtitle="Terminées" />
        <KpiStatCard
          title="Reste à encaisser"
          value={formatFCFA(kpis.total_remaining)}
          icon={Wallet}
        />
        <KpiStatCard
          title="Échéances en retard"
          value={String(kpis.overdue_count)}
          subtitle={formatFCFA(kpis.overdue_amount)}
          icon={AlertTriangle}
          valueClassName="text-red-600"
          alert={kpis.overdue_count > 0}
          href="/dashboard/encaissements"
        />
      </div>

      <DealStatusSummary
        en_cours={counts.en_cours}
        solde={counts.solde}
        annule={counts.annule}
      />

      <DealFilters
        q={params.q}
        status={params.status}
        agent={params.agent}
        agents={isManager ? agents : []}
      />

      <p className="text-sm text-muted-foreground">
        {deals.length} vente{deals.length !== 1 ? "s" : ""} affichée
        {deals.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtres actifs)" : ` sur ${counts.total}`}
      </p>

      {kpis.overdue_count > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800">
              <Calendar className="h-4 w-4" />
              {kpis.overdue_count} échéance{kpis.overdue_count !== 1 ? "s" : ""} en retard
            </div>
            <PaymentScheduleList
              items={kpis.overdue_schedules.slice(0, 5)}
              variant="overdue"
              emptyMessage="Aucune échéance en retard."
            />
          </CardContent>
        </Card>
      )}

      {deals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Aucune vente ne correspond à vos filtres."
                : "Aucune vente enregistrée pour le moment."}
            </p>
            {!hasFilters && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/deals/nouveau">Créer votre première vente</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {deals.map((d) => (
            <Link key={d.id} href={`/dashboard/deals/${d.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{d.property?.title ?? "Bien"}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.client?.full_name} · {formatFCFA(Number(d.total_amount))} ·{" "}
                      {formatDate(d.created_at)}
                      {d.agent?.full_name && isManager && ` · ${d.agent.full_name}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      d.status === "solde" ? "libre" : d.status === "annule" ? "vendu" : "reserve"
                    }
                  >
                    {STATUS_LABELS[d.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
