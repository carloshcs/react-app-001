// src/layout/spokes.ts
import { NotionNode } from "../types";
import {
  ROOT_RING_RADIUS, OUTWARD_STEP,
  CHILD_ORBIT_BASE, CHILD_ORBIT_PER_CHILD, CHILD_ORBIT_PER_DEPTH,
  BRANCH_CLEARANCE, SPRING_MARGIN, sizeForDepth,
  SECTOR_SAFE_FRACTION, SECTOR_SHRINK, MIN_SECTOR_RAD,
} from "../config/layout";

export type ChildrenMap = Map<string, NotionNode[]>;
export type AnchorMap   = Record<string, { x: number; y: number; k?: number }>;
export type Pos         = { x: number; y: number };

// ---------- basic helpers ----------
export function computeDepths(roots: NotionNode[], children: ChildrenMap) {
  const depth = new Map<string, number>();
  const q: string[] = [];
  roots.forEach(r => { depth.set(r.id, 0); q.push(r.id); });
  while (q.length) {
    const id = q.shift()!;
    const d = depth.get(id) || 0;
    (children.get(id) || []).forEach(c => {
      if (!depth.has(c.id)) { depth.set(c.id, d + 1); q.push(c.id); }
    });
  }
  return depth;
}

export function buildParentMap(all: NotionNode[]) {
  const m = new Map<string, string | null>();
  all.forEach(n => m.set(n.id, n.parent_id ?? null));
  return m;
}

export function computeVisible(
  roots: NotionNode[], children: ChildrenMap, expanded: Set<string>
) {
  const out: string[] = [];
  const q = roots.map(r => r.id);
  const seen = new Set<string>();
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id); out.push(id);
    if (expanded.has(id)) (children.get(id) || []).forEach(k => q.push(k.id));
  }
  return out;
}

// ---------- ring/sector logic ----------
export function computeLevel2Angles(
  roots: NotionNode[],
  children: ChildrenMap,
  orderBy: (a: NotionNode, b: NotionNode) => number = (a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
) {
  const angle: Record<string, number> = {};
  if (roots.length !== 1) return angle;
  const kids = [...(children.get(roots[0].id) || [])].sort(orderBy);
  const n = Math.max(1, kids.length);
  for (let i = 0; i < n; i++) {
    angle[kids[i].id] = -Math.PI / 2 + (i * 2 * Math.PI) / n; // even ring, start at top
  }
  return angle;
}

export function computeSpokeAngles(
  visibleIds: string[],
  roots: NotionNode[],
  children: ChildrenMap,
  parentOf: Map<string, string | null>,
  getCenter: (id: string) => { x: number; y: number },
  cx: number, cy: number,
  level2Angles?: Record<string, number>
) {
  const angle: Record<string, number> = { ...(level2Angles || {}) };

  // infer level-2 if not preset
  roots.forEach(r => {
    (children.get(r.id) || []).forEach(k => {
      if (angle[k.id] !== undefined) return;
      const c = getCenter(k.id);
      angle[k.id] = Math.atan2(c.y - cy, c.x - cx);
    });
  });

  // deeper nodes inherit their branch angle
  const getAngle = (id: string): number => {
    if (angle[id] !== undefined) return angle[id];
    let p = parentOf.get(id);
    while (p) {
      if (angle[p] !== undefined) return (angle[id] = angle[p]!);
      p = parentOf.get(p) ?? null;
    }
    const c = getCenter(id);
    angle[id] = Math.atan2(c.y - cy, c.x - cx);
    return angle[id];
  };

  visibleIds.forEach(id => getAngle(id));
  return angle;
}

// Sector widths for ALL depths (level-2 gets 80% of its neighbour gap; deeper shrink)
export function computeSectorHalfAnglesAll(
  visibleIds: string[],
  roots: NotionNode[],
  children: ChildrenMap,
  depths: Map<string, number>
) {
  let baseHalf = Math.PI / 6; // 30° fallback
  if (roots.length === 1) {
    const n = Math.max(1, (children.get(roots[0].id) || []).length);
    baseHalf = (Math.PI / n) * SECTOR_SAFE_FRACTION; // e.g., 80% of the gap
  }
  const m: Record<string, number> = {};
  visibleIds.forEach(id => {
    const d = depths.get(id) ?? 0;
    if (d === 0) return; // root has no sector
    const shrinkPow = Math.max(0, d - 1);
    const half = Math.max(MIN_SECTOR_RAD, baseHalf * Math.pow(SECTOR_SHRINK, shrinkPow));
    m[id] = half;
  });
  return m;
}

// required child ring radius for a parent (centre-to-centre)
export function childOrbitRadius(
  parentId: string,
  depths: Map<string, number>,
  sizes: Record<string, number>,
  children: ChildrenMap
) {
  const d = depths.get(parentId) ?? 0;
  const kids = children.get(parentId) || [];
  if (!kids.length) return 0;
  const parentR = (sizes[parentId] ?? 80) / 2;
  const maxChildR = kids.reduce((m, k) => Math.max(m, (sizes[k.id] ?? 80) / 2), 30);
  const base = Math.max(parentR + maxChildR + SPRING_MARGIN, CHILD_ORBIT_BASE + d * CHILD_ORBIT_PER_DEPTH);
  const withCount = base + Math.max(0, kids.length - 6) * CHILD_ORBIT_PER_CHILD;
  return withCount;
}

// even placement inside each branch sector (children ring)
export function seedChildrenOnSector(params: {
  expanded: Set<string>;
  children: ChildrenMap;
  positions: Record<string, Pos>;
  sizes: Record<string, number>;
  depths: Map<string, number>;
  spokeAngle: Record<string, number>;
  sectorHalfAngle: Record<string, number>;
  getCenter: (id: string) => { x: number; y: number };
}) {
  const { expanded, children, positions, sizes, depths, spokeAngle, sectorHalfAngle, getCenter } = params;
  const next: Record<string, Pos> = {};
  expanded.forEach(parentId => {
    const kids = children.get(parentId) || [];
    if (!kids.length) return;
    const pc = getCenter(parentId);
    const r  = childOrbitRadius(parentId, depths, sizes, children);
    const n  = Math.max(1, kids.length);
    const A  = Math.max(MIN_SECTOR_RAD, sectorHalfAngle[parentId] ?? Math.PI);
    for (let i = 0; i < n; i++) {
      const ch = kids[i];
      if (positions[ch.id]) continue;
      const s  = sizes[ch.id] ?? 80;
      const frac = (n === 1) ? 0 : (i / (n - 1)) * 2 - 1; // [-1..1]
      const a = spokeAngle[parentId] + frac * A;
      const cx = pc.x + Math.cos(a) * r;
      const cy = pc.y + Math.sin(a) * r;
      next[ch.id] = { x: cx - s / 2, y: cy - s / 2 };
    }
  });
  return next;
}

// ---------- anchors (this is where the “ramification” happens) ----------
export function buildAnchors(params: {
  visibleIds: string[];
  depths: Map<string, number>;
  sizes: Record<string, number>;
  positions: Record<string, Pos>;
  expanded: Set<string>;
  spokeAngle: Record<string, number>;
  cx: number; cy: number;
  roots: NotionNode[];
  locked: Record<string, Pos>;
  children: ChildrenMap;
}) {
  const {
    visibleIds, depths, sizes, positions, expanded, spokeAngle,
    cx, cy, roots, locked, children
  } = params;

  const A: AnchorMap = {};
  const visibleSet = new Set(visibleIds);

  // honour drops
  Object.entries(locked).forEach(([id, p]) => { A[id] = { x: p.x, y: p.y, k: 0.12 }; });

  // root at centre (angle/radius are handled by drag/lock)
  if (roots.length === 1) {
    const s = sizes[roots[0].id] ?? sizeForDepth(0);
    A[roots[0].id] = { x: cx - s / 2, y: cy - s / 2, k: 0.12 };
  }

  const maxChildRadius = (parentId: string) =>
    (children.get(parentId) || []).reduce((m, k) => Math.max(m, (sizes[k.id] ?? 80) / 2), 0);

  // parents: keep level-2 on the main ring; move any expanded parent outward enough
  for (const id of visibleIds) {
    if (locked[id]) continue;
    const d = depths.get(id) ?? 0;
    const s = sizes[id] ?? 80;
    const ang = spokeAngle[id];

    if (d === 1) {
      let targetR = ROOT_RING_RADIUS;
      if (expanded.has(id)) {
        const rKids     = childOrbitRadius(id, depths, sizes, children);
        const rChildMax = maxChildRadius(id); // whole child circle
        // push the *parent* so that its child ring outer edge clears the level-2 ring
        targetR = ROOT_RING_RADIUS + rKids + rChildMax + BRANCH_CLEARANCE;
      }
      const tx = cx + Math.cos(ang) * targetR - s / 2;
      const ty = cy + Math.sin(ang) * targetR - s / 2;
      A[id] = { x: tx, y: ty, k: expanded.has(id) ? 0.12 : 0.08 };
    } else if (d > 1 && expanded.has(id)) {
      // deeper parent must move outward so its kids don't invade its current orbit
      const pC = positions[id]
        ? { x: positions[id].x + s / 2, y: positions[id].y + s / 2 }
        : { x: cx, y: cy };
      const rNow  = Math.hypot(pC.x - cx, pC.y - cy);
      const rKids = childOrbitRadius(id, depths, sizes, children);
      const rMax  = maxChildRadius(id);
      const targetR = rNow + rKids + rMax + BRANCH_CLEARANCE + OUTWARD_STEP * 0.0;
      const tx = cx + Math.cos(ang) * targetR - s / 2;
      const ty = cy + Math.sin(ang) * targetR - s / 2;
      A[id] = { x: tx, y: ty, k: 0.1 };
    }
  }

  // child ring-anchors for every expanded parent (keep kids on their ring)
  expanded.forEach(parentId => {
    const kids = children.get(parentId) || [];
    if (!kids.length) return;

    const pSize = sizes[parentId] ?? 80;
    const pPos  = positions[parentId] ?? { x: cx - pSize / 2, y: cy - pSize / 2 };
    const pC    = { x: pPos.x + pSize / 2, y: pPos.y + pSize / 2 };
    const rKids = childOrbitRadius(parentId, depths, sizes, children);
    const kChild = 0.06; // gentle ring pull

    for (const k of kids) {
      const idk = k.id;
      if (!visibleSet.has(idk) || locked[idk]) continue;

      const sChild = sizes[idk] ?? 80;
      // keep current azimuth around the parent so user-drag order is preserved
      const cC = positions[idk]
        ? { x: positions[idk].x + sChild / 2, y: positions[idk].y + sChild / 2 }
        : pC;
      const theta = Math.atan2(cC.y - pC.y, cC.x - pC.x);

      const tx = pC.x + Math.cos(theta) * rKids - sChild / 2;
      const ty = pC.y + Math.sin(theta) * rKids - sChild / 2;

      if (!A[idk]) A[idk] = { x: tx, y: ty, k: kChild };
      else {
        const prev = A[idk];
        A[idk] = { x: (prev.x + tx) / 2, y: (prev.y + ty) / 2, k: Math.max(prev.k ?? kChild, kChild) };
      }
    }
  });

  return A;
}
