import { cn } from "@/lib/utils";

interface LandingProductPreviewProps {
  children: React.ReactNode;
  className?: string;
  urlLabel?: string;
}

export function LandingProductPreview({
  children,
  className,
  urlLabel = "terraswiftflow.vercel.app/dashboard",
}: LandingProductPreviewProps) {
  return (
    <div className={cn("mx-auto w-full", className)}>
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-primary/10 ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2 border-b bg-slate-100 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-[10px] text-slate-500 sm:text-xs">
            {urlLabel}
          </div>
        </div>
        <div className="max-h-[min(70vh,480px)] overflow-auto bg-background p-3 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
