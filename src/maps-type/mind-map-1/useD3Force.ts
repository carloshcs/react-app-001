import { useEffect, useRef } from "react";
import * as d3 from "d3-force";

type Vec = { x: number; y: number };
type SizeMap = Record<string, number>;
type PosMap = Record<string, Vec>;
type Link = { source: string; target: string; distance: number; strength?: number };

/** Map-local defaults for Mind Map 1. Other maps will have their own file/wrapper. */
const DEFAULTS = {
  repulsion: -1000,
  collidePadding: 8,
  alphaDecay: 0.06,
  velocityDecay: 0.25, // only used when we create the sim first time
};

type BaseOpts = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  nodes: string[];
  links: Link[];
  sizes: SizeMap;
  positions: PosMap;            // world top-left
  pinned: Map<string, Vec>;     // world top-left
  onPositions: (next: PosMap) => void;

  /** Optional overrides (rare; wrapper usually supplies defaults) */
  repulsion?: number;
  collidePadding?: number;
  alphaDecay?: number;
  simKey?: number | string;
  velocities?: Map<string, { vx: number; vy: number }>;
};

/**
 * Generic d3-force hook (mind-map-1 flavor). You can call this directly,
 * but prefer the wrapper `useMindMap1Force` which injects map defaults.
 */
export function useD3ForceBase(opts: BaseOpts) {
  const {
    containerRef,
    nodes,
    links,
    sizes,
    positions,
    pinned,
    onPositions,
    repulsion = DEFAULTS.repulsion,
    collidePadding = DEFAULTS.collidePadding,
    alphaDecay = DEFAULTS.alphaDecay,
    simKey,
    velocities = new Map(),
  } = opts;

  const simRef = useRef<d3.Simulation<any, undefined> | null>(null);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width ?? window.innerWidth;
    const H = rect?.height ?? window.innerHeight;
    const cx = W / 2, cy = H / 2;

    // Prepare node objects (store CENTER coords in the sim; positions is TOP-LEFT in world)
    const nodeObjs = nodes.map((id) => {
      const s = Math.max(20, sizes[id] ?? 80);
      const r = s / 2;
      const p = positions[id] ?? { x: cx - r, y: cy - r };
      return { id, x: p.x + r, y: p.y + r, r };
    });

    // Prepare link objects
    const linkObjs = links.map((l) => ({
      source: l.source,
      target: l.target,
      distance: l.distance,
      strength: l.strength ?? 0.07,
    }));

    // Create or update simulation
    let sim = simRef.current;
    if (!sim) {
      sim = d3
        .forceSimulation(nodeObjs)
        .force("charge", d3.forceManyBody().strength(repulsion))
        .force("collide", d3.forceCollide().radius((d: any) => d.r + collidePadding))
        .force(
          "link",
          d3
            .forceLink(linkObjs)
            .id((d: any) => d.id)
            .distance((d: any) => d.distance)
            .strength((d: any) => d.strength)
        )
        .force("center", d3.forceCenter(cx, cy)) // keep graph centered
        .alphaDecay(0.09)                        // settle faster (matches your older feel)
        .velocityDecay(DEFAULTS.velocityDecay)   // initial friction
        .on("tick", () => {
          nodeObjs.forEach((node) => {
            if (pinned.has(node.id)) {
              const pin = pinned.get(node.id)!;
              node.x = pin.x + node.r;
              node.y = pin.y + node.r;
              node.vx = 0;
              node.vy = 0;
            }
            if (velocities.has(node.id)) {
              node.vx = velocities.get(node.id)!.vx;
              node.vy = velocities.get(node.id)!.vy;
            }
          });

          // Push TOP-LEFT world positions to React state
          const next: PosMap = {};
          nodeObjs.forEach((node) => {
            next[node.id] = { x: node.x - node.r, y: node.y - node.r };
          });
          onPositions(next);
        });

      simRef.current = sim;
    } else {
      sim.nodes(nodeObjs);
      (sim.force("link") as d3.ForceLink<any, any>).links(linkObjs);
      (sim.force("charge") as d3.ForceManyBody<any>).strength(repulsion);
      (sim.force("collide") as d3.ForceCollide<any>).radius((d: any) => d.r + collidePadding);
      // alphaDecay here is informational (d3 uses alpha + velocityDecay mostly); we keep your original
      sim.alpha(1).restart();
    }

    return () => {
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [
    containerRef,
    nodes.join(","), // structural
    links.map((l) => `${l.source}-${l.target}-${l.distance}`).join(","),

    
    // keep these stable when possible; ok as-is given app scale
    JSON.stringify(sizes),
    JSON.stringify(positions),
    JSON.stringify(Array.from(pinned.entries())),
    repulsion,
    collidePadding,
    alphaDecay,
    simKey,
    JSON.stringify(Array.from(velocities.entries())),
  ]);
}

/**
 * Map-specific wrapper with baked defaults.
 * App should import and call **this**, not the base, so App stays map-agnostic.
 */
export function useMindMap1Force(opts: Omit<BaseOpts, "repulsion" | "collidePadding" | "alphaDecay"> & {
  repulsion?: number;
  collidePadding?: number;
  alphaDecay?: number;
}) {
  // allow optional overrides per-call, but default to map-local constants
  return useD3ForceBase({
    ...opts,
    repulsion: opts.repulsion ?? DEFAULTS.repulsion,
    collidePadding: opts.collidePadding ?? DEFAULTS.collidePadding,
    alphaDecay: opts.alphaDecay ?? DEFAULTS.alphaDecay,
  });
}
