import * as React from "react";
import { motion } from "framer-motion";
import * as Switch from "@radix-ui/react-switch";

import { MapViewControls } from "./MapViewControls";
import { LayoutControls } from "./LayoutControls";

export { MapViewControls } from "./MapViewControls";
export { LayoutControls } from "./LayoutControls";
export { FilterCombo, CategoryCombo, SingleCombo } from "./FilterCombo";

import rawData from "../notion_data.json";
import { parse } from "../data/parse";
import type { NotionNode } from "../types";

type LeftMenuProps = {
  width?: number;
  topGap?: number;
  leftGap?: number;
  bottomGap?: number;
};

type RawShape = { nodes: NotionNode[] };

export const LeftMenu: React.FC<LeftMenuProps> = ({
  width = 280,
  topGap = 24,
  leftGap = 24,
  bottomGap = 24,
}) => {
  // ---------- data ----------
  const data = (rawData as RawShape).nodes || [];
  const { byId, children, roots } = React.useMemo(() => parse(data), [data]);
  const root = roots[0];

  const { maxDepth } = React.useMemo(() => {
    const d = new Map<string, number>();
    let max = 1;
    const q: string[] = [];
    if (root) { d.set(root.id, 0); q.push(root.id); }
    while (q.length) {
      const pid = q.shift()!;
      const pd = d.get(pid) ?? 0;
      (children.get(pid) || []).forEach(ch => {
        if (!d.has(ch.id)) { const nd = pd + 1; d.set(ch.id, nd); max = Math.max(max, nd); q.push(ch.id); }
      });
    }
    return { maxDepth: Math.max(1, max + 1) };
  }, [root, children]);

  const nodeOptions: { id: string; label: string }[] = React.useMemo(() => {
    const arr: { id: string; label: string }[] = [];
    byId.forEach(n => arr.push({ id: n.id, label: n.title ?? n.id }));
    return arr.sort((a, b) => a.label.localeCompare(b.label));
  }, [byId]);

  const categoryOptions: string[] = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of data as any[]) {
      const maybe = [
        ...(Array.isArray(n?.categories) ? n.categories : []),
        ...(Array.isArray(n?.tags) ? n.tags : []),
        ...(n?.category ? [n.category] : []),
        ...(n?.tag ? [n.tag] : []),
      ];
      maybe.forEach((x) => { if (typeof x === "string" && x.trim()) set.add(x.trim()); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // ---------- panel visibility ----------
  const [pinned, setPinned] = React.useState<boolean>(() => {
    try { return localStorage.getItem("leftMenuPinned") === "1"; } catch { return false; }
  });
  const [hoverHotzone, setHoverHotzone] = React.useState(false);
  const [hoverPanel, setHoverPanel] = React.useState(false);
  React.useEffect(() => {
    try { localStorage.setItem("leftMenuPinned", pinned ? "1" : "0"); } catch {}
  }, [pinned]);

  const open = pinned || hoverHotzone || hoverPanel;

  // ---------- local UI state (visual only) ----------
  const [darkMode, setDarkMode] = React.useState(false);

  // ---------- helpers ----------
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // ---------- styles ----------
  const FIELD_W = 200; // compact width for Level + all filters below

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: leftGap,
    width,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 20,
    pointerEvents: open ? "auto" : "none",
  };

  const hotZoneStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: 0,
    width, // hover within the panel width to reveal
    height: `calc(100% - ${topGap + bottomGap}px)`,
    zIndex: 19,
    background: "transparent",
  };

  const headerStyle: React.CSSProperties = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr", // Home | Switch | Pin
    alignItems: "center",
    padding: "12px 14px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  };

  const homeBtnStyle: React.CSSProperties = {
    justifySelf: "start",
    height: 34,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  const switchWrapStyle: React.CSSProperties = {
    justifySelf: "center",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const pinBtnStyle: React.CSSProperties = {
    justifySelf: "end",
    height: 34,
    width: 38,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: "4px 0 8px",
  };

  const divider: React.CSSProperties = { height: 1, background: "#e5e7eb", margin: "10px 0" };

  const linkBtn: React.CSSProperties = {
    height: 34,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left" as const,
    padding: "0 10px",
  };

  // ---------- render ----------
  return (
    <>
      {/* Hover strip */}
      <div
        className="left-menu-hotzone"
        style={hotZoneStyle}
        onMouseEnter={() => setHoverHotzone(true)}
        onMouseLeave={() => setHoverHotzone(false)}
        onMouseDown={stop}
        onWheel={stop}
      />

      {/* Panel */}
      <motion.div
        className="left-menu"
        style={panelStyle}
        initial={false}
        animate={{
          x: open ? 0 : -(width + leftGap + 12),
          opacity: open ? 1 : 0.92,
          boxShadow: open ? "0 12px 28px rgba(0,0,0,0.10)" : "0 8px 16px rgba(0,0,0,0.06)",
        }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
        onMouseEnter={() => setHoverPanel(true)}
        onMouseLeave={() => setHoverPanel(false)}
        onMouseDown={stop}
        onWheel={stop}
      >
        {/* Header */}
        <div style={headerStyle}>
          <button aria-label="Home" style={homeBtnStyle} onMouseDown={stop}>Home</button>

          <div style={switchWrapStyle}>
            <span style={{ fontSize: 12, color: "#374151" }}>Dark</span>
            <Switch.Root
              checked={darkMode}
              onCheckedChange={setDarkMode}
              onMouseDown={stop}
              aria-label="Toggle dark mode"
              style={{
                width: 44,
                height: 24,
                background: darkMode ? "#111827" : "#e5e7eb",
                borderRadius: 999,
                position: "relative",
                border: "1px solid #d1d5db",
                cursor: "pointer",
              }}
            >
              <Switch.Thumb
                style={{
                  display: "block",
                  width: 18,
                  height: 18,
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transform: `translateX(${darkMode ? 22 : 2}px)`,
                  transition: "transform 160ms ease",
                  marginTop: 2,
                }}
              />
            </Switch.Root>
          </div>

          <button
            aria-label={pinned ? "Unpin menu" : "Pin menu"}
            title={pinned ? "Unpin menu" : "Pin menu"}
            style={pinBtnStyle}
            onClick={(e) => { e.stopPropagation(); setPinned(v => !v); }}
          >
            {/* two-arrows icon (up/down) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {pinned ? (
                <>
                  <path d="M12 4l-4 4h3v6h2V8h3l-4-4z" fill="#111827" />
                  <path d="M12 20l4-4h-3v-2h-2v2H8l4 4z" fill="#9ca3af" />
                </>
              ) : (
                <>
                  <path d="M12 4l-4 4h3v2h2V8h3l-4-4z" fill="#9ca3af" />
                  <path d="M12 20l4-4h-3v-6h-2v6H8l4 4z" fill="#111827" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 14,
            height: "calc(100% - 58px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <MapViewControls
            nodeOptions={nodeOptions}
            categoryOptions={categoryOptions}
            maxDepth={maxDepth}
          />

          <div style={divider} />

          <LayoutControls />

          <div style={divider} />

          {/* MORE */}
          <div>
            <div style={sectionTitle}>More</div>
            <div style={{ display: "grid", gap: 8, width: FIELD_W }}>
              <button style={linkBtn} onMouseDown={stop}>
                Quick tutorial
              </button>
              <button style={linkBtn} onMouseDown={stop}>
                Manage Connections
              </button>
              <button style={linkBtn} onMouseDown={stop}>
                Configuration
              </button>
            </div>
          </div>

          <div style={{ marginTop: "auto", fontSize: 12, color: "#6b7280" }}>
            Hover near the left edge to reveal. Pin to keep open.
          </div>
        </div>
      </motion.div>
    </>
  );
};
