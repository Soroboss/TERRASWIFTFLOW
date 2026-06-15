import { getOrganizationTeam } from "@/lib/actions/team";
import { requireSession } from "@/lib/auth";
import { AddOrganizationMemberForm } from "@/components/dashboard/add-organization-member-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

const ROLE_LABELS = {
  owner: "Propriétaire",
  manager: "Manager",
  agent: "Agent",
} as const;

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
          Gérez les collaborateurs de {session.organization.name} — indépendants de l&apos;admin
          TerraSwiftFlow
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Chaque organisation gère ses propres agents et managers. L&apos;administrateur SaaS
          TerraSwiftFlow n&apos;a pas accès à cette liste ni ne peut créer vos collaborateurs.
        </CardContent>
      </Card>

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
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.phone ?? "Téléphone non renseigné"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
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
