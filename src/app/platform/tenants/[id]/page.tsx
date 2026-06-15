import { notFound } from "next/navigation";
import { getTenantOverview } from "@/lib/actions/platform/stats";
import { canManageBilling, requirePlatformSession } from "@/lib/platform/auth";
import { TenantSubscriptionPanel } from "@/components/platform/tenant-subscription-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_STATUS_LABELS } from "@/types/platform";
import { formatDate, formatFCFA } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformTenantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requirePlatformSession();
  const tenant = await getTenantOverview(id);

  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="capitalize">{tenant.plan}</Badge>
          <Badge variant="secondary">
            {SUBSCRIPTION_STATUS_LABELS[tenant.subscription_status]}
          </Badge>
          {tenant.suspended_at && <Badge variant="outline">Suspendu</Badge>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Utilisateurs actifs", value: tenant.active_users },
          { label: "Biens", value: tenant.properties_count },
          { label: "Clients", value: tenant.clients_count },
          { label: "Ventes en cours", value: tenant.active_deals },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Inscrit le :</span>{" "}
              {formatDate(tenant.created_at)}
            </p>
            {tenant.trial_ends_at && (
              <p>
                <span className="text-muted-foreground">Fin d&apos;essai :</span>{" "}
                {formatDate(tenant.trial_ends_at)}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Encaissements 30j :</span>{" "}
              {formatFCFA(Number(tenant.revenue_30d))}
            </p>
            <p>
              <span className="text-muted-foreground">Ventes soldées :</span>{" "}
              {tenant.closed_deals}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonnement & facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantSubscriptionPanel
              tenantId={tenant.id}
              plan={tenant.plan}
              subscriptionStatus={tenant.subscription_status}
              trialEndsAt={tenant.trial_ends_at}
              billingEmail={tenant.billing_email}
              notes={tenant.notes}
              suspended={Boolean(tenant.suspended_at)}
              canEdit={canManageBilling(session.platformUser.role)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
