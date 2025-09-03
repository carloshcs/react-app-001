/**
 * Computes equally spaced positions on a circle around a centre point. The
 * returned coordinates are relative to the top‑left of each node (so you
 * may need to offset by half the node diameter when using as centres).
 *
 * @param cx X coordinate of the circle centre
 * @param cy Y coordinate of the circle centre
 * @param count Number of positions to generate
 * @param radius Distance from the centre to each point
 */
export function radialPositions(
  cx: number,
  cy: number,
  count: number,
  radius: number,
): { x: number; y: number }[] {
  const results: { x: number; y: number }[] = [];
  if (count === 0) return results;
  const step = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    const angle = step * i;
    results.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return results;
}

/**
 * Clamp a node's top‑left coordinate so it remains fully inside a rectangular
 * container. This prevents nodes from being positioned off–screen.
 *
 * @param x Proposed X position
 * @param y Proposed Y position
 * @param size Diameter of the node
 * @param width Container width
 * @param height Container height
 */
export function clampToBox(
  x: number,
  y: number,
  size: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const nx = Math.min(Math.max(x, 0), Math.max(0, width - size));
  const ny = Math.min(Math.max(y, 0), Math.max(0, height - size));
  return { x: nx, y: ny };
}