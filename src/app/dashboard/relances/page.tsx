import Link from "next/link";
import { Plus, CalendarClock, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/activities/activity-filters";
import { ActivityList } from "@/components/activities/activity-list";
import { ActivityTypeSummary } from "@/components/activities/activity-type-summary";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import {
  getActivitiesList,
  getActivityStats,
  type ActivityListFilters,
  type ActivityView,
} from "@/lib/actions/activities";
import { getOrganizationAgents } from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { canViewAllData } from "@/lib/auth/permissions";
import type { ActivityType } from "@/types/entities";

const VIEW_LABELS: Record<ActivityView, string> = {
  pending: "à traiter",
  overdue: "en retard",
  today: "aujourd'hui",
  upcoming: "à venir",
  done: "terminées",
};

interface PageProps {
  searchParams: Promise<{ view?: string; type?: string; agent?: string }>;
}

export default async function RelancesPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const view = (params.view as ActivityView) || "pending";

  const filters: ActivityListFilters = {
    view,
    type: params.type as ActivityType | undefined,
    agent: params.agent,
  };

  const isManager = canViewAllData(session.profile.role);
  const agentId = isManager ? (params.agent ?? undefined) : session.userId;

  const [activities, stats, agents] = await Promise.all([
    getActivitiesList({ ...filters, agent: agentId }),
    getActivityStats(agentId),
    isManager ? getOrganizationAgents() : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(params.type || params.agent || (params.view && params.view !== "pending"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relances</h1>
          <p className="text-muted-foreground">Appels, visites et relances clients</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/relances/nouveau">
            <Plus className="h-4 w-4" />
            Planifier
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title="À traiter"
          value={String(stats.pending)}
          subtitle="Échéance passée ou aujourd'hui"
          icon={CalendarClock}
          href="/dashboard/relances"
        />
        <KpiStatCard
          title="En retard"
          value={String(stats.overdue)}
          icon={AlertTriangle}
          valueClassName="text-red-600"
          alert={stats.overdue > 0}
          href="/dashboard/relances?view=overdue"
        />
        <KpiStatCard
          title="Aujourd'hui"
          value={String(stats.today)}
          icon={Clock}
          href="/dashboard/relances?view=today"
        />
        <KpiStatCard
          title="Terminées ce mois"
          value={String(stats.doneThisMonth)}
          icon={CheckCircle2}
          href="/dashboard/relances?view=done"
        />
      </div>

      <ActivityTypeSummary byType={stats.byType} />

      <ActivityFilters
        view={view}
        type={params.type}
        agent={params.agent}
        agents={isManager ? agents : []}
      />

      <p className="text-sm text-muted-foreground">
        {activities.length} relance{activities.length !== 1 ? "s" : ""} {VIEW_LABELS[view]}
        {hasFilters ? " (filtres actifs)" : ""}
      </p>

      <ActivityList
        activities={activities}
        emptyMessage={
          view === "overdue"
            ? "Aucune relance en retard — bravo !"
            : view === "done"
              ? "Aucune relance terminée pour cette sélection."
              : "Aucune relance pour cette sélection."
        }
      />
    </div>
  );
}
