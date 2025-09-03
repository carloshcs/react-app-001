// src/config/layout.ts

export const ROOT_RING_RADIUS = 240;

export const OUTWARD_STEP = 140;

export const CHILD_ORBIT_BASE = 120;          // base child ring radius (centre-to-centre)
export const CHILD_ORBIT_PER_CHILD = 6;       // extra per child
export const CHILD_ORBIT_PER_DEPTH = 24;      // extra per depth
export const BRANCH_CLEARANCE = 30;           // extra safety gap

export const SPRING_MARGIN = 40;

// —— NEW: sector sizing (branch wedge) ——
// level-2 gets 80% of the gap to neighbours; deeper levels shrink by this factor per depth
export const SECTOR_SAFE_FRACTION = 0.8;
export const SECTOR_SHRINK       = 0.65;      // per additional depth (3+, 4+, …)
export const MIN_SECTOR_RAD      = (12 * Math.PI) / 180; // clamp at 12°

export const PHYSICS = {
  k: 0.11,
  damping: 0.88,
  centerPull: 0.0018,
  repulsionIdle: 100,
  repulsionWhileDrag: 0,
  collisionK: 0.35,
  padding: 6,
  dt: 0.016,
};

export const sizeForDepth = (d: number) => Math.max(56, 110 - d * 16);
