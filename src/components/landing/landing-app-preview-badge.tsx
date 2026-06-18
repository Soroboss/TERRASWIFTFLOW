import { cn } from "@/lib/utils";

interface LandingAppPreviewBadgeProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

/** Encadre l'aperçu réel de l'app sous ou à côté d'une illustration — sans chevauchement. */
export function LandingAppPreviewBadge({
  children,
  label = "Interface réelle de l'application",
  className,
}: LandingAppPreviewBadgeProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-primary/30 bg-emerald-50/40 p-3 sm:p-4",
        className
      )}
    >
      <p className="mb-3 text-center text-xs font-medium text-primary">{label}</p>
      {children}
    </div>
  );
}
