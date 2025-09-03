import React, { useEffect, useMemo, useRef, useState } from "react";
import rawData from "./notion_data.json";
import { NotionNode } from "./types";
import { parse } from "./data/parse";
import { NodeItem } from "./components/NodeItem";
import { sizeForDepth, ROOT_RING_RADIUS } from "./config/layout";
import { useD3Force } from "./physics/useD3Force";

type RawShape = { nodes: NotionNode[] };

const OVERLAY_PAD = 4000; // generous padding (px) around the stage


export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ------- zoom + pan on the stage -------
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });
  const clampScale = (s: number) => Math.min(3, Math.max(0.4, s));

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const screenX = clientX - left, screenY = clientY - top;
    const worldX = (screenX - pan.x) / scale, worldY = (screenY - pan.y) / scale;
    const newScale = clampScale(scale * factor);
    setScale(newScale);
    setPan({ x: screenX - worldX * newScale, y: screenY - worldY * newScale });
  };
  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (e.ctrlKey || Math.abs(e.deltaY) > 40) {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
    }
  };
  const beginPan: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // ignore drags that start on a node
    const target = e.target as HTMLElement;
    if (target.closest(".node-ball")) return;
    setIsPanning(true);
    panStart.current = { ...pan };
    pointerStart.current = { x: e.clientX, y: e.clientY };
    const move = (ev: MouseEvent) =>
      setPan({ x: panStart.current.x + (ev.clientX - pointerStart.current.x),
               y: panStart.current.y + (ev.clientY - pointerStart.current.y) });
    const up = () => {
      setIsPanning(false);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ------- data -------
  const data = (rawData as RawShape).nodes;
  const { byId, children, roots } = useMemo(() => parse(data), [data]);
  const root = roots[0];

  // depths (root=0)
  const depths = useMemo(() => {
    const d = new Map<string, number>();
    const q: string[] = [];
    if (root) { d.set(root.id, 0); q.push(root.id); }
    while (q.length) {
      const pid = q.shift()!;
      const pd = d.get(pid) ?? 0;
      (children.get(pid) || []).forEach((ch) => {
        if (!d.has(ch.id)) { d.set(ch.id, pd + 1); q.push(ch.id); }
      });
    }
    return d;
  }, [root, children]);

  // expand/collapse
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  // visible nodes: root + level-2 always; deeper if parent expanded
  const level2 = useMemo(() => (root ? children.get(root.id) || [] : []), [children, root]);
  const visibleIds = useMemo(() => {
    if (!root) return [];
    const vis = new Set<string>([root.id, ...level2.map((n) => n.id)]);
    const q = [root.id, ...level2.map((n) => n.id)];
    while (q.length) {
      const id = q.shift()!;
      if (!expanded.has(id)) continue;
      (children.get(id) || []).forEach((ch) => {
        if (!vis.has(ch.id)) { vis.add(ch.id); q.push(ch.id); }
      });
    }
    return Array.from(vis);
  }, [root, level2, children, expanded]);

  // sizes
  const sizes = useMemo(() => {
    const m: Record<string, number> = {};
    visibleIds.forEach((id) => (m[id] = sizeForDepth(depths.get(id) ?? 0)));
    return m;
  }, [visibleIds, depths]);

  // positions / dragging
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [pinned, setPinned]   = useState<Map<string, { x: number; y: number }>>(new Map());
  const [lockedRoot, setLockedRoot] = useState<{ x: number; y: number } | null>(null);

  // helpers
  const getViewport = () => {
    const r = containerRef.current?.getBoundingClientRect();
    const w = r?.width ?? window.innerWidth, h = r?.height ?? window.innerHeight;
    return { cx: w / 2, cy: h / 2 };
  };
  const getCenter = (id: string) => {
    const s = sizes[id] ?? 80;
    const p = positions[id];
    if (!p) {
      const { cx, cy } = getViewport();
      return { x: cx, y: cy };
    }
    return { x: p.x + s / 2, y: p.y + s / 2 };
  };

  // initial seed: root at true centre; level-2 evenly around ring
  useEffect(() => {
    if (!root) return;
    const { cx, cy } = getViewport();
    setPositions((prev) => {
      const next = { ...prev };
      const rSize = sizes[root.id] ?? 100;
      next[root.id] = { x: cx - rSize / 2, y: cy - rSize / 2 };

      const n = Math.max(1, level2.length);
      for (let i = 0; i < n; i++) {
        const ch = level2[i];
        const s = sizes[ch.id] ?? 80;
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = cx + Math.cos(a) * ROOT_RING_RADIUS - s / 2;
        const y = cy + Math.sin(a) * ROOT_RING_RADIUS - s / 2;
        if (!next[ch.id]) next[ch.id] = { x, y };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, level2]);

  // seed newly visible children close to parent (tiny ring)
  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      visibleIds.forEach((pid) => {
        if (!expanded.has(pid)) return;
        const kids = children.get(pid) || [];
        const missing = kids.filter((k) => visibleIds.includes(k.id) && !next[k.id]);
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
          next[k.id] = { x: pc.x + Math.cos(a) * r - s / 2, y: pc.y + Math.sin(a) * r - s / 2 };
        }
      });
      return next;
    });
  }, [visibleIds, expanded, sizes, children]);

  // links (springs)
  const links = useMemo(() => {
    if (!root) return [] as { source: string; target: string; distance: number; strength?: number }[];
    const L: { source: string; target: string; distance: number; strength?: number }[] = [];
    (children.get(root.id) || []).forEach((ch) => {
      if (!visibleIds.includes(ch.id)) return;
      L.push({ source: root.id, target: ch.id, distance: 120, strength: 0.09 });
    });
    visibleIds.forEach((pid) => {
      if (!expanded.has(pid)) return;
      const dChild = (depths.get(pid) ?? 0) + 1;
      const distance = dChild <= 1 ? 120 : dChild === 2 ? 110 : 100;
      (children.get(pid) || []).forEach((ch) => {
        if (!visibleIds.includes(ch.id)) return;
        L.push({ source: pid, target: ch.id, distance, strength: 0.08 });
      });
    });
    return L;
  }, [root, children, visibleIds, expanded, depths]);

  // physics (centered on viewport; no knowledge of pan/scale needed)
  useD3Force({
    containerRef,
    nodes: visibleIds,
    links,
    sizes,
    positions,
    pinned,
    locked: lockedRoot ? { [root.id]: lockedRoot } : {},
    onPositions: setPositions,
    repulsion: -900,
    collidePadding: 8,
    alphaDecay: 0.06,
  });

  // drag API
  const onPinStart = (id: string, p: { x: number; y: number }) =>
    setPinned((prev) => new Map(prev).set(id, p));
  const onPinMove = (id: string, p: { x: number; y: number }) =>
    setPinned((prev) => new Map(prev).set(id, p));
  const onPinEnd = (id: string, p: { x: number; y: number }) => {
    setPinned((prev) => {
      const n = new Map(prev); n.delete(id); return n;
    });
    setPositions((prev) => ({ ...prev, [id]: p }));
    if (root && id === root.id) setLockedRoot(p);
  };

  return (
    <div
      className={`container${isPanning ? " is-panning" : ""}`}
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={beginPan}
    >
      <div className="zoom-toolbar">
        <button onClick={() => zoomAt(1.1, window.innerWidth / 2, window.innerHeight / 2)}>+</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => zoomAt(1 / 1.1, window.innerWidth / 2, window.innerHeight / 2)}>–</button>
      </div>

      <div
        className="stage"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}
      >


        <svg
          className="overlay"
          style={{
            position: "absolute",
            left: -OVERLAY_PAD,
            top: -OVERLAY_PAD,
            width: `calc(100% + ${OVERLAY_PAD * 2}px)`,
            height: `calc(100% + ${OVERLAY_PAD * 2}px)`,
            pointerEvents: "none",
          }}
        >
          {links.map((e) => {
            const p = positions[e.source], c = positions[e.target];
            if (!p || !c) return null;
            const ox = OVERLAY_PAD, oy = OVERLAY_PAD;
            const x1 = p.x + (sizes[e.source] ?? 80) / 2 + ox;
            const y1 = p.y + (sizes[e.source] ?? 80) / 2 + oy;
            const x2 = c.x + (sizes[e.target] ?? 80) / 2 + ox;
            const y2 = c.y + (sizes[e.target] ?? 80) / 2 + oy;
            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(0,0,0,0.18)"
                strokeWidth={2}
              />
            );
          })}
        </svg>
        
        {visibleIds.map((id) => {
          const node = byId.get(id)!;
          const pos  = positions[id] ?? { x: 0, y: 0 };
          const size = sizes[id] ?? 80;
          return (
            <NodeItem
              key={id}
              id={id}
              node={node}
              pos={pos}
              containerRef={containerRef}
              size={size}
              scale={scale}
              pan={pan}
              onPinStart={onPinStart}
              onPinMove={onPinMove}
              onPinEnd={onPinEnd}
              onToggle={toggle}
              canToggle={true}
            />
          );
        })}
      </div>
    </div>
  );
}
