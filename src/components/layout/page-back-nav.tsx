"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageBackNavProps {
  homeHref?: string;
  homeLabel?: string;
  showBack?: boolean;
  className?: string;
}

export function PageBackNav({
  homeHref = "/",
  homeLabel = "Accueil",
  showBack = true,
  className = "",
}: PageBackNavProps) {
  const router = useRouter();

  return (
    <nav
      className={`mb-4 flex flex-wrap items-center gap-1 ${className}`}
      aria-label="Navigation de page"
    >
      {showBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      )}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
        <Link href={homeHref}>
          <Home className="h-4 w-4" />
          {homeLabel}
        </Link>
      </Button>
    </nav>
  );
}
