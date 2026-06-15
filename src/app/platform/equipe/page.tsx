import { getPlatformTeam } from "@/lib/actions/platform/team";
import { canManageTeam, requirePlatformSession } from "@/lib/platform/auth";
import { AddTeamMemberForm } from "@/components/platform/add-team-member-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_ROLE_LABELS } from "@/types/platform";
import { formatDate } from "@/lib/format";

export default async function PlatformTeamPage() {
  const session = await requirePlatformSession();
  const team = await getPlatformTeam();
  const canManage = canManageTeam(session.platformUser.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Équipe plateforme</h1>
        <p className="text-muted-foreground">
          Staff TerraSwiftFlow qui gère les tenants, abonnements et support
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres ({team.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun membre. Ajoutez votre e-mail dans PLATFORM_BOOTSTRAP_EMAILS ou via le
              formulaire ci-dessous.
            </p>
          ) : (
            <ul className="divide-y">
              {team.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{PLATFORM_ROLE_LABELS[member.role]}</Badge>
                    {!member.active && <Badge variant="outline">Inactif</Badge>}
                    <span className="text-xs text-muted-foreground">
                      depuis {formatDate(member.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un membre</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTeamMemberForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
