import { CLIENT_SOURCE_LABELS, type ClientSource } from "@/types/entities";

interface ClientSourceSummaryProps {
  bySource: Record<string, number>;
  diaspora: number;
  local: number;
}

export function ClientSourceSummary({ bySource, diaspora, local }: ClientSourceSummaryProps) {
  const sources = Object.entries(bySource)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-center">
        <p className="text-lg font-bold sm:text-xl">{diaspora}</p>
        <p className="text-xs text-muted-foreground">Diaspora</p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-3 text-center">
        <p className="text-lg font-bold sm:text-xl">{local}</p>
        <p className="text-xs text-muted-foreground">Local</p>
      </div>
      {sources.map(([key, count]) => (
        <div key={key} className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-lg font-bold sm:text-xl">{count}</p>
          <p className="text-xs text-muted-foreground">
            {key === "non_renseigne"
              ? "Source N/R"
              : CLIENT_SOURCE_LABELS[key as ClientSource] ?? key}
          </p>
        </div>
      ))}
    </div>
  );
}
