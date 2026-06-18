"use client";

import { useState } from "react";
import { Map, Pencil, Upload } from "lucide-react";
import { MasterplanImageUpload } from "@/components/plans/masterplan-image-upload";
import {
  MasterplanInteractiveMap,
  MasterplanMapLotList,
  type MasterplanMapLot,
} from "@/components/plans/masterplan-interactive-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MasterplanMapSectionProps {
  masterplanId: string;
  imageUrl: string | null;
  lots: MasterplanMapLot[];
  canEdit: boolean;
  showSoldLots?: boolean;
}

export function MasterplanMapSection({
  masterplanId,
  imageUrl,
  lots,
  canEdit,
  showSoldLots = true,
}: MasterplanMapSectionProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const zonesCount = lots.filter((l) => l.map_zone).length;

  if (!imageUrl) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5 text-primary" />
            Plan interactif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uploadez l&apos;image de votre plan de masse (PNG ou JPG). Vous pourrez ensuite
            délimiter chaque parcelle pour la rendre cliquable — comme une expérience immersive
            pour vos équipes commerciales.
          </p>
          {canEdit ? (
            <MasterplanImageUpload masterplanId={masterplanId} imageUrl={null} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucune image de plan disponible.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Map className="h-5 w-5 text-primary" />
            Plan interactif
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {zonesCount} parcelle{zonesCount !== 1 ? "s" : ""} cliquable{zonesCount !== 1 ? "s" : ""}
            {canEdit && " · survolez et cliquez pour accéder à la fiche lot ou vente"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <Button
                type="button"
                size="sm"
                variant={mode === "view" ? "default" : "outline"}
                onClick={() => {
                  setMode("view");
                  setSelectedLotId(null);
                }}
                className="gap-1.5"
              >
                <Map className="h-4 w-4" />
                Explorer
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "edit" ? "default" : "outline"}
                onClick={() => setMode("edit")}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                Configurer zones
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <details className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
              <Upload className="h-4 w-4" />
              Remplacer l&apos;image du plan
            </summary>
            <div className="mt-3 border-t pt-3">
              <MasterplanImageUpload masterplanId={masterplanId} imageUrl={imageUrl} />
            </div>
          </details>
        )}

        <div
          className={cn(
            "grid gap-4",
            mode === "edit" && canEdit ? "lg:grid-cols-[240px_1fr]" : ""
          )}
        >
          {mode === "edit" && canEdit && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lots du programme
              </p>
              <MasterplanMapLotList
                lots={lots}
                selectedLotId={selectedLotId}
                onSelectLot={setSelectedLotId}
              />
            </div>
          )}

          <MasterplanInteractiveMap
            imageUrl={imageUrl}
            lots={lots}
            mode={canEdit ? mode : "view"}
            selectedLotId={selectedLotId}
            onSelectLot={setSelectedLotId}
            showSoldLots={showSoldLots}
          />
        </div>
      </CardContent>
    </Card>
  );
}
