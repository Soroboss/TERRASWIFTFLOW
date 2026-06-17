import Link from "next/link";
import { Settings } from "lucide-react";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { KpiStatCard } from "@/components/dashboard/kpi-stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrganizationSettings } from "@/lib/actions/organization-settings";
import { requireSession } from "@/lib/auth";
import { requireOwner } from "@/lib/auth/access";
import { formatPhoneCI } from "@/lib/format";

export default async function ParametresPage() {
  const session = await requireSession();
  requireOwner(session);

  const { organization, profile } = await getOrganizationSettings();
  const filledFields = [
    profile.logo_url,
    profile.contact_email,
    profile.contact_phone,
    profile.address,
    profile.rccm,
    profile.rib,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paramètres entreprise</h1>
          <p className="text-muted-foreground">
            Logo, coordonnées, RCCM et RIB — affichés sur vos documents
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/equipe">Gérer l&apos;équipe</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStatCard title="Entreprise" value={organization.name} icon={Settings} />
        <KpiStatCard
          title="Profil complété"
          value={`${filledFields}/6`}
          subtitle="Champs clés renseignés"
          valueClassName={filledFields >= 4 ? "text-emerald-700" : "text-amber-700"}
        />
        <KpiStatCard
          title="Contact"
          value={profile.contact_phone ? formatPhoneCI(profile.contact_phone) : "—"}
          subtitle={profile.contact_email ?? "E-mail non renseigné"}
        />
        <KpiStatCard
          title="RCCM"
          value={profile.rccm ?? "—"}
          subtitle={profile.city ?? "Ville non renseignée"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;entreprise</CardTitle>
          <CardDescription>
            Ces données apparaissent sur les contrats PDF, reçus et communications clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm
            organizationName={organization.name}
            billingEmail={organization.billing_email}
            profile={profile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
