// src/config/layout.ts
// GEOMETRY ONLY (no physics here)

// — Rings & spacing —
export const ROOT_RING_RADIUS = 400;
export const OUTWARD_STEP = 140;

// — Child orbit (centre-to-centre) —
export const CHILD_ORBIT_BASE = 120;      // base child ring radius
export const CHILD_ORBIT_PER_CHILD = 6;   // + per child
export const CHILD_ORBIT_PER_DEPTH = 24;  // + per depth
export const BRANCH_CLEARANCE = 30;       // extra safety gap around branches

// — Additional clearances —
export const SPRING_MARGIN = 40;

// — Sector sizing (branch wedge) —
export const SECTOR_SAFE_FRACTION = 0.8;                       // level-2 keeps 80% of neighbour gap
export const SECTOR_SHRINK = 0.65;                             // shrink per deeper level (3+, 4+, …)
export const MIN_SECTOR_RAD = (12 * Math.PI) / 180;            // clamp at 12°

// Node diameter (WORLD units) per depth
export function sizeForDepth(depth: number): number {
  if (depth <= 0) return 240; // root bigger
  if (depth === 1) return 180;
  if (depth === 2) return 140;
  if (depth === 3) return 100;
  // gently taper after 3
  return Math.max(78, 104 - depth * 6);
}

/** Convenience: compute a child ring radius for a given childCount & depth. */
export function childOrbitRadius(childCount: number, depth: number): number {
  const extra =
    CHILD_ORBIT_PER_CHILD * Math.max(0, childCount - 1) +
    CHILD_ORBIT_PER_DEPTH * Math.max(0, depth - 1);
  return CHILD_ORBIT_BASE + extra + BRANCH_CLEARANCE;
}

/**
 * Convenience: compute safe angular sector (radians) for a branch at given depth,
 * given a base neighbour gap in radians.
 */
export function sectorRadians(baseNeighbourGapRad: number, depth: number): number {
  const safe =
    baseNeighbourGapRad *
    SECTOR_SAFE_FRACTION *
    Math.pow(SECTOR_SHRINK, Math.max(0, depth - 2)); // shrink from depth 3+
  return Math.max(MIN_SECTOR_RAD, safe);
}
