import Image from "next/image";
import { cn } from "@/lib/utils";

interface LandingImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain";
}

export function LandingImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  objectFit = "cover",
}: LandingImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card shadow-lg shadow-primary/5",
        objectFit === "contain" && "bg-muted/30",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={objectFit === "contain" ? "object-contain p-1" : "object-cover"}
      />
    </div>
  );
}

export const LANDING_IMAGES = {
  hero: "/landing/landing-hero.png",
  mobileAgent: "/landing/landing-mobile-agent.png",
  masterplan: "/landing/landing-masterplan.png",
  beforeAfter: "/landing/landing-before-after.png",
} as const;
