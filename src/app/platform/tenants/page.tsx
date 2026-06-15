import { getTenantOverviews } from "@/lib/actions/platform/stats";
import { TenantTable } from "@/components/platform/tenant-table";

export default async function PlatformTenantsPage() {
  const tenants = await getTenantOverviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des tenants</h1>
        <p className="text-muted-foreground">
          Toutes les organisations inscrites sur TerraSwiftFlow
        </p>
      </div>
      <TenantTable tenants={tenants} showRevenue />
    </div>
  );
}
