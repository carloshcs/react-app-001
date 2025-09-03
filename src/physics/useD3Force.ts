import { MutableRefObject, useEffect, useRef } from "react";
import { forceSimulation, forceManyBody, forceLink, forceCollide, forceCenter, Simulation } from "d3-force";

type Vec = { x: number; y: number };
type SizeMap = Record<string, number>;
type PosMap  = Record<string, Vec>;
type Link    = { source: string; target: string; distance: number; strength?: number };

export function useD3Force(opts: {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  nodes: string[];
  links: Link[];
  sizes: SizeMap;
  positions: PosMap;
  pinned: Map<string, Vec>;
  locked?: Record<string, Vec>;
  onPositions: (next: PosMap) => void;
  repulsion?: number;
  collidePadding?: number;
  alphaDecay?: number;
}) {
  const {
    containerRef, nodes, links, sizes, positions, pinned, locked = {},
    onPositions, repulsion = -1000, collidePadding = 8, alphaDecay = 0.06,
  } = opts;

  const simRef = useRef<Simulation<any, undefined> | null>(null);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width ?? window.innerWidth;
    const H = rect?.height ?? window.innerHeight;
    const cx = W / 2, cy = H / 2;

    const nodeObjs = nodes.map((id) => {
      const s = Math.max(20, sizes[id] ?? 80);
      const r = s / 2;
      const p = positions[id] ?? { x: cx - r, y: cy - r };
      return { id, x: p.x + r, y: p.y + r, vx: 0, vy: 0, r };
    });

    const linkObjs = links.map((l) => ({
      source: l.source, target: l.target, distance: l.distance, strength: l.strength ?? 0.07,
    }));

    let sim = simRef.current;

    if (!sim) {
      sim = forceSimulation(nodeObjs)
        .force("charge",  forceManyBody().strength(repulsion))
        .force("link",    forceLink(linkObjs).id((d: any) => d.id)
                           .distance((d: any) => d.distance).strength((d: any) => d.strength))
        .force("collide", forceCollide<any>().radius((d) => d.r + collidePadding).iterations(2))
        .force("center",  forceCenter(cx, cy))
        .alphaDecay(alphaDecay);

      sim.on("tick", () => {
        const out: PosMap = {};
        (sim!.nodes() as any[]).forEach((n) => {
          const s = Math.max(20, sizes[n.id] ?? 80);
          const r = s / 2;
          out[n.id] = { x: n.x - r, y: n.y - r };
        });
        onPositions(out);
      });

      simRef.current = sim;
    } else {
      sim.nodes(nodeObjs as any);
      (sim.force("link") as any).links(linkObjs);
      (sim.force("center") as any).x(cx).y(cy);
    }

    const pinMap = new Map<string, Vec>(pinned);
    Object.entries(locked).forEach(([id, p]) => pinMap.set(id, p));
    (sim.nodes() as any[]).forEach((n) => {
      const p = pinMap.get(n.id);
      if (p) {
        const s = Math.max(20, sizes[n.id] ?? 80);
        n.fx = p.x + s / 2; n.fy = p.y + s / 2;
      } else { n.fx = null; n.fy = null; }
    });

    sim.alpha(0.7).restart();

    return () => { sim?.stop(); simRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    containerRef, nodes.join(","), links.map(l => `${l.source}-${l.target}-${l.distance}`).join(","),
    JSON.stringify(sizes), JSON.stringify(positions),
    JSON.stringify(Array.from(pinned.entries())), JSON.stringify(locked),
    repulsion, collidePadding, alphaDecay,
  ]);
}
