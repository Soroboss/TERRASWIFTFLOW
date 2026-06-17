import { ACTIVITY_TYPE_LABELS, type ActivityType } from "@/types/entities";

interface ActivityTypeSummaryProps {
  byType: Record<ActivityType, number>;
}

const TYPE_DOTS: Record<ActivityType, string> = {
  appel: "bg-blue-500",
  visite: "bg-violet-500",
  relance: "bg-orange-500",
};

export function ActivityTypeSummary({ byType }: ActivityTypeSummaryProps) {
  const types: ActivityType[] = ["appel", "visite", "relance"];

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map((type) => (
        <div key={type} className="rounded-lg border bg-muted/30 p-2 text-center sm:p-3">
          <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${TYPE_DOTS[type]}`} />
          <p className="text-lg font-bold sm:text-xl">{byType[type]}</p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">
            {ACTIVITY_TYPE_LABELS[type]}
          </p>
        </div>
      ))}
    </div>
  );
}
