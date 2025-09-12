// src/lib/coords.ts
import type { Vec } from "../types";

/** World (simulation) -> Screen (px) */
export const worldToScreen = (p: Vec, pan: Vec, scale: number): Vec => ({
  x: pan.x + p.x * scale,
  y: pan.y + p.y * scale,
});

/** Size in world units -> screen px (no CSS scale used) */
export const sizeToScreen = (s: number, scale: number) => Math.max(1, s * scale);

/** Screen client coords -> World coords (center-based) */
export const clientToWorld = (
  clientX: number,
  clientY: number,
  containerRect: DOMRect | null,
  pan: Vec,
  scale: number
): Vec => {
  const left = containerRect?.left ?? 0;
  const top = containerRect?.top ?? 0;
  const sx = clientX - left;
  const sy = clientY - top;
  return { x: (sx - pan.x) / scale, y: (sy - pan.y) / scale };
};

/** Compute new {scale, pan} to zoom at a screen point (client coords). */
export const computeZoomAt = (
  pan: Vec,
  scale: number,
  factor: number,
  clientX: number,
  clientY: number,
  containerRect: DOMRect | null
): { scale: number; pan: Vec } => {
  const left = containerRect?.left ?? 0;
  const top = containerRect?.top ?? 0;
  const screenX = clientX - left;
  const screenY = clientY - top;

  const worldX = (screenX - pan.x) / scale;
  const worldY = (screenY - pan.y) / scale;

  const newScale = scale * factor;
  const newPan: Vec = {
    x: screenX - worldX * newScale,
    y: screenY - worldY * newScale,
  };
  return { scale: newScale, pan: newPan };
};
