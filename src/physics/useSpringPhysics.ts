// src/physics/useSpringPhysics.ts
import { MutableRefObject, useEffect, useRef } from "react";

type Vec = { x: number; y: number };
type Edge = { a: string; b: string; rest: number; k?: number };
type SizeMap = Record<string, number>;
type PosMap  = Record<string, Vec>;
type Anchors = Record<string, { x: number; y: number; k?: number }>;

export function useSpringPhysics(opts: {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  nodes: string[];
  edges: Edge[];
  sizes: SizeMap;
  positions: PosMap;
  pinned: Map<string, Vec>;
  anchors?: Anchors;
  onPositions: (next: PosMap) => void;
  k?: number;
  damping?: number;
  centerPull?: number;
  repulsion?: number;
  dt?: number;
  collisionK?: number;
  padding?: number;
}) {
  const {
    containerRef, nodes, edges, sizes, positions, pinned, anchors = {},
    onPositions,
    k = 0.08, damping = 0.9, centerPull = 0.002, repulsion = 0,
    dt = 0.016, collisionK = 0.35, padding = 6,
  } = opts;

  const velRef = useRef<Map<string, Vec>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const v = velRef.current;
    for (const id of Array.from(v.keys())) if (!nodes.includes(id)) v.delete(id);
    nodes.forEach(id => { if (!v.has(id)) v.set(id, { x: 0, y: 0 }); });
  }, [nodes]);

  useEffect(() => {
    const tick = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const W = rect?.width ?? window.innerWidth;
      const H = rect?.height ?? window.innerHeight;
      const cx = W / 2, cy = H / 2;

      const pos: PosMap = { ...positions };
      const vel = velRef.current;
      const Fx = new Map<string, number>(), Fy = new Map<string, number>();
      nodes.forEach(id => { Fx.set(id, 0); Fy.set(id, 0); });

      // anchors
      nodes.forEach(id => {
        const a = anchors[id]; if (!a) return;
        const p = pos[id];     if (!p) return;
        const kk = a.k ?? 0.06;
        Fx.set(id, Fx.get(id)! + kk * (a.x - p.x));
        Fy.set(id, Fy.get(id)! + kk * (a.y - p.y));
      });

      // long-range repulsion
      if (repulsion > 0) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const pa = pos[a], pb = pos[b]; if (!pa || !pb) continue;
            let dx = pb.x - pa.x, dy = pb.y - pa.y;
            let d2 = dx*dx + dy*dy; if (d2 < 1e-4) { dx = 0.01; dy = 0.01; d2 = dx*dx + dy*dy; }
            const inv = 1 / Math.sqrt(d2);
            const f = repulsion * inv * inv;
            const fx = -f * dx * inv, fy = -f * dy * inv;
            Fx.set(a, Fx.get(a)! + fx); Fy.set(a, Fy.get(a)! + fy);
            Fx.set(b, Fx.get(b)! - fx); Fy.set(b, Fy.get(b)! - fy);
          }
        }
      }

      // springs
      edges.forEach(e => {
        const pa = pos[e.a], pb = pos[e.b]; if (!pa || !pb) return;
        let dx = pb.x - pa.x, dy = pb.y - pa.y;
        let d  = Math.hypot(dx, dy); if (d < 1e-4) { dx = 0.01; dy = 0.01; d = Math.hypot(dx, dy); }
        const kk = e.k ?? k;
        const stretch = d - e.rest;
        const ux = dx / d, uy = dy / d;
        const f = kk * stretch, fx = f * ux, fy = f * uy;
        Fx.set(e.a, Fx.get(e.a)! + fx); Fy.set(e.a, Fy.get(e.a)! + fy);
        Fx.set(e.b, Fx.get(e.b)! - fx); Fy.set(e.b, Fy.get(e.b)! - fy);
      });

      // gentle centre pull (keeps graph in view)
      nodes.forEach(id => {
        const p = pos[id]; if (!p) return;
        Fx.set(id, Fx.get(id)! + centerPull * (cx - p.x));
        Fy.set(id, Fy.get(id)! + centerPull * (cy - p.y));
      });

      // integrate + bounds
      nodes.forEach(id => {
        const size = Math.max(20, sizes[id] ?? 80);
        const v  = vel.get(id) ?? { x: 0, y: 0 };
        const pin = pinned.get(id);
        if (pin) {
          pos[id] = { x: pin.x, y: pin.y };
          v.x = 0; v.y = 0; vel.set(id, v);
        } else {
          const ax = Fx.get(id)!; const ay = Fy.get(id)!;
          v.x = (v.x + ax * dt) * damping;
          v.y = (v.y + ay * dt) * damping;
          let nx = (pos[id]?.x ?? cx) + v.x;
          let ny = (pos[id]?.y ?? cy) + v.y;
          nx = Math.min(Math.max(nx, 0), Math.max(0, W - size));
          ny = Math.min(Math.max(ny, 0), Math.max(0, H - size));
          pos[id] = { x: nx, y: ny };
          vel.set(id, v);
        }
      });

      // collision resolve (soft)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const pa = pos[a], pb = pos[b]; if (!pa || !pb) continue;
          const ra = Math.max(10, (sizes[a] ?? 80) / 2);
          const rb = Math.max(10, (sizes[b] ?? 80) / 2);
          const min = ra + rb + padding;
          let dx = pb.x - pa.x, dy = pb.y - pa.y;
          let d  = Math.hypot(dx, dy); if (d < 1e-6) { dx = 0.01; dy = 0.01; d = Math.hypot(dx, dy); }
          if (d < min) {
            const ov = min - d;
            const ux = dx / d, uy = dy / d;
            const shareA = pinned.has(a) ? 0 : 0.5;
            const shareB = pinned.has(b) ? 0 : 0.5;
            const sum = shareA + shareB || 1;
            const moveA = ov * (shareA / sum);
            const moveB = ov * (shareB / sum);
            const sA = Math.max(20, sizes[a] ?? 80);
            const sB = Math.max(20, sizes[b] ?? 80);
            pos[a] = { x: Math.min(Math.max(pa.x - ux * moveA, 0), Math.max(0, W - sA)),
                       y: Math.min(Math.max(pa.y - uy * moveA, 0), Math.max(0, H - sA)) };
            pos[b] = { x: Math.min(Math.max(pb.x + ux * moveB, 0), Math.max(0, W - sB)),
                       y: Math.min(Math.max(pb.y + uy * moveB, 0), Math.max(0, H - sB)) };
          }
        }
      }

      onPositions(pos);
      rafRef.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafRef.current ?? 0);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current ?? 0);
  }, [
    containerRef,
    nodes.join(","),
    edges.map(e => `${e.a}-${e.b}-${e.rest}`).join(","),
    JSON.stringify(sizes),
    JSON.stringify(positions),
    JSON.stringify(Array.from(pinned.entries())),
    JSON.stringify(anchors),
    k, damping, centerPull, repulsion, dt, collisionK, padding,
  ]);
}
