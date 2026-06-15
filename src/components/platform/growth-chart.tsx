import type { GrowthPoint } from "@/types/platform";

interface GrowthChartProps {
  data: GrowthPoint[];
  title: string;
}

export function GrowthChart({ data, title }: GrowthChartProps) {
  const max = Math.max(1, ...data.flatMap((d) => [d.signups, d.activations]));

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-6 font-semibold">{title}</h3>
      <div className="flex h-48 items-end gap-2 sm:gap-3">
        {data.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              <div
                className="w-2 rounded-t bg-primary/80 sm:w-3"
                style={{ height: `${(point.signups / max) * 100}%`, minHeight: point.signups ? 4 : 0 }}
                title={`Inscriptions: ${point.signups}`}
              />
              <div
                className="w-2 rounded-t bg-emerald-500/80 sm:w-3"
                style={{
                  height: `${(point.activations / max) * 100}%`,
                  minHeight: point.activations ? 4 : 0,
                }}
                title={`Activations: ${point.activations}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground sm:text-xs">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary/80" /> Inscriptions
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Activations
        </span>
      </div>
    </div>
  );
}
