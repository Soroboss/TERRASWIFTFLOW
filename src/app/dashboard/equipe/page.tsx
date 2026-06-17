import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, UserCheck, UserCog, Shield } from "lucide-react";
import { getOrganizationTeam, getOrganizationTeamStats } from "@/lib/actions/team";
import { requireSession } from "@/lib/auth";
import { requireManagerOrOwner } from "@/lib/auth/access";
import { getMaxAgentsForPlan } from "@/lib/pricing";
import { AddOrganizationMemberForm } from "@/components/dashboard/add-organization-member-form";
import { OrganizationTeamMemberRow } from "@/components/dashboard/organization-team-member-row";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { TeamRoleSummary } from "@/components/dashboard/team-role-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrganizationTeamPage() {
  const session = await requireSession();
  requireManagerOrOwner(session);

  const [team, stats] = await Promise.all([
    getOrganizationTeam(),
    getOrganizationTeamStats(),
  ]);

  const maxAgents = getMaxAgentsForPlan(session.organization.plan);
  const atLimit = maxAgents !== null && stats.active >= maxAgents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="text-muted-foreground">
            Collaborateurs de {session.organization.name}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/parametres">Paramètres entreprise</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard
          title="Membres"
          value={String(stats.total)}
          subtitle={
            maxAgents
              ? `${stats.active} actifs / ${maxAgents} max`
              : `${stats.active} actifs`
          }
          icon={Users}
        />
        <KpiStatCard
          title="Actifs"
          value={String(stats.active)}
          icon={UserCheck}
          valueClassName="text-emerald-700"
        />
        <KpiStatCard
          title="Managers"
          value={String(stats.managers + stats.owners)}
          icon={UserCog}
        />
        <KpiStatCard
          title="Agents"
          value={String(stats.agents)}
          subtitle={stats.inactive > 0 ? `${stats.inactive} inactif(s)` : undefined}
          icon={Shield}
          alert={atLimit}
          href="/dashboard/abonnement"
        />
      </div>

      <TeamRoleSummary
        owners={stats.owners}
        managers={stats.managers}
        agents={stats.agents}
      />

      {atLimit && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-sm text-amber-900">
            Limite du plan Starter atteinte ({maxAgents} utilisateurs). Passez au plan Pro
            pour ajouter plus de collaborateurs.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Membres ({stats.active}
            {maxAgents ? ` / ${maxAgents}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun collaborateur pour le moment.</p>
          ) : (
            <ul className="divide-y">
              {team.map((member) => (
                <OrganizationTeamMemberRow
                  key={member.id}
                  member={member}
                  currentUserId={session.userId}
                  actorRole={session.profile.role}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un collaborateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddOrganizationMemberForm disabled={atLimit} actorRole={session.profile.role} />
        </CardContent>
      </Card>
    </div>
  );
}
