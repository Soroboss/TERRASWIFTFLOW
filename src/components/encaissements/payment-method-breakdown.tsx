import { formatFCFA } from "@/lib/format";
import type { PaymentMethodBreakdown } from "@/lib/actions/payments";

interface PaymentMethodBreakdownProps {
  items: PaymentMethodBreakdown[];
  total: number;
}

export function PaymentMethodBreakdownBar({
  items,
  total,
}: PaymentMethodBreakdownProps) {
  if (items.length === 0 || total <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun encaissement enregistré ce mois.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {items.map((item) => (
          <div
            key={item.method}
            className="h-full bg-primary/80 first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(item.amount / total) * 100}%` }}
            title={`${item.label} — ${formatFCFA(item.amount)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {items.map((item) => (
          <span key={item.method}>
            {item.label} · {formatFCFA(item.amount)} (
            {Math.round((item.amount / total) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
