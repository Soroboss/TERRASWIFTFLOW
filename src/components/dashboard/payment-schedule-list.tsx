import Link from "next/link";
import { formatDate, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PaymentScheduleListItem {
  schedule_id: string;
  deal_id: string;
  client_name: string;
  property_title: string;
  due_date: string;
  remaining: number;
}

interface PaymentScheduleListProps {
  items: PaymentScheduleListItem[];
  variant?: "default" | "overdue";
  emptyMessage: string;
}

export function PaymentScheduleList({
  items,
  variant = "default",
  emptyMessage,
}: PaymentScheduleListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.schedule_id}
          href={`/dashboard/deals/${item.deal_id}`}
          className={cn(
            "block rounded-md border p-3 transition-colors",
            variant === "overdue"
              ? "border-red-200 bg-red-50 hover:bg-red-100"
              : "hover:bg-accent"
          )}
        >
          <p className="font-medium">{item.client_name}</p>
          <p className="text-xs text-muted-foreground">{item.property_title}</p>
          <p
            className={cn(
              "mt-1 text-sm",
              variant === "overdue" ? "text-red-800" : "text-muted-foreground"
            )}
          >
            {formatDate(item.due_date)} · {formatFCFA(item.remaining)}
          </p>
        </Link>
      ))}
    </div>
  );
}
