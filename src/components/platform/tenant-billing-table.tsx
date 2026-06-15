import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUS_LABELS } from "@/types/platform";
import type { TenantBillingRecord } from "@/types/platform";
import Link from "next/link";
import { formatDate } from "@/lib/format";

interface TenantBillingTableProps {
  tenants: TenantBillingRecord[];
}

export function TenantBillingTable({ tenants }: TenantBillingTableProps) {
  if (tenants.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aucune organisation inscrite pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Organisation</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Statut abonnement</th>
            <th className="px-4 py-3 font-medium">Fin d&apos;essai</th>
            <th className="px-4 py-3 font-medium">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <Link
                  href={`/platform/tenants/${t.id}`}
                  className="font-medium text-primary hover:underline"
                >
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
              <td className="px-4 py-3 text-muted-foreground">
                {t.trial_ends_at ? formatDate(t.trial_ends_at) : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
