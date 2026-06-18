import Image from "next/image";
import { cn } from "@/lib/utils";

interface LandingFeatureBlockProps {
  imageSrc: string;
  imageAlt: string;
  gradientClassName?: string;
  reverse?: boolean;
  children: React.ReactNode;
}

/** Bloc illustration + contenu alignés (même hauteur colonne image sur desktop). */
export function LandingFeatureBlock({
  imageSrc,
  imageAlt,
  gradientClassName = "from-emerald-50/60 to-background",
  reverse = false,
  children,
}: LandingFeatureBlockProps) {
  return (
    <div
      className={cn(
        "mb-12 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 lg:p-8",
        gradientClassName
      )}
    >
      <div
        className={cn(
          "grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10",
          reverse && "[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1"
        )}
      >
        <div className="relative min-h-[220px] w-full overflow-hidden rounded-2xl border bg-card shadow-lg shadow-primary/5 sm:min-h-[260px] lg:min-h-[420px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex flex-col justify-center gap-5">{children}</div>
      </div>
    </div>
  );
}
