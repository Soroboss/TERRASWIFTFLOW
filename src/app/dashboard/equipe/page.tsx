import { getOrganizationTeam } from "@/lib/actions/team";
import { requireSession } from "@/lib/auth";
import { AddOrganizationMemberForm } from "@/components/dashboard/add-organization-member-form";
import { OrganizationTeamMemberRow } from "@/components/dashboard/organization-team-member-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function OrganizationTeamPage() {
  const session = await requireSession();
  const canManage = session.profile.role === "owner" || session.profile.role === "manager";

  if (!canManage) {
    redirect("/dashboard");
  }

  const team = await getOrganizationTeam();
  const starterLimit = session.organization.plan === "starter" ? 3 : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-muted-foreground">
          Gérez les collaborateurs de {session.organization.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Membres ({team.length}
            {starterLimit ? ` / ${starterLimit} max` : ""})
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
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un collaborateur</CardTitle>
        </CardHeader>
        <CardContent>
          <AddOrganizationMemberForm />
        </CardContent>
      </Card>
    </div>
  );
}
