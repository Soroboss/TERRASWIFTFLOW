import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_LABELS } from "@/types/platform";
import type { TenantOverview } from "@/types/platform";
import Link from "next/link";
import { formatDate, formatFCFA } from "@/lib/format";

interface TenantTableProps {
  tenants: TenantOverview[];
  showRevenue?: boolean;
}

export function TenantTable({ tenants, showRevenue }: TenantTableProps) {
  if (tenants.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aucun tenant inscrit pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Organisation</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Utilisateurs</th>
            <th className="px-4 py-3 font-medium">Biens</th>
            <th className="px-4 py-3 font-medium">Ventes actives</th>
            {showRevenue && <th className="px-4 py-3 font-medium">Encaissements 30j</th>}
            <th className="px-4 py-3 font-medium">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <Link href={`/platform/tenants/${t.id}`} className="font-medium text-primary hover:underline">
                  {t.name}
                </Link>
                {t.suspended_at && (
                  <Badge variant="outline" className="ml-2 text-amber-700">
                    Suspendu
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 capitalize">{t.plan}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    t.subscription_status === "active"
                      ? "default"
                      : t.subscription_status === "trial"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {SUBSCRIPTION_STATUS_LABELS[t.subscription_status]}
                </Badge>
              </td>
              <td className="px-4 py-3">{t.active_users}</td>
              <td className="px-4 py-3">{t.properties_count}</td>
              <td className="px-4 py-3">{t.active_deals}</td>
              {showRevenue && (
                <td className="px-4 py-3">{formatFCFA(Number(t.revenue_30d))}</td>
              )}
              <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
