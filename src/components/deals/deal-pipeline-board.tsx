"use client";

import Link from "next/link";
import { formatFCFA, formatDate } from "@/lib/format";
import type { DealPipelineItem, DealPipelineStage } from "@/lib/actions/deals";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COLUMNS: { id: DealPipelineStage; title: string; subtitle: string; accent: string }[] = [
  {
    id: "reservation",
    title: "Réservation",
    subtitle: "Vente signée, en attente d'acompte",
    accent: "border-amber-300 bg-amber-50/80",
  },
  {
    id: "paiements",
    title: "Paiements en cours",
    subtitle: "Échéancier actif",
    accent: "border-blue-300 bg-blue-50/80",
  },
  {
    id: "solde",
    title: "Soldé",
    subtitle: "Encaissement complet",
    accent: "border-emerald-300 bg-emerald-50/80",
  },
  {
    id: "annule",
    title: "Annulé",
    subtitle: "Ventes annulées",
    accent: "border-slate-300 bg-slate-50/80",
  },
];

interface DealPipelineBoardProps {
  deals: DealPipelineItem[];
  showAgent: boolean;
}

export function DealPipelineBoard({ deals, showAgent }: DealPipelineBoardProps) {
  const byStage = (stage: DealPipelineStage) =>
    deals.filter((d) => d.pipeline_stage === stage);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = byStage(col.id);
        return (
          <div
            key={col.id}
            className={cn("flex min-h-[280px] flex-col rounded-xl border-2 p-3", col.accent)}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <Badge variant="outline" className="bg-white/80">
                  {items.length}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{col.subtitle}</p>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-black/10 bg-white/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  Aucune vente
                </p>
              ) : (
                items.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="block rounded-lg border border-white/60 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="truncate text-sm font-semibold">
                      {deal.property?.title ?? "Bien"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {deal.client?.full_name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {formatFCFA(Number(deal.total_amount))}
                    </p>
                    {col.id === "paiements" || col.id === "reservation" ? (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>Encaissé</span>
                          <span>{deal.payment_percent} %</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${deal.payment_percent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {formatDate(deal.created_at)}
                      {showAgent && deal.agent?.full_name && ` · ${deal.agent.full_name}`}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
