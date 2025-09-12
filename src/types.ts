// Global, shared types for the app

export interface NotionGraphNode {
  id: string;
  title?: string;
  name?: string;
  url?: string;
  kind?: string | null;
}

export type Vec = { x: number; y: number };

export type Positions = Record<string, Vec>;

export type Link = {
  source: string;
  target: string;
  distance: number;
  strength?: number;
};

export type ComboOption = { id: string; label: string };

export type Vel = { vx: number; vy: number };
export type VelMap = Map<string, Vel>;
export type PinMap = Map<string, Vec>;

/* ---- Layout engine contracts (shared) ---- */
export type BuildLinksArgs = {
  visibleIds: string[];
  parentOf: Map<string, string | null>;
  depths: Map<string, number>;
  root?: { id: string } | null;
};

export type SeedRootArgs = {
  rootId: string;
  childrenOf: Map<string, Array<{ id: string }>>;
  visibleIds: string[];
  sizes: Record<string, number>;
  worldCenter: Vec; // world-space center (px)
};

export type SeedChildrenArgs = {
  expanded: Set<string>;
  visibleIds: string[];
  childrenOf: Map<string, Array<{ id: string }>>;
  sizes: Record<string, number>;
};

export type ForceDefaults = {
  repulsion: number;
  velocityDecay: number;
  alphaDecay: number;
  alphaTarget: number;
  centerStrength: number;
  collidePadding: number;
};

export interface LayoutEngine {
  id: string;
  name: string;
  force: ForceDefaults;

  buildLinks(args: BuildLinksArgs): Link[];
  seedRootPositions(prev: Positions, args: SeedRootArgs): Positions;
  seedChildrenPositions(prev: Positions, args: SeedChildrenArgs): Positions;
}
