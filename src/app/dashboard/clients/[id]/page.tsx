import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { WhatsAppRelancePanel } from "@/components/activities/whatsapp-relance-panel";
import { ActivityList } from "@/components/activities/activity-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActivitiesByClientId } from "@/lib/actions/activities";
import { getClient } from "@/lib/actions/clients";
import { getDealsByClientId } from "@/lib/actions/deals";
import { requireSession } from "@/lib/auth";
import { formatDate, formatFCFA, formatPhoneCI } from "@/lib/format";
import { parseCompanyProfile } from "@/types/organization-profile";
import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

const STATUS_LABELS = {
  en_cours: "En cours",
  solde: "Soldé",
  annule: "Annulé",
} as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const companyProfile = parseCompanyProfile(session.organization.company_profile);
  const organizationName = companyProfile.legal_name ?? session.organization.name;
  const agentName = session.profile.full_name;

  const [client, deals, activities] = await Promise.all([
    getClient(id),
    getDealsByClientId(id),
    getActivitiesByClientId(id),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client.full_name}</h1>
          <p className="text-muted-foreground">{formatPhoneCI(client.phone)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/relances/nouveau?client=${id}`}>
              <Plus className="h-4 w-4" />
              Planifier relance
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clients/${id}/modifier`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {client.email && <p>E-mail : {client.email}</p>}
          <p>Pays : {client.country}</p>
          {client.source && (
            <p>
              Source : {CLIENT_SOURCE_LABELS[client.source as ClientSource] ?? client.source}
            </p>
          )}
          <p>Diaspora : {client.is_diaspora ? "Oui" : "Non"}</p>
          <p>Créé le : {formatDate(client.created_at)}</p>
        </CardContent>
      </Card>

      <WhatsAppRelancePanel
        variant="full"
        phone={client.phone}
        clientName={client.full_name}
        organizationName={organizationName}
        agentName={agentName}
        propertyTitle={deals.find((d) => d.status === "en_cours")?.property?.title ?? null}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Ventes ({deals.length})</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/deals/nouveau?client=${id}`}>Nouvelle vente</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune vente pour ce client.</p>
          ) : (
            deals.map((d) => (
              <Link key={d.id} href={`/dashboard/deals/${d.id}`}>
                <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/40">
                  <div>
                    <p className="font-medium">{d.property?.title ?? "Bien"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFCFA(Number(d.total_amount))} · {formatDate(d.created_at)}
                    </p>
                  </div>
                  <Badge variant={d.status === "solde" ? "libre" : d.status === "annule" ? "vendu" : "reserve"}>
                    {STATUS_LABELS[d.status]}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Relances récentes</h2>
        <ActivityList
          activities={activities}
          organizationName={organizationName}
          agentName={agentName}
          emptyMessage="Aucune relance planifiée pour ce client."
        />
      </div>
    </div>
  );
}
