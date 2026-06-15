import { getTenantBillingRecords } from "@/lib/actions/platform/stats";
import { PlatformAutonomyNotice } from "@/components/platform/platform-autonomy-notice";
import { TenantBillingTable } from "@/components/platform/tenant-billing-table";

export default async function PlatformTenantsPage() {
  const tenants = await getTenantBillingRecords();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organisations inscrites</h1>
        <p className="text-muted-foreground">
          Suivi des inscriptions et des abonnements — sans accès aux données métier des clients
        </p>
      </div>

      <PlatformAutonomyNotice variant="tenants" />
      <TenantBillingTable tenants={tenants} />
    </div>
  );
}
