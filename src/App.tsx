import React, { useEffect, useMemo, useRef, useState } from "react";
import rawData from "./notion_data.json";
import { parse } from "./data/parse";
import { sizeForDepth } from "./config/layout";

/* Config */
import { PALETTES, MINIMAL_GRAY, readableText } from "./config/pallete";
import type { PaletteKey } from "./config/pallete";
import { ZOOM_STEP, clampScale } from "./config/zoom";

/* Mind Map 1 bundle (engine + node + force) */
import { mindMap1 } from "./maps-type/mind-map-1/engine";
import { NodeItem } from "./maps-type/mind-map-1/NodeItem";
import { useMindMap1Force as useD3Force } from "./maps-type/mind-map-1/useD3Force";

/* Left Menu */
import { LeftMenu } from "./left-menu/LeftMenu";

/* ---------- Local types ---------- */
export interface NotionGraphNode {
  id: string;
  title?: string;
  name?: string;
  url?: string | null;
  link?: string | null;
  href?: string | null;
  kind?: string | null;
}
type RawShape = { nodes: NotionGraphNode[] };
export type ComboOption = { id: string; label: string };

type Vec = { x: number; y: number };
type Positions = Record<string, Vec>;
type VelMap = Map<string, { vx: number; vy: number }>;
type PinMap = Map<string, Vec>;
type Link = { source: string; target: string; distance: number; strength?: number };

const OVERLAY_PAD = 4000;

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* THEME */
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") === "dark" ? "dark" : "light")
  );
  useEffect(() => {
    document.body.style.background = theme === "dark" ? "#0b1220" : "#ffffff";
    (document.body.style as any).webkitFontSmoothing = "antialiased";
  }, [theme]);

  /* PAN & ZOOM (pixel-space pan, scale; nodes are positioned in world-space -> mapped to screen) */
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Vec>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<Vec>({ x: 0, y: 0 });
  const pointerStart = useRef<Vec>({ x: 0, y: 0 });

  const worldToScreen = (p: Vec): Vec => ({ x: pan.x + p.x * scale, y: pan.y + p.y * scale });
  const sizeToScreen = (s: number) => Math.max(1, s * scale);

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const sx = clientX - left, sy = clientY - top;
    const wx = (sx - pan.x) / scale, wy = (sy - pan.y) / scale;
    const next = clampScale(scale * factor);
    setScale(next);
    setPan({ x: sx - wx * next, y: sy - wy * next });
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (e.ctrlKey || Math.abs(e.deltaY) > 40) {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP, e.clientX, e.clientY);
    }
  };

  const beginPan: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(".node-ball")) return;     // don’t start panning on nodes
    if (target.closest(".left-menu")) return;     // don’t start panning on menu / hotzone
    if (target.closest(".left-menu-hotzone")) return;

    setIsPanning(true);
    panStart.current = { ...pan };
    pointerStart.current = { x: e.clientX, y: e.clientY };

    const move = (ev: MouseEvent) =>
      setPan({
        x: panStart.current.x + (ev.clientX - pointerStart.current.x),
        y: panStart.current.y + (ev.clientY - pointerStart.current.y),
      });
    const up = () => {
      setIsPanning(false);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const viewportCenterWorld = () => {
    const r = containerRef.current?.getBoundingClientRect();
    const cx = (r?.width ?? window.innerWidth) / 2;
    const cy = (r?.height ?? window.innerHeight) / 2;
    return { x: (cx - pan.x) / scale, y: (cy - pan.y) / scale };
  };

  /* DATA */
  const data = (rawData as RawShape).nodes;
  const { byId, children, roots } = useMemo(() => parse(data), [data]);
  const root = roots[0];

  const labelOf = (id: string) => {
    const n = byId.get(id) as NotionGraphNode | undefined;
    return n?.title || n?.name || id;
  };

  const allCategories = useMemo<string[]>(() => {
    const s = new Set<string>();
    data.forEach((n) => { if (n?.kind != null) s.add(String(n.kind)); });
    return Array.from(s);
  }, [data]);

  /* DEPTHS & PARENT */
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

  const parentOf = useMemo(() => {
    const m = new Map<string, string | null>();
    if (root) m.set(root.id, null);
    children.forEach((kids, pid) => kids.forEach((k) => m.set(k.id, pid)));
    return m;
  }, [children, root]);

  const maxDepth = useMemo(
    () => (depths.size ? Math.max(...Array.from(depths.values())) : 0),
    [depths]
  );

  /* EXPANSION (manual toggle can exceed levelCap if parent expanded) */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  // open root initially
  const rootInit = useRef(false);
  useEffect(() => {
    if (!root || rootInit.current) return;
    setExpanded(new Set([root.id]));
    rootInit.current = true;
  }, [root]);

  /* SHOW LEVELS */
  const [levelCap, setLevelCap] = useState<number>(1);
  const applyLevel = (level: number) => {
    setLevelCap(level);
    setExpanded(() => {
      const next = new Set<string>();
      depths.forEach((dep, id) => { if (dep < level && (children.get(id) || []).length) next.add(id); });
      if (root) next.add(root.id);
      return next;
    });
  };

  /* FILTERS */
  const [showOnlyIds, setShowOnlyIds] = useState<string[]>([]);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [showOnlyCats, setShowOnlyCats] = useState<string[]>([]);
  const [excludeCats, setExcludeCats] = useState<string[]>([]);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);

  const nodeOptions: ComboOption[] = useMemo(
    () => Array.from(byId.keys()).map((id) => ({ id, label: labelOf(id) })),
    [byId]
  );

  /* VISIBLE IDS — LevelCap + manual expand + filters coexist */
  const visibleIds = useMemo(() => {
    if (!root) return [];
    const vis = new Set<string>(); const enq = new Set<string>(); const q: string[] = [];
    vis.add(root.id); q.push(root.id); enq.add(root.id);

    while (q.length) {
      const id = q.shift()!; const d = depths.get(id) ?? 0; const kids = children.get(id) || [];
      for (const ch of kids) {
        const chId = ch.id; const chDepth = depths.get(chId) ?? (d + 1);
        const withinLevel = chDepth <= levelCap; const parentExpanded = expanded.has(id);
        if (withinLevel || parentExpanded) {
          vis.add(chId);
          const descend = (chDepth < levelCap) || expanded.has(chId);
          if (descend && !enq.has(chId)) { q.push(chId); enq.add(chId); }
        }
      }
    }

    const kindOf = (id: string) => (byId.get(id) as NotionGraphNode | undefined)?.kind ?? null;

    if (showOnlyCats.length > 0) {
      for (const id of Array.from(vis)) {
        const k = String(kindOf(id));
        if (id !== root.id && !showOnlyCats.includes(k)) vis.delete(id);
      }
    }
    if (excludeCats.length > 0) {
      for (const id of Array.from(vis)) {
        const k = String(kindOf(id));
        if (id !== root.id && excludeCats.includes(k)) vis.delete(id);
      }
    }
    if (showOnlyIds.length > 0) {
      const keep = new Set<string>();
      const addAnc = (x: string) => { let cur: string | null | undefined = x;
        while (cur) { keep.add(cur); cur = parentOf.get(cur) ?? null; } };
      for (const id of showOnlyIds) { addAnc(id); keep.add(id); }
      for (const id of Array.from(vis)) if (!keep.has(id) && id !== root.id) vis.delete(id);
    }
    if (excludeIds.length > 0) for (const id of excludeIds) if (id !== root.id) vis.delete(id);

    return Array.from(vis);
  }, [
    root, children, byId, expanded, depths, levelCap,
    showOnlyIds, excludeIds, showOnlyCats, excludeCats, parentOf
  ]);

  /* SIZES (world units) */
  const sizes = useMemo(() => {
    const m: Record<string, number> = {};
    visibleIds.forEach((id) => (m[id] = sizeForDepth(depths.get(id) ?? 0)));
    return m;
  }, [visibleIds, depths]);

  /* POSITIONS & DRAG */
  const [positions, setPositions] = useState<Positions>({});
  const [pinned, setPinned] = useState<PinMap>(new Map());
  const [velocities, setVelocities] = useState<VelMap>(new Map());
  const [simKey, setSimKey] = useState(0);

  // Seed root & first ring using engine
  useEffect(() => {
    if (!root) return;
    const wc = viewportCenterWorld();
    setPositions((prev) =>
      mindMap1.seedRootPositions(prev, {
        rootId: root.id,
        childrenOf: children,
        visibleIds,
        sizes,
        worldCenter: wc,
        expandedRoot: expanded.has(root.id),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, children, sizes, visibleIds, expanded]);

  // Seed newly revealed children using engine
  useEffect(() => {
    setPositions((prev) =>
      mindMap1.seedChildrenPositions(prev, {
        expanded,
        visibleIds,
        childrenOf: children,
        sizes,
      })
    );
  }, [visibleIds, expanded, sizes, children]);

  /* LINKS via engine */
  const links: Link[] = useMemo(
    () => mindMap1.buildLinks({ visibleIds, parentOf, depths, root }),
    [visibleIds, parentOf, depths, root]
  );

  /* FORCE */
  useD3Force({
    containerRef,
    nodes: visibleIds,
    links,
    sizes,
    positions,
    pinned,
    velocities,
    onPositions: setPositions,
    simKey,
  });

  /* DRAG */
  const onPinStart = (id: string, p: Vec) => setPinned((prev) => new Map(prev).set(id, p));
  const onPinMove  = (id: string, p: Vec) => setPinned((prev) => new Map(prev).set(id, p));
  const onPinEnd   = (id: string, p: Vec, v: { vx: number; vy: number }) => {
    setPinned((prev) => { const n = new Map(prev); n.delete(id); return n; });
    setPositions((prev) => ({ ...prev, [id]: p }));
    setVelocities((prev) => { const n = new Map(prev); n.set(id, v); return n; });
    setSimKey((k) => k + 1);
  };

  /* Smooth expand/collapse (unchanged) */
  const smoothJob = useRef<{ cancel: boolean } | null>(null);
  const stopSmooth = () => { if (smoothJob.current) smoothJob.current.cancel = true; };
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const expandAllSmooth = async (stepMs = 120) => {
    if (!root) return; stopSmooth(); const job = { cancel: false }; smoothJob.current = job;
    for (let d = 0; d <= maxDepth; d++) {
      if (job.cancel) break;
      setExpanded(() => {
        const n = new Set<string>();
        depths.forEach((dep, id) => { if (dep <= d && (children.get(id) || []).length) n.add(id); });
        if (root) n.add(root.id);
        return n;
      });
      await sleep(stepMs);
    }
  };
  const collapseAllSmooth = async (stepMs = 100) => {
    if (!root) return; stopSmooth(); const job = { cancel: false }; smoothJob.current = job;
    for (let d = maxDepth; d >= 0; d--) {
      if (job.cancel) break;
      setExpanded((prev) => {
        const n = new Set(prev);
        depths.forEach((dep, id) => { if (dep === d && n.has(id)) n.delete(id); });
        if (root) n.add(root.id);
        return n;
      });
      await sleep(stepMs);
    }
  };

  /* CENTER VIEW */
  const centerOnNode = (id: string) => {
    const p = positions[id]; const s = sizes[id] ?? 80;
    if (!p || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2; const cy = rect.height / 2;
    const nodeCenterX = (p.x + s / 2) * scale;
    const nodeCenterY = (p.y + s / 2) * scale;
    setPan({ x: cx - nodeCenterX, y: cy - nodeCenterY });
  };
  useEffect(() => { if (centerNodeId) centerOnNode(centerNodeId); }, [centerNodeId, positions, scale]);

  const centerSelectedOrRoot = () => {
    const preferred = centerNodeId && positions[centerNodeId] ? centerNodeId : (root?.id ?? null);
    if (!preferred || !positions[preferred]) return;
    centerOnNode(preferred);
  };

  /* RESET LAYOUT */
  const resetLayout = () => {
    setPinned(new Map()); setVelocities(new Map()); setPositions({});
    setScale(1); setPan({ x: 0, y: 0 });
    if (root) {
      setExpanded(new Set([root.id])); setLevelCap(1);
      setShowOnlyIds([]); setExcludeIds([]); setShowOnlyCats([]); setExcludeCats([]); setCenterNodeId(null);
    }
    setSimKey((k) => k + 1);
  };

  /* Palette by depth */
  const [paletteKey, setPaletteKey] = useState<PaletteKey>("minimal");
  const colorForDepth = (depth: number): string => {
    if (paletteKey === "minimal") return MINIMAL_GRAY;
    const colors = PALETTES[paletteKey];
    const maxIdx = colors.length - 1;
    const idx = Math.max(0, maxIdx - depth);
    return colors[idx];
  };
  const colorForNode = (id: string) => {
    const d = depths.get(id) ?? 0;
    const fill = colorForDepth(d);
    const stroke = theme === "dark" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
    return { fill, text: readableText(fill), stroke };
  };

  const bg = theme === "dark" ? "#0b1220" : "#ffffff";
  const linkStroke = theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";

  /* LeftMenu options */
  const nodeOptionsList: ComboOption[] = useMemo(
    () => Array.from(byId.keys()).map((id) => ({ id, label: labelOf(id) })),
    [byId]
  );
  const categoryOptions = allCategories;

  return (
    <div
      className={`container${isPanning ? " is-panning" : ""}`}
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={beginPan}
      style={{ position: "relative", background: bg, minHeight: "100vh" }}
    >
      {/* Top-right quick controls */}
      <div
        style={{
          position: "fixed",
          right: 12,
          top: 12,
          zIndex: 90,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: theme === "dark" ? "rgba(17,24,39,0.6)" : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(6px)",
          borderRadius: 10,
          padding: "6px 8px",
          border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
        }}
      >
        <button onClick={centerSelectedOrRoot} title="Center view" aria-label="Center view">Center</button>
        <button onClick={() => zoomAt(ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2)}>+</button>
        <span style={{ minWidth: 34, textAlign: "center", color: theme === "dark" ? "#e5e7eb" : "#111827" }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => zoomAt(1 / ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2)}>–</button>
      </div>

      {/* Left Menu — render directly, no extra wrappers */}
      <LeftMenu
        theme={theme}
        setTheme={setTheme}
        onExpandAll={expandAllSmooth}
        onCollapseAll={collapseAllSmooth}
        maxDepth={maxDepth}
        currentLevel={levelCap}
        onChangeLevel={applyLevel}
        nodeOptions={nodeOptionsList}
        categoryOptions={categoryOptions}
        showOnlySelected={showOnlyIds}
        excludeSelected={excludeIds}
        showOnlyCategories={showOnlyCats}
        excludeCategories={excludeCats}
        onChangeShowOnly={setShowOnlyIds}
        onChangeExclude={setExcludeIds}
        onChangeShowOnlyCategories={setShowOnlyCats}
        onChangeExcludeCategories={setExcludeCats}
        centerSelected={centerNodeId}
        onCenterSelect={setCenterNodeId}
        onResetLayout={resetLayout}
        paletteKey={paletteKey}
        onPaletteChange={(k) => setPaletteKey(k as PaletteKey)}
      />

      {/* Stage */}
      <div className="stage" style={{ position: "relative" }}>
        {/* Links (screen-space for crisp strokes) */}
        <svg
          className="overlay"
          style={{
            position: "absolute",
            left: -OVERLAY_PAD,
            top: -OVERLAY_PAD,
            width: `calc(100% + ${OVERLAY_PAD * 2}px)`,
            height: `calc(100% + ${OVERLAY_PAD * 2}px)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
          shapeRendering="geometricPrecision"
        >
          {links.map((e) => {
            const p = positions[e.source], c = positions[e.target];
            if (!p || !c) return null;
            const ox = OVERLAY_PAD, oy = OVERLAY_PAD;
            const x1 = pan.x + (p.x + (sizes[e.source] ?? 80) / 2) * scale + ox;
            const y1 = pan.y + (p.y + (sizes[e.source] ?? 80) / 2) * scale + oy;
            const x2 = pan.x + (c.x + (sizes[e.target] ?? 80) / 2) * scale + ox;
            const y2 = pan.y + (c.y + (sizes[e.target] ?? 80) / 2) * scale + oy;
            return (
              <line
                key={`lnk:${e.source}|${e.target}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={linkStroke} strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {visibleIds.map((id) => {
          const node = byId.get(id)! as NotionGraphNode;
          const posWorld = positions[id] ?? { x: 0, y: 0 };
          const sizeWorld = sizes[id] ?? 80;
          const posScreen = worldToScreen(posWorld);
          const sizeScreen = sizeToScreen(sizeWorld);
          const { fill, stroke, text } = colorForNode(id);

          return (
            <NodeItem
              key={id}
              id={id}
              node={node}
              posScreen={posScreen}
              sizeScreen={sizeScreen}
              sizeWorld={sizeWorld}
              containerRef={containerRef}
              scale={scale}
              pan={pan}
              onPinStart={(nid, p) => setPinned((prev) => new Map(prev).set(nid, p))}
              onPinMove={(nid, p) => setPinned((prev) => new Map(prev).set(nid, p))}
              onPinEnd={(nid, p, v) => {
                setPinned((prev) => { const n = new Map(prev); n.delete(nid); return n; });
                setPositions((prev) => ({ ...prev, [nid]: p }));
                setVelocities((prev) => { const n = new Map(prev); n.set(nid, v); return n; });
                setSimKey((k) => k + 1);
              }}
              onToggle={toggle}
              canToggle={true}
              fill={fill}
              stroke={stroke}
              labelColor={text}
            />
          );
        })}
      </div>
    </div>
  );
}
