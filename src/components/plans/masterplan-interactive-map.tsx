"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hand,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePropertyMapZoneAction } from "@/lib/actions/masterplans";
import { formatLotNumberReference } from "@/lib/catalog-visibility";
import {
  MAP_ZONE_STATUS_COLORS,
  rectFromDrag,
  zoneCenter,
  zoneToPercentPoints,
} from "@/lib/map-zone";
import { PROPERTY_STATUS_LABELS } from "@/lib/property-status";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MapZone, PropertyStatus } from "@/types/database";

export interface MasterplanMapLot {
  id: string;
  status: PropertyStatus;
  lot_number: string | null;
  reference: string | null;
  title: string | null;
  price_total: number;
  map_zone: MapZone | null;
  href: string;
}

interface MasterplanInteractiveMapProps {
  imageUrl: string;
  lots: MasterplanMapLot[];
  mode?: "view" | "edit";
  selectedLotId?: string | null;
  onSelectLot?: (lotId: string | null) => void;
  showSoldLots?: boolean;
  className?: string;
}

type DrawState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function MasterplanInteractiveMap({
  imageUrl,
  lots,
  mode = "view",
  selectedLotId = null,
  onSelectLot,
  showSoldLots = true,
  className,
}: MasterplanInteractiveMapProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draw, setDraw] = useState<DrawState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const visibleLots = useMemo(
    () => lots.filter((lot) => showSoldLots || lot.status !== "vendu"),
    [lots, showSoldLots]
  );

  const mappedLots = useMemo(
    () => visibleLots.filter((lot) => lot.map_zone),
    [visibleLots]
  );

  const hoveredLot = mappedLots.find((l) => l.id === hoveredId) ?? null;

  const previewRect = useMemo(() => {
    if (!draw) return null;
    return rectFromDrag(draw.startX, draw.startY, draw.currentX, draw.currentY);
  }, [draw]);

  const getNormalizedPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const imageX = (clientX - rect.left - pan.x) / scale;
      const imageY = (clientY - rect.top - pan.y) / scale;
      return {
        x: Math.min(1, Math.max(0, imageX / rect.width)),
        y: Math.min(1, Math.max(0, imageY / rect.height)),
      };
    },
    [pan.x, pan.y, scale]
  );

  const clampPan = useCallback(
    (nextPan: { x: number; y: number }, nextScale: number) => {
      const el = canvasRef.current;
      if (!el || nextScale <= 1) return { x: 0, y: 0 };
      const maxX = el.clientWidth * (nextScale - 1);
      const maxY = el.clientHeight * (nextScale - 1);
      return {
        x: Math.min(0, Math.max(-maxX, nextPan.x)),
        y: Math.min(0, Math.max(-maxY, nextPan.y)),
      };
    },
    []
  );

  const zoomBy = useCallback(
    (delta: number) => {
      setScale((prev) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
        if (next <= 1) setPan({ x: 0, y: 0 });
        else setPan((p) => clampPan(p, next));
        return next;
      });
    },
    [clampPan]
  );

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      zoomBy(delta);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const saveZone = async (lotId: string, zone: MapZone | null) => {
    setSaving(true);
    setError(null);
    const result = await updatePropertyMapZoneAction(lotId, zone);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element;
    const onZone = target.tagName.toLowerCase() === "polygon";

    if (mode === "edit" && tool === "select" && selectedLotId && !onZone) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setDraw({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (onZone) return;

    if (mode === "view" || tool === "pan" || (mode === "edit" && !selectedLotId)) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draw) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setDraw((d) => (d ? { ...d, currentX: pt.x, currentY: pt.y } : null));
      return;
    }

    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(clampPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }, scale));
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (draw && selectedLotId) {
      const zone = rectFromDrag(draw.startX, draw.startY, draw.currentX, draw.currentY);
      setDraw(null);
      if (zone) await saveZone(selectedLotId, zone);
      return;
    }

    panStart.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleZoneClick = (lot: MasterplanMapLot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "edit") {
      onSelectLot?.(lot.id);
      return;
    }
    router.push(lot.href);
  };

  const handleDeleteZone = async () => {
    if (!selectedLotId) return;
    await saveZone(selectedLotId, null);
    onSelectLot?.(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={() => zoomBy(0.25)} aria-label="Zoom avant">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => zoomBy(-0.25)} aria-label="Zoom arrière">
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetView} aria-label="Réinitialiser la vue">
            <Maximize2 className="h-4 w-4" />
          </Button>
          {mode === "edit" && (
            <>
              <Button
                type="button"
                size="sm"
                variant={tool === "select" ? "default" : "outline"}
                onClick={() => setTool("select")}
                className="gap-1.5"
              >
                <MousePointer2 className="h-4 w-4" />
                Zone
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tool === "pan" ? "default" : "outline"}
                onClick={() => setTool("pan")}
                className="gap-1.5"
              >
                <Hand className="h-4 w-4" />
                Déplacer
              </Button>
              {selectedLotId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 hover:text-red-700"
                  onClick={handleDeleteZone}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                  Effacer zone
                </Button>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {mappedLots.length}/{visibleLots.length} lot{visibleLots.length !== 1 ? "s" : ""} sur le plan
          {mode === "view" && " · molette pour zoomer · glisser pour naviguer"}
        </p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      {mode === "edit" && !selectedLotId && (
        <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          Sélectionnez un lot dans la liste, puis tracez un rectangle sur le plan pour le rendre cliquable.
        </p>
      )}

      <div
        ref={canvasRef}
        className="relative touch-none overflow-hidden rounded-2xl border border-slate-800/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl shadow-primary/10 ring-1 ring-white/10"
        style={{ minHeight: "min(70vh, 560px)" }}
      >
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "top left",
            width: "100%",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Plan de masse interactif"
            className="block w-full select-none"
            draggable={false}
          />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {mappedLots.map((lot) => {
              if (!lot.map_zone) return null;
              const colors = MAP_ZONE_STATUS_COLORS[lot.status];
              const isHovered = hoveredId === lot.id;
              const isSelected = selectedLotId === lot.id;
              const points = zoneToPercentPoints(lot.map_zone);

              return (
                <polygon
                  key={lot.id}
                  points={points}
                  fill={isHovered || isSelected ? colors.hover : colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 0.6 : 0.35}
                  vectorEffect="non-scaling-stroke"
                  className={cn(
                    "pointer-events-auto cursor-pointer transition-[fill,stroke-width] duration-200",
                    lot.status === "libre" && mode === "view" && "animate-pulse [animation-duration:3s]"
                  )}
                  onMouseEnter={() => setHoveredId(lot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => handleZoneClick(lot, e)}
                />
              );
            })}

            {previewRect && (
              <polygon
                points={zoneToPercentPoints(previewRect)}
                fill="rgba(99, 102, 241, 0.35)"
                stroke="#6366f1"
                strokeWidth={0.5}
                strokeDasharray="1 0.6"
              />
            )}
          </svg>

          {hoveredLot?.map_zone && mode === "view" && (
            <LotTooltip lot={hoveredLot} zone={hoveredLot.map_zone} />
          )}
        </div>

        {scale === 1 && mappedLots.length === 0 && mode === "view" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 p-6 text-center">
            <div className="max-w-sm rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <ZoomIn className="mx-auto mb-2 h-6 w-6 opacity-80" />
              Uploadez votre plan puis configurez les zones cliquables pour chaque lot.
            </div>
          </div>
        )}

        {saving && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white backdrop-blur">
            Enregistrement…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["libre", "reserve", "vendu"] as PropertyStatus[])
          .filter((s) => showSoldLots || s !== "vendu")
          .map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-sm ring-1 ring-black/10"
                style={{ backgroundColor: MAP_ZONE_STATUS_COLORS[status].fill }}
              />
              {PROPERTY_STATUS_LABELS[status]}
            </span>
          ))}
      </div>
    </div>
  );
}

function LotTooltip({ lot, zone }: { lot: MasterplanMapLot; zone: MapZone }) {
  const [cx, cy] = zoneCenter(zone);
  const { number, reference } = formatLotNumberReference(lot);

  return (
    <div
      className="pointer-events-none absolute z-30 min-w-[160px] max-w-[220px] -translate-x-1/2 -translate-y-full rounded-xl border border-white/20 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md"
      style={{
        left: `${cx * 100}%`,
        top: `${cy * 100}%`,
        marginTop: "-8px",
      }}
    >
      <p className="text-sm font-semibold text-slate-900">
        {number ?? lot.title}
        {reference && <span className="ml-1 font-normal text-slate-500">({reference})</span>}
      </p>
      <p className="mt-0.5 text-xs font-medium text-primary">{formatFCFA(lot.price_total)}</p>
      <p className="mt-1 text-xs text-slate-600">{PROPERTY_STATUS_LABELS[lot.status]}</p>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Cliquer pour ouvrir →
      </p>
    </div>
  );
}

interface MasterplanMapLotListProps {
  lots: MasterplanMapLot[];
  selectedLotId: string | null;
  onSelectLot: (id: string) => void;
}

export function MasterplanMapLotList({
  lots,
  selectedLotId,
  onSelectLot,
}: MasterplanMapLotListProps) {
  return (
    <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-xl border bg-muted/30 p-2">
      {lots.map((lot) => {
        const { number, reference } = formatLotNumberReference(lot);
        const hasZone = Boolean(lot.map_zone);
        return (
          <button
            key={lot.id}
            type="button"
            onClick={() => onSelectLot(lot.id)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedLotId === lot.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <span className="truncate font-medium">
              {number ?? lot.title}
              {reference && (
                <span className={cn("ml-1 text-xs", selectedLotId === lot.id ? "opacity-80" : "text-muted-foreground")}>
                  {reference}
                </span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                hasZone
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {hasZone ? "Sur plan" : "À placer"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
