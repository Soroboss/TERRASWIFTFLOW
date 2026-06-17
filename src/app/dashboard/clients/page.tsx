import Link from "next/link";
import { Plus, Users, Globe, UserCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientSourceSummary } from "@/components/clients/client-source-summary";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import {
  getClientsList,
  getClientStats,
  getOrganizationAgents,
  type ClientListFilters,
} from "@/lib/actions/clients";
import { requireSession } from "@/lib/auth";
import { canViewAllData, canViewCompanyRevenue } from "@/lib/auth/permissions";
import { formatPhoneCI } from "@/lib/format";
import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

interface PageProps {
  searchParams: Promise<{ q?: string; source?: string; diaspora?: string; agent?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  const filters: ClientListFilters = {
    q: params.q,
    source: params.source as ClientSource | undefined,
    diaspora: params.diaspora as "oui" | "non" | undefined,
    agent: params.agent,
  };

  const isManager = canViewAllData(session.profile.role);
  const showCompanyRevenue = canViewCompanyRevenue(session.profile.role);
  const effectiveAgent = isManager ? filters.agent : session.userId;

  const [clients, stats, agents] = await Promise.all([
    getClientsList({ ...filters, agent: effectiveAgent }),
    getClientStats(effectiveAgent),
    isManager ? getOrganizationAgents() : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(params.q || params.source || params.diaspora || params.agent);
  const localCount = stats.total - stats.diaspora;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Prospects et acquéreurs</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title={showCompanyRevenue ? "Total clients" : "Mes clients"}
          value={String(stats.total)}
          icon={Users}
        />
        <KpiStatCard
          title="Diaspora"
          value={String(stats.diaspora)}
          subtitle={`${localCount} local${localCount !== 1 ? "aux" : ""}`}
          icon={Globe}
        />
        <KpiStatCard
          title="Nouveaux ce mois"
          value={String(stats.newThisMonth)}
          icon={Sparkles}
        />
        <KpiStatCard
          title="Avec vente active"
          value={String(stats.withActiveDeal)}
          subtitle="Clients en cours d'achat"
          icon={UserCheck}
          href="/dashboard/deals?status=en_cours"
        />
      </div>

      <ClientSourceSummary bySource={stats.bySource} diaspora={stats.diaspora} local={localCount} />

      <ClientFilters
        q={params.q}
        source={params.source}
        diaspora={params.diaspora}
        agent={params.agent}
        agents={isManager ? agents : []}
      />

      <p className="text-sm text-muted-foreground">
        {clients.length} client{clients.length !== 1 ? "s" : ""} affiché
        {clients.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtres actifs)" : ` sur ${stats.total}`}
      </p>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Aucun client ne correspond à vos filtres."
                : "Aucun client enregistré pour le moment."}
            </p>
            {!hasFilters && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/clients/nouveau">Ajouter votre premier client</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((c) => (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-semibold">{c.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhoneCI(c.phone)}
                    {c.source &&
                      ` · ${CLIENT_SOURCE_LABELS[c.source as ClientSource] ?? c.source}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {c.is_diaspora && <span className="rounded bg-muted px-2 py-0.5">Diaspora</span>}
                    {c.country && <span>{c.country}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
