import Link from "next/link";
import { formatDate, formatFCFA } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/types/entities";
import type { RecentPaymentRow } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/types/database";

interface RecentPaymentsListProps {
  payments: RecentPaymentRow[];
}

export function RecentPaymentsList({ payments }: RecentPaymentsListProps) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun paiement enregistré. Les encaissements apparaîtront ici depuis les fiches vente.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <Link
          key={payment.id}
          href={`/dashboard/deals/${payment.deal_id}`}
          className="flex flex-col gap-1 rounded-md border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{payment.client_name}</p>
            <p className="text-xs text-muted-foreground">{payment.property_title}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-semibold text-emerald-700">{formatFCFA(payment.amount)}</p>
            <p className="text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod]} ·{" "}
              {formatDate(payment.paid_at)} · Reçu {payment.receipt_number}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
