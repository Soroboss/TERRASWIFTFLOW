"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hand,
  MapPin,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Square,
  Trash2,
  Undo2,
  User,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePropertyMapZoneAction } from "@/lib/actions/masterplans";
import { formatLotNumberReference } from "@/lib/catalog-visibility";
import {
  MAP_ZONE_STATUS_COLORS,
  appendStrokePoint,
  polygonFromStroke,
  rectFromDrag,
  strokeToPercentPolyline,
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
  location_label: string | null;
  price_total: number;
  map_zone: MapZone | null;
  href: string;
  client_name?: string | null;
  agent_name?: string | null;
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

type EditTool = "pencil" | "rectangle" | "pan";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

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
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const wheelAccumRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);
  const lastWheelPointRef = useRef({ x: 0, y: 0 });

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draw, setDraw] = useState<DrawState>(null);
  const [pencilStroke, setPencilStroke] = useState<[number, number][]>([]);
  const [isPencilDrawing, setIsPencilDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<EditTool>("pencil");
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  scaleRef.current = scale;
  panRef.current = pan;

  const visibleLots = useMemo(
    () => lots.filter((lot) => showSoldLots || lot.status !== "vendu"),
    [lots, showSoldLots]
  );

  const mappedLots = useMemo(
    () => visibleLots.filter((lot) => lot.map_zone),
    [visibleLots]
  );

  const hoveredLot = mappedLots.find((l) => l.id === hoveredId) ?? null;
  const selectedLot = lots.find((l) => l.id === selectedLotId) ?? null;
  const selectedLotLabel = selectedLot
    ? formatLotNumberReference(selectedLot).number ?? selectedLot.title
    : null;

  const previewRect = useMemo(() => {
    if (!draw) return null;
    return rectFromDrag(draw.startX, draw.startY, draw.currentX, draw.currentY);
  }, [draw]);

  /** Coordonnées normalisées [0–1] par rapport au calque image (inclut pan/zoom via getBoundingClientRect). */
  const getNormalizedPoint = useCallback((clientX: number, clientY: number) => {
    const layer = imageLayerRef.current;
    if (!layer) return { x: 0, y: 0 };
    const rect = layer.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }, []);

  const clampPan = useCallback((nextPan: { x: number; y: number }, nextScale: number) => {
    const canvas = canvasRef.current;
    const layer = imageLayerRef.current;
    if (!canvas || !layer || nextScale <= 1) return { x: 0, y: 0 };

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    const contentW = layer.offsetWidth * nextScale;
    const contentH = layer.offsetHeight * nextScale;
    const maxX = Math.min(0, canvasW - contentW);
    const maxY = Math.min(0, canvasH - contentH);

    return {
      x: Math.min(0, Math.max(maxX, nextPan.x)),
      y: Math.min(0, Math.max(maxY, nextPan.y)),
    };
  }, []);

  const zoomAtPoint = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const prevScale = scaleRef.current;
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * factor));

      if (nextScale <= 1) {
        setScale(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const ratio = nextScale / prevScale;
      const nextPan = clampPan(
        {
          x: mx - (mx - panRef.current.x) * ratio,
          y: my - (my - panRef.current.y) * ratio,
        },
        nextScale
      );

      setScale(nextScale);
      setPan(nextPan);
    },
    [clampPan]
  );

  const zoomBy = useCallback(
    (delta: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 + delta);
    },
    [zoomAtPoint]
  );

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const flushWheelZoom = useCallback(() => {
    wheelRafRef.current = null;
    const delta = wheelAccumRef.current;
    wheelAccumRef.current = 0;
    if (Math.abs(delta) < 0.5) return;

    const factor = Math.exp(-delta * 0.0018);
    zoomAtPoint(lastWheelPointRef.current.x, lastWheelPointRef.current.y, factor);
  }, [zoomAtPoint]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      lastWheelPointRef.current = { x: e.clientX, y: e.clientY };
      wheelAccumRef.current += e.deltaY;
      if (wheelRafRef.current === null) {
        wheelRafRef.current = requestAnimationFrame(flushWheelZoom);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelRafRef.current !== null) {
        cancelAnimationFrame(wheelRafRef.current);
      }
    };
  }, [flushWheelZoom]);

  const clearPencilStroke = useCallback(() => {
    setPencilStroke([]);
    setIsPencilDrawing(false);
  }, []);

  useEffect(() => {
    clearPencilStroke();
    setDraw(null);
  }, [selectedLotId, tool, clearPencilStroke]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearPencilStroke();
        setDraw(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearPencilStroke]);

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

  const finishDrawing = async () => {
    if (!selectedLotId) return;

    if (tool === "rectangle" && draw) {
      const zone = rectFromDrag(draw.startX, draw.startY, draw.currentX, draw.currentY);
      setDraw(null);
      if (zone) await saveZone(selectedLotId, zone);
      return;
    }

    if (tool === "pencil" && pencilStroke.length >= 3) {
      const zone = polygonFromStroke(pencilStroke);
      clearPencilStroke();
      if (zone) await saveZone(selectedLotId, zone);
      return;
    }

    clearPencilStroke();
    setDraw(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element;
    const onZone =
      target.tagName.toLowerCase() === "polygon" ||
      Boolean(target.closest("[data-map-zone]"));

    if (mode === "edit" && tool === "pencil" && selectedLotId && !onZone) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setIsPencilDrawing(true);
      setPencilStroke([[pt.x, pt.y]]);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (mode === "edit" && tool === "rectangle" && selectedLotId && !onZone) {
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
    if (isPencilDrawing && tool === "pencil") {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      setPencilStroke((prev) => appendStrokePoint(prev, pt.x, pt.y));
      return;
    }

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
    if ((draw && tool === "rectangle") || (isPencilDrawing && tool === "pencil")) {
      await finishDrawing();
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
    }
  };

  const handleZoneNavigate = (lot: MasterplanMapLot, e: React.MouseEvent) => {
    if (mode !== "view") return;
    e.preventDefault();
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
          <Button type="button" size="sm" variant="outline" onClick={() => zoomBy(0.2)} aria-label="Zoom avant">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => zoomBy(-0.2)} aria-label="Zoom arrière">
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
                variant={tool === "pencil" ? "default" : "outline"}
                onClick={() => setTool("pencil")}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                Crayon
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tool === "rectangle" ? "default" : "outline"}
                onClick={() => setTool("rectangle")}
                className="gap-1.5"
              >
                <Square className="h-4 w-4" />
                Rectangle
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
              {(isPencilDrawing || pencilStroke.length > 0) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearPencilStroke}
                  className="gap-1.5"
                >
                  <Undo2 className="h-4 w-4" />
                  Annuler trait
                </Button>
              )}
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
          {mode === "edit" && tool === "pencil" && " · crayon : dessinez le contour du lot"}
          {mode === "edit" && tool === "rectangle" && " · tracez un rectangle"}
          {mode === "view" && " · molette fluide · glisser pour naviguer"}
        </p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      {mode === "edit" && !selectedLotId && (
        <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          Sélectionnez un lot dans la liste, puis dessinez son contour au <strong>crayon</strong> ou en
          rectangle sur le plan.
        </p>
      )}

      {mode === "edit" && selectedLotId && selectedLotLabel && (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          Lot en cours : <strong>{selectedLotLabel}</strong>
          {tool === "pencil"
            ? " — maintenez clic enfoncé et dessinez le contour de la parcelle"
            : " — cliquez-glissez pour tracer un rectangle"}
        </p>
      )}

      <div
        ref={canvasRef}
        className="relative touch-none overflow-hidden rounded-2xl border border-slate-800/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl shadow-primary/10 ring-1 ring-white/10"
        style={{ minHeight: "min(70vh, 560px)" }}
      >
        <div
          className={cn(
            "h-full min-h-[inherit] w-full select-none",
            mode === "edit" && (tool === "pencil" || tool === "rectangle") && selectedLotId
              ? "cursor-crosshair"
              : "cursor-grab active:cursor-grabbing"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: "top left",
              willChange: "transform",
            }}
            className="w-full"
          >
            <div ref={imageLayerRef} className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Plan de masse interactif"
                className="block w-full select-none"
                draggable={false}
              />

              <svg
                className="absolute inset-0 h-full w-full"
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

                  const polygonEl = (
                    <polygon
                      points={points}
                      fill={isHovered || isSelected ? colors.hover : colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? 0.55 : isHovered ? 0.45 : 0.32}
                      vectorEffect="non-scaling-stroke"
                      className={cn(
                        "cursor-pointer transition-[fill,stroke-width,opacity] duration-150 ease-out",
                        isHovered && "opacity-100",
                        !isHovered && lot.status === "libre" && "opacity-90"
                      )}
                      onMouseEnter={() => setHoveredId(lot.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={(e) => {
                        if (mode === "view") handleZoneNavigate(lot, e);
                        else handleZoneClick(lot, e);
                      }}
                    />
                  );

                  return (
                    <g key={lot.id} data-map-zone>
                      {polygonEl}
                      {(mode === "edit" || isHovered) && (
                        <LotZoneLabel lot={lot} zone={lot.map_zone} isSelected={isSelected || isHovered} />
                      )}
                    </g>
                  );
                })}

                {pencilStroke.length >= 2 && (
                  <>
                    <polyline
                      points={strokeToPercentPolyline(pencilStroke)}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth={0.55}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {pencilStroke.length >= 3 && (
                      <polygon
                        points={strokeToPercentPolyline(pencilStroke)}
                        fill="rgba(99, 102, 241, 0.25)"
                        stroke="#6366f1"
                        strokeWidth={0.4}
                        strokeDasharray="1 0.5"
                      />
                    )}
                  </>
                )}

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

              {hoveredLot?.map_zone && (
                <LotTooltip lot={hoveredLot} zone={hoveredLot.map_zone} mode={mode} />
              )}
            </div>
          </div>
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

function LotZoneLabel({
  lot,
  zone,
  isSelected,
}: {
  lot: MasterplanMapLot;
  zone: MapZone;
  isSelected: boolean;
}) {
  const [cx, cy] = zoneCenter(zone);
  const { number, reference } = formatLotNumberReference(lot);
  const label = number ?? lot.title?.slice(0, 8) ?? "Lot";

  return (
    <text
      x={cx * 100}
      y={cy * 100}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={isSelected ? 3 : 2.4}
      fontWeight={700}
      fill={isSelected ? "#1e3a8a" : "#ffffff"}
      stroke={isSelected ? "#ffffff" : "#0f172a"}
      strokeWidth={0.12}
      paintOrder="stroke"
      className="pointer-events-none select-none"
    >
      {reference ? label : label}
    </text>
  );
}

function LotTooltip({
  lot,
  zone,
  mode,
}: {
  lot: MasterplanMapLot;
  zone: MapZone;
  mode: "view" | "edit";
}) {
  const [cx, cy] = zoneCenter(zone);
  const { number, reference } = formatLotNumberReference(lot);
  const displayName = number ?? lot.title ?? "Lot";
  const hasOccupant = lot.status !== "libre" && Boolean(lot.client_name);

  return (
    <div
      className="pointer-events-none absolute z-30 min-w-[180px] max-w-[260px] -translate-x-1/2 -translate-y-full animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: `${cx * 100}%`,
        top: `${cy * 100}%`,
        marginTop: "-10px",
      }}
    >
      <div className="rounded-xl border border-white/25 bg-white/95 p-3 text-left shadow-2xl shadow-black/20 backdrop-blur-md">
        <p className="text-sm font-semibold leading-tight text-slate-900">
          {displayName}
          {reference && (
            <span className="ml-1 font-normal text-slate-500">· {reference}</span>
          )}
        </p>

        {lot.location_label && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{lot.location_label}</span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              lot.status === "libre" && "bg-emerald-100 text-emerald-800",
              lot.status === "reserve" && "bg-amber-100 text-amber-900",
              lot.status === "vendu" && "bg-red-100 text-red-800"
            )}
          >
            {PROPERTY_STATUS_LABELS[lot.status]}
          </span>
          <span className="text-xs font-medium text-primary">{formatFCFA(lot.price_total)}</span>
        </div>

        {hasOccupant && (
          <p className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-700">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              {lot.status === "vendu" ? "Acheté par" : "Réservé pour"}{" "}
              <strong>{lot.client_name}</strong>
              {lot.agent_name && (
                <span className="text-slate-500"> · agent {lot.agent_name}</span>
              )}
            </span>
          </p>
        )}

        {lot.status === "libre" && (
          <p className="mt-2 text-[10px] text-slate-500">Parcelle disponible à la vente</p>
        )}

        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {mode === "view" ? "Cliquer pour ouvrir →" : "Sélectionné au survol"}
        </p>
      </div>
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
                <span
                  className={cn(
                    "ml-1 text-xs",
                    selectedLotId === lot.id ? "opacity-80" : "text-muted-foreground"
                  )}
                >
                  {reference}
                </span>
              )}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                hasZone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
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
