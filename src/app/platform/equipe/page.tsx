import { getPlatformTeam } from "@/lib/actions/platform/team";
import { canManageTeam, requirePlatformSession } from "@/lib/platform/auth";
import { AddTeamMemberForm } from "@/components/platform/add-team-member-form";
import { PlatformAutonomyNotice } from "@/components/platform/platform-autonomy-notice";
import { PlatformTeamMemberRow } from "@/components/platform/platform-team-member-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlatformTeamPage() {
  const session = await requirePlatformSession();
  const team = await getPlatformTeam();
  const canManage = canManageTeam(session.platformUser.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Équipe plateforme</h1>
        <p className="text-muted-foreground">
          Staff interne TerraSwiftFlow — abonnements, facturation et support SaaS
        </p>
      </div>

      <PlatformAutonomyNotice variant="team" />

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
                <PlatformTeamMemberRow
                  key={member.id}
                  member={member}
                  currentUserId={session.userId}
                  canManage={canManage}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un membre staff</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTeamMemberForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
