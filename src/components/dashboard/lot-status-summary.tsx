import { propertyStatusDotClass } from "@/lib/property-status";

interface LotStatusSummaryProps {
  libres: number;
  reserves: number;
  vendus: number;
  compact?: boolean;
}

export function LotStatusSummary({ libres, reserves, vendus, compact }: LotStatusSummaryProps) {
  const items = [
    { label: "Libres", value: libres, status: "libre" as const },
    { label: "Réservés", value: reserves, status: "reserve" as const },
    { label: "Vendus", value: vendus, status: "vendu" as const },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "mb-3"}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border bg-muted/30 p-2 text-center sm:p-3"
        >
          <div
            className={`mx-auto mb-1 h-2 w-2 rounded-full ${propertyStatusDotClass(item.status)}`}
          />
          <p className={`font-bold ${compact ? "text-sm" : "text-lg sm:text-xl"}`}>{item.value}</p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
