"use client";

import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealsViewToggleProps {
  currentView: "list" | "pipeline";
  baseQuery: string;
}

export function DealsViewToggle({ currentView, baseQuery }: DealsViewToggleProps) {
  const prefix = baseQuery ? `${baseQuery}&` : "?";

  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      <Link
        href={`/dashboard/deals${prefix}view=list`.replace("?&", "?")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          currentView === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
        Liste
      </Link>
      <Link
        href={`/dashboard/deals${prefix}view=pipeline`.replace("?&", "?")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          currentView === "pipeline"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Pipeline
      </Link>
    </div>
  );
}
