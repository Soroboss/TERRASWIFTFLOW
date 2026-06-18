import type { MapZone, MapZonePolygon, MapZoneRect } from "@/types/database";

const MIN = 0;
const MAX = 1;
const MIN_RECT_SIZE = 0.008;

export function clamp01(value: number): number {
  return Math.min(MAX, Math.max(MIN, value));
}

export function parseMapZone(raw: unknown): MapZone | null {
  if (!raw || typeof raw !== "object") return null;

  const zone = raw as Record<string, unknown>;

  if (zone.type === "rect") {
    const x = Number(zone.x);
    const y = Number(zone.y);
    const w = Number(zone.w);
    const h = Number(zone.h);
    if (![x, y, w, h].every(Number.isFinite)) return null;
    if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE) return null;
    return {
      type: "rect",
      x: clamp01(x),
      y: clamp01(y),
      w: clamp01(w),
      h: clamp01(h),
    };
  }

  if (zone.type === "polygon" && Array.isArray(zone.points)) {
    const points = zone.points
      .map((p) => {
        if (!Array.isArray(p) || p.length < 2) return null;
        const x = Number(p[0]);
        const y = Number(p[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return [clamp01(x), clamp01(y)] as [number, number];
      })
      .filter((p): p is [number, number] => p !== null);

    if (points.length < 3) return null;
    return { type: "polygon", points };
  }

  return null;
}

export function rectFromDrag(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): MapZoneRect | null {
  const left = clamp01(Math.min(x1, x2));
  const top = clamp01(Math.min(y1, y2));
  const right = clamp01(Math.max(x1, x2));
  const bottom = clamp01(Math.max(y1, y2));
  const w = right - left;
  const h = bottom - top;
  if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE) return null;
  return { type: "rect", x: left, y: top, w, h };
}

const MIN_STROKE_POINT_GAP = 0.004;

export function polygonFromStroke(points: [number, number][]): MapZonePolygon | null {
  if (points.length < 3) return null;

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  if (w < MIN_RECT_SIZE || h < MIN_RECT_SIZE) return null;

  return {
    type: "polygon",
    points: points.map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number]),
  };
}

export function appendStrokePoint(
  points: [number, number][],
  x: number,
  y: number
): [number, number][] {
  const pt: [number, number] = [clamp01(x), clamp01(y)];
  const last = points[points.length - 1];
  if (!last) return [pt];
  const dist = Math.hypot(pt[0] - last[0], pt[1] - last[1]);
  if (dist < MIN_STROKE_POINT_GAP) return points;
  return [...points, pt];
}

export function strokeToPercentPolyline(points: [number, number][]): string {
  return points.map(([px, py]) => `${px * 100},${py * 100}`).join(" ");
}

export function zoneToPercentPoints(zone: MapZone): string {
  if (zone.type === "rect") {
    const { x, y, w, h } = zone;
    const pts = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
    return pts.map(([px, py]) => `${px * 100},${py * 100}`).join(" ");
  }
  return zone.points.map(([px, py]) => `${px * 100},${py * 100}`).join(" ");
}

export function zoneCenter(zone: MapZone): [number, number] {
  if (zone.type === "rect") {
    return [zone.x + zone.w / 2, zone.y + zone.h / 2];
  }
  const sum = zone.points.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y] as [number, number],
    [0, 0] as [number, number]
  );
  return [sum[0] / zone.points.length, sum[1] / zone.points.length];
}

export function normalizedPointFromEvent(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { x: number; y: number } {
  return {
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height),
  };
}

export const MAP_ZONE_STATUS_COLORS = {
  libre: { fill: "rgba(16, 185, 129, 0.42)", stroke: "#059669", hover: "rgba(16, 185, 129, 0.62)" },
  reserve: { fill: "rgba(245, 158, 11, 0.45)", stroke: "#d97706", hover: "rgba(245, 158, 11, 0.65)" },
  vendu: { fill: "rgba(239, 68, 68, 0.4)", stroke: "#dc2626", hover: "rgba(239, 68, 68, 0.58)" },
} as const;
