"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAcdStatusAction } from "@/lib/actions/deals";
import {
  ACD_STATUS_DESCRIPTIONS,
  ACD_STATUS_LABELS,
  ACD_STATUS_ORDER,
  acdProgressPercent,
} from "@/lib/acd-workflow";
import { cn } from "@/lib/utils";
import type { AcdStatus } from "@/types/database";
import { formatDate } from "@/lib/format";

interface AcdWorkflowTrackerProps {
  dealId: string;
  contractType: string;
  acdStatus: AcdStatus;
  acdNotes: string | null;
  acdUpdatedAt: string | null;
  canEdit: boolean;
}

export function AcdWorkflowTracker({
  dealId,
  contractType,
  acdStatus,
  acdNotes,
  acdUpdatedAt,
  canEdit,
}: AcdWorkflowTrackerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(acdStatus);
  const [notes, setNotes] = useState(acdNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  if (contractType !== "acd") return null;

  const progress = acdProgressPercent(status);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateAcdStatusAction({
        deal_id: dealId,
        acd_status: status,
        acd_notes: notes,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck2 className="h-5 w-5 text-primary" />
          Suivi ACD / titre foncier
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Workflow administratif ivoirien — dossier, bornage, délivrance (comme ImmoSpaces, intégré à
          la vente).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Avancement administratif</span>
            <span className="font-medium text-foreground">{progress} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className="grid gap-2 sm:grid-cols-5">
          {ACD_STATUS_ORDER.map((step) => {
            const stepIdx = ACD_STATUS_ORDER.indexOf(step);
            const currentIdx = ACD_STATUS_ORDER.indexOf(status);
            const done = stepIdx < currentIdx;
            const active = step === status;

            return (
              <li
                key={step}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center text-[10px] leading-tight sm:text-xs",
                  active && "border-primary bg-primary/10 font-semibold text-primary",
                  done && !active && "border-emerald-200 bg-emerald-50 text-emerald-800",
                  !done && !active && "border-muted bg-muted/30 text-muted-foreground"
                )}
              >
                {done && !active && <CheckCircle2 className="mx-auto mb-0.5 h-3.5 w-3.5" />}
                {ACD_STATUS_LABELS[step]}
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-muted-foreground">{ACD_STATUS_DESCRIPTIONS[status]}</p>

        {acdUpdatedAt && (
          <p className="text-xs text-muted-foreground">
            Dernière mise à jour : {formatDate(acdUpdatedAt)}
          </p>
        )}

        {canEdit && (
          <div className="space-y-3 border-t pt-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="acd_status">Étape actuelle</Label>
                <Select
                  id="acd_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AcdStatus)}
                >
                  {ACD_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {ACD_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acd_notes">Notes internes</Label>
                <Textarea
                  id="acd_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Référence dossier, date de dépôt, contact géomètre…"
                  rows={2}
                />
              </div>
            </div>
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? "Enregistrement…" : "Mettre à jour le suivi ACD"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
