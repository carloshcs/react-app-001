import { useEffect, useRef } from "react";
import * as d3 from "d3-force";

type Vec = { x: number; y: number };
type SizeMap = Record<string, number>;
type PosMap = Record<string, Vec>;
type Link = { source: string; target: string; distance: number; strength?: number };

export function useD3Force(opts: {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  nodes: string[];
  links: Link[];
  sizes: SizeMap;
  positions: PosMap;
  pinned: Map<string, Vec>;
  onPositions: (next: PosMap) => void;
  repulsion?: number;
  collidePadding?: number;
  alphaDecay?: number;
  simKey?: number;
  velocities?: Map<string, { vx: number; vy: number }>;
}) {
  const {
    containerRef, nodes, links, sizes, positions, pinned,
    onPositions, repulsion = -1000, collidePadding = 8, alphaDecay = 0.06, simKey,
    velocities = new Map(),
  } = opts;

  const simRef = useRef<d3.Simulation<any, undefined> | null>(null);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width ?? window.innerWidth;
    const H = rect?.height ?? window.innerHeight;
    const cx = W / 2, cy = H / 2;

    // Prepare node objects
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
      sim = d3.forceSimulation(nodeObjs)
        .force("charge", d3.forceManyBody().strength(repulsion))
        .force("collide", d3.forceCollide().radius((d: any) => d.r + collidePadding))
        .force("link", d3.forceLink(linkObjs).id((d: any) => d.id).distance((d: any) => d.distance).strength((d: any) => d.strength))
        .force("center", d3.forceCenter(cx, cy)) // <-- keep graph centered
        .alphaDecay(0.09) // <-- settle faster
        .velocityDecay(0.25) // <-- high friction for first-level nodes
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
          // Update positions in React state
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
      sim.force("charge")?.strength(repulsion);
      sim.force("collide")?.radius((d: any) => d.r + collidePadding);
      sim.alpha(1).restart();
    }

    return () => {
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [
    containerRef,
    nodes.join(","),
    links.map(l => `${l.source}-${l.target}-${l.distance}`).join(","),
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