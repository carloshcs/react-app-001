// src/maps-type/mind-map-1/engine.ts
import { ROOT_RING_RADIUS } from "../../config/layout";

export type Vec = { x: number; y: number };
export type Positions = Record<string, Vec>;
type Child = { id: string };

type ChildrenMap = Map<string, Child[]>;
type Depths = Map<string, number>;
type ParentOf = Map<string, string | null>;

export const mindMap1 = {
  id: "mind-map-1",
  name: "Mind Map 1",

  force: {
    repulsion: -900,
    velocityDecay: 0.82,
    alphaDecay: 0.035,
    alphaTarget: 0.06,
    centerStrength: 0.02,
    collidePadding: 8,
  },

  buildLinks({
    visibleIds,
    parentOf,
    depths,
    root,
  }: {
    visibleIds: string[];
    parentOf: ParentOf;
    depths: Depths;
    root: { id: string } | null | undefined;
  }) {
    if (!root) return [];
    const visible = new Set(visibleIds);
    const links: Array<{ source: string; target: string; distance: number; strength: number }> = [];

    for (const child of visibleIds) {
      const parent = parentOf.get(child);
      if (!parent) continue;
      if (!visible.has(parent)) continue;

      const d = depths.get(child) ?? 1;
      const distance = d === 1 ? 140 : d === 2 ? 110 : 100;
      const strength = 0.08;

      links.push({ source: parent, target: child, distance, strength });
    }
    return links;
  },

  seedRootPositions(
    prev: Positions,
    {
      rootId,
      childrenOf,
      visibleIds,
      sizes,
      worldCenter,
      expandedRoot,
    }: {
      rootId: string;
      childrenOf: ChildrenMap;
      visibleIds: string[];
      sizes: Record<string, number>;
      worldCenter: Vec;
      expandedRoot: boolean;
    }
  ) {
    const next: Positions = { ...prev };
    const rootSize = sizes[rootId] ?? 100;

    next[rootId] = {
      x: worldCenter.x - rootSize / 2,
      y: worldCenter.y - rootSize / 2,
    };

    if (expandedRoot) {
      const kids = (childrenOf.get(rootId) || []).filter((k) => visibleIds.includes(k.id));
      const n = Math.max(1, kids.length);
      for (let i = 0; i < n; i++) {
        const ch = kids[i];
        const s = sizes[ch.id] ?? 80;
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = worldCenter.x + Math.cos(a) * ROOT_RING_RADIUS - s / 2;
        const y = worldCenter.y + Math.sin(a) * ROOT_RING_RADIUS - s / 2;
        if (!next[ch.id]) next[ch.id] = { x, y };
      }
    }

    return next;
  },

  seedChildrenPositions(
    prev: Positions,
    {
      expanded,
      visibleIds,
      childrenOf,
      sizes,
    }: {
      expanded: Set<string>;
      visibleIds: string[];
      childrenOf: ChildrenMap;
      sizes: Record<string, number>;
    }
  ) {
    const next: Positions = { ...prev };

    visibleIds.forEach((pid) => {
      if (!expanded.has(pid)) return;
      const kids = (childrenOf.get(pid) || []).filter((k) => visibleIds.includes(k.id));
      const missing = kids.filter((k) => !next[k.id]);
      if (!missing.length) return;

      const sParent = sizes[pid] ?? 80;
      const pTopLeft = next[pid] ?? { x: 0, y: 0 };
      const pc = { x: pTopLeft.x + sParent / 2, y: pTopLeft.y + sParent / 2 };
      const pr = sParent / 2;
      const maxCr = Math.max(...missing.map((k) => (sizes[k.id] ?? 80) / 2), 30);
      const r = pr + maxCr + 50;

      const n = missing.length;
      for (let i = 0; i < n; i++) {
        const k = missing[i];
        const s = sizes[k.id] ?? 80;
        const a = (i / n) * 2 * Math.PI;
        next[k.id] = {
          x: pc.x + Math.cos(a) * r - s / 2,
          y: pc.y + Math.sin(a) * r - s / 2,
        };
      }
    });

    return next;
  },
};
