import { getTenantBillingRecords, getPlatformSettings } from "@/lib/actions/platform/stats";
import { PlatformAutonomyNotice } from "@/components/platform/platform-autonomy-notice";
import { TenantBillingTable } from "@/components/platform/tenant-billing-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_STATUS_LABELS } from "@/types/platform";
import { formatFcfa } from "@/lib/pricing";

export default async function PlatformSubscriptionsPage() {
  const [tenants, settings] = await Promise.all([
    getTenantBillingRecords(),
    getPlatformSettings(),
  ]);

  const trials = tenants.filter((t) => t.subscription_status === "trial");
  const actives = tenants.filter((t) => t.subscription_status === "active");
  const pastDue = tenants.filter((t) => t.subscription_status === "past_due");
  const cancelled = tenants.filter((t) => t.subscription_status === "cancelled");

  const mrr = actives
    .filter((t) => !t.suspended_at)
    .reduce((sum, t) => {
      if (t.plan === "pro") return sum + settings.pricing.pro_monthly;
      if (t.plan === "business") return sum + settings.pricing.business_monthly;
      return sum + settings.pricing.starter_monthly;
    }, 0);

  const groups = [
    { key: "trial", label: "En essai gratuit", items: trials },
    { key: "active", label: "Abonnements actifs", items: actives },
    { key: "past_due", label: "Impayés", items: pastDue },
    { key: "cancelled", label: "Résiliés", items: cancelled },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Abonnements & souscriptions</h1>
        <p className="text-muted-foreground">
          Pipeline commercial — essais, conversions et revenus récurrents
        </p>
      </div>

      <PlatformAutonomyNotice variant="tenants" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <Card key={g.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {g.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{g.items.length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Revenu mensuel récurrent estimé</p>
            <p className="text-3xl font-bold">{formatFcfa(mrr)} FCFA</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Starter {formatFcfa(settings.pricing.starter_monthly)} · Pro{" "}
            {formatFcfa(settings.pricing.pro_monthly)} · Business{" "}
            {formatFcfa(settings.pricing.business_monthly)}
          </p>
        </CardContent>
      </Card>

      {groups.map((g) =>
        g.items.length > 0 ? (
          <div key={g.key}>
            <h2 className="mb-3 text-lg font-semibold">
              {g.label}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({SUBSCRIPTION_STATUS_LABELS[g.key as keyof typeof SUBSCRIPTION_STATUS_LABELS]})
              </span>
            </h2>
            <TenantBillingTable tenants={g.items} />
          </div>
        ) : null
      )}
    </div>
  );
}
