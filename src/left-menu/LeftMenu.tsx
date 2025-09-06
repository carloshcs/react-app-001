import * as React from "react";
import { motion } from "framer-motion";
import * as Switch from "@radix-ui/react-switch";
import * as RadioGroup from "@radix-ui/react-radio-group";

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

  const { depths, maxDepth } = React.useMemo(() => {
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
    return { depths: d, maxDepth: Math.max(1, max + 1) };
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

  // Map View
  const [expandMode, setExpandMode] = React.useState<"expand" | "collapse">("expand");
  const [levelShown, setLevelShown] = React.useState<number>(Math.min(3, Math.max(1, maxDepth)));
  const [levelsOpen, setLevelsOpen] = React.useState(false);

  const [showOnlyQuery, setShowOnlyQuery] = React.useState("");
  const [excludeQuery, setExcludeQuery] = React.useState("");
  const [centerQuery, setCenterQuery] = React.useState("");

  const [showOnlySel, setShowOnlySel] = React.useState<{ id: string; label: string }[]>([]);
  const [excludeSel, setExcludeSel] = React.useState<{ id: string; label: string }[]>([]);
  const [categoryOnlySel, setCategoryOnlySel] = React.useState<string[]>([]);
  const [categoryExcludeSel, setCategoryExcludeSel] = React.useState<string[]>([]);
  const [centerSel, setCenterSel] = React.useState<{ id: string; label: string } | null>(null);

  // Map layout
  const [layoutMode, setLayoutMode] = React.useState("mindmap1");
  const [palette, setPalette] = React.useState("minimal-gray");
  const [palettesOpen, setPalettesOpen] = React.useState(false); // collapsible to save space

  // ---------- helpers ----------
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const filteredNodes = (q: string) =>
    nodeOptions.filter(o => o.label.toLowerCase().startsWith(q.trim().toLowerCase()));
  const filteredCats = (q: string) =>
    categoryOptions.filter(c => c.toLowerCase().startsWith(q.trim().toLowerCase()));
  const addUnique = <T,>(arr: T[], item: T, eq: (a: T, b: T) => boolean) =>
    arr.find(x => eq(x, item)) ? arr : [...arr, item];
  const removeAt = <T,>(arr: T[], index: number) => arr.filter((_, i) => i !== index);

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

  const group: React.CSSProperties = { display: "grid", gap: 8 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: "#4b5563", marginBottom: 4 };
  const divider: React.CSSProperties = { height: 1, background: "#e5e7eb", margin: "10px 0" };

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    fontSize: 12,
    color: "#111827",
  };

  // compact fields
  const inputNarrow: React.CSSProperties = {
    width: FIELD_W,
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    outline: "none",
    fontSize: 13,
    color: "#111827",
  };

  const chipsRowNarrow: React.CSSProperties = {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    maxWidth: FIELD_W,
  };

  const listBox: React.CSSProperties = { position: "relative" };

  const dropdownNarrow: React.CSSProperties = {
    position: "absolute",
    top: 6,
    left: 0,
    width: FIELD_W,
    maxHeight: 160,
    overflow: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    zIndex: 30,
  };

  const dropdownItem: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 13,
    color: "#111827",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
  };

  const segWrap: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
  const segBtn = (active: boolean): React.CSSProperties => ({
    height: 34,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: active ? "#111827" : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontSize: 13,
    cursor: "pointer",
  });

  const selectBoxNarrow: React.CSSProperties = {
    width: FIELD_W,
    height: 34,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px",
    fontSize: 13,
    color: "#111827",
    cursor: "pointer",
  };

  const resetBtn: React.CSSProperties = {
    width: FIELD_W,
    height: 36,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

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
        <div style={{ padding: 14, height: "calc(100% - 58px)", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* MAP VIEW */}
          <div>
            <div style={sectionTitle}>Map View</div>
            <div style={group}>
              {/* Expand / Collapse */}
              <div>
                <div style={labelStyle}>Expand</div>
                <div style={{ ...segWrap, width: FIELD_W }}>
                  <button style={segBtn(expandMode === "expand")} onMouseDown={stop} onClick={() => setExpandMode("expand")}>Expand all</button>
                  <button style={segBtn(expandMode === "collapse")} onMouseDown={stop} onClick={() => setExpandMode("collapse")}>Collapse all</button>
                </div>
              </div>

              {/* Show levels */}
              <div>
                <div style={labelStyle}>Show levels</div>
                <div style={{ position: "relative", width: FIELD_W }}>
                  <div style={selectBoxNarrow} onMouseDown={stop} onClick={() => setLevelsOpen(v => !v)}>
                    <span>Level {levelShown}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M7 10l5 5 5-5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {levelsOpen && (
                    <div style={{ ...dropdownNarrow, top: 40 }}>
                      {Array.from({ length: Math.max(1, maxDepth) }, (_, i) => i + 1).map((lvl) => (
                        <div
                          key={lvl}
                          style={{ ...dropdownItem, background: lvl === levelShown ? "#f3f4f6" : "#fff" }}
                          onMouseDown={stop}
                          onClick={() => { setLevelShown(lvl); setLevelsOpen(false); }}
                        >
                          Level {lvl}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Show only filter */}
              <ComboWithChips
                label="Show only filter"
                placeholder="Type to search nodes…"
                query={showOnlyQuery}
                setQuery={setShowOnlyQuery}
                options={filteredNodes(showOnlyQuery)}
                selected={showOnlySel}
                onAdd={(item) => setShowOnlySel(prev => addUnique(prev, item, (a, b) => a.id === b.id))}
                onRemove={(idx) => setShowOnlySel(prev => removeAt(prev, idx))}
                stop={stop}
                inputStyle={inputNarrow}
                dropdownStyle={dropdownNarrow}
                dropdownItem={dropdownItem}
                chipStyle={chip}
                chipsRowStyle={chipsRowNarrow}
              />

              {/* Exclude filter */}
              <ComboWithChips
                label="Exclude filter"
                placeholder="Type to search nodes…"
                query={excludeQuery}
                setQuery={setExcludeQuery}
                options={filteredNodes(excludeQuery)}
                selected={excludeSel}
                onAdd={(item) => setExcludeSel(prev => addUnique(prev, item, (a, b) => a.id === b.id))}
                onRemove={(idx) => setExcludeSel(prev => removeAt(prev, idx))}
                stop={stop}
                inputStyle={inputNarrow}
                dropdownStyle={dropdownNarrow}
                dropdownItem={dropdownItem}
                chipStyle={chip}
                chipsRowStyle={chipsRowNarrow}
              />

              {/* Show only categories */}
              <ComboCats
                label="Show only categories"
                placeholder="Type to search categories…"
                options={filteredCats("")}
                selected={categoryOnlySel}
                onAdd={(item) => setCategoryOnlySel(prev => addUnique(prev, item, (a,b)=>a===b))}
                onRemove={(idx) => setCategoryOnlySel(prev => removeAt(prev, idx))}
                stop={stop}
                inputStyle={inputNarrow}
                dropdownStyle={dropdownNarrow}
                dropdownItem={dropdownItem}
                chipStyle={chip}
                chipsRowStyle={chipsRowNarrow}
              />

              {/* Exclude categories */}
              <ComboCats
                label="Exclude categories"
                placeholder="Type to search categories…"
                options={filteredCats("")}
                selected={categoryExcludeSel}
                onAdd={(item) => setCategoryExcludeSel(prev => addUnique(prev, item, (a,b)=>a===b))}
                onRemove={(idx) => setCategoryExcludeSel(prev => removeAt(prev, idx))}
                stop={stop}
                inputStyle={inputNarrow}
                dropdownStyle={dropdownNarrow}
                dropdownItem={dropdownItem}
                chipStyle={chip}
                chipsRowStyle={chipsRowNarrow}
              />

              {/* Center view */}
              <SingleCombo
                label="Center view"
                placeholder="Type to search nodes…"
                query={centerQuery}
                setQuery={setCenterQuery}
                options={filteredNodes(centerQuery)}
                selected={centerSel}
                onSelect={setCenterSel}
                stop={stop}
                inputStyle={inputNarrow}
                dropdownStyle={dropdownNarrow}
                dropdownItem={dropdownItem}
                chipStyle={chip}
                width={FIELD_W}
              />

              {/* Reset Layout */}
              <button style={resetBtn} onMouseDown={stop}>Reset Layout</button>
            </div>
          </div>

          <div style={divider} />

          {/* MAP LAYOUT */}
          <div>
            <div style={sectionTitle}>Map layout</div>
            <div style={group}>
              {/* Layout mode */}
              <div>
                <div style={labelStyle}>Layout mode</div>
                <RadioGroup.Root
                  value={layoutMode}
                  onValueChange={setLayoutMode}
                  onMouseDown={stop}
                  style={{ display: "grid", gap: 8, width: FIELD_W }}
                >
                  {[
                    { v: "mindmap1", label: "Mind map 1" },
                    { v: "hierarchy", label: "Hierarchy" },
                  ].map(o => (
                    <label key={o.v} style={radioRowStyle}>
                      <RadioGroup.Item value={o.v} style={radioOuterStyle}>
                        <RadioGroup.Indicator style={radioDotStyle} />
                      </RadioGroup.Item>
                      <span style={{ fontSize: 13, color: "#111827" }}>{o.label}</span>
                    </label>
                  ))}
                </RadioGroup.Root>
              </div>

              {/* Layout palettes (collapsible to save space) */}
              <div>
                <div style={{ ...labelStyle, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onMouseDown={stop}
                    onClick={() => setPalettesOpen(v => !v)}
                    style={{
                      ...selectBoxNarrow,
                      width: FIELD_W,
                      justifyContent: "space-between",
                      background: "#fff",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontWeight: 600 }}>Layout palettes</strong>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {paletteLabel(palette)}
                      </span>
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: palettesOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 160ms ease" }}>
                      <path d="M7 10l5 5 5-5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {palettesOpen && (
                  <RadioGroup.Root
                    value={palette}
                    onValueChange={setPalette}
                    onMouseDown={stop}
                    style={{ display: "grid", gap: 8, width: FIELD_W, marginTop: 6 }}
                  >
                    {PALETTES.map(o => (
                      <label key={o.v} style={radioRowStyle}>
                        <RadioGroup.Item value={o.v} style={radioOuterStyle}>
                          <RadioGroup.Indicator style={radioDotStyle} />
                        </RadioGroup.Item>
                        <span style={{ fontSize: 13, color: "#111827", display: "inline-flex", alignItems: "center", gap: 8 }}>
                          {o.label}
                          <span style={{ display: "inline-flex", gap: 4 }}>
                            {o.swatch.map((c, i) => (
                              <span key={i} style={{ width: 12, height: 12, borderRadius: 4, background: c, border: "1px solid #e5e7eb" }} />
                            ))}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup.Root>
                )}
              </div>
            </div>
          </div>

          <div style={divider} />

          {/* MORE */}
          <div>
            <div style={sectionTitle}>More</div>
            <div style={{ display: "grid", gap: 8, width: FIELD_W }}>
              <button style={linkBtn} onMouseDown={stop}>Quick tutorial</button>
              <button style={linkBtn} onMouseDown={stop}>Manage Connections</button>
              <button style={linkBtn} onMouseDown={stop}>Configuration</button>
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

// ---------- palettes ----------
const PALETTES = [
  { v: "minimal-gray", label: "Minimalistic gray", swatch: ["#f3f4f6","#d1d5db","#9ca3af"] },
  { v: "green-forest", label: "Green forest", swatch: ["#064e3b","#10b981","#a7f3d0"] },
  { v: "ocean-blue", label: "Ocean blue", swatch: ["#0ea5e9","#0369a1","#e0f2fe"] },
  { v: "sunset", label: "Sunset", swatch: ["#fb7185","#f59e0b","#fde68a"] },
  { v: "candy-pop", label: "Candy pop", swatch: ["#e879f9","#60a5fa","#fca5a5"] },
  { v: "monochrome", label: "Monochrome", swatch: ["#111827","#6b7280","#e5e7eb"] },
  { v: "pastel-field", label: "Pastel field", swatch: ["#a7f3d0","#fbcfe8","#bfdbfe"] },
];

const paletteLabel = (v: string) => {
  const p = PALETTES.find(x => x.v === v);
  return p ? p.label : v;
};

// ---------- small subcomponents ----------
const radioRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  cursor: "pointer",
};

const radioOuterStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "1px solid #c7cdd6",
  background: "#fff",
  display: "grid",
  placeItems: "center",
};

const radioDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#111827",
};

type ComboWithChipsProps = {
  label: string;
  placeholder: string;
  query: string;
  setQuery: (v: string) => void;
  options: { id: string; label: string }[];
  selected: { id: string; label: string }[];
  onAdd: (item: { id: string; label: string }) => void;
  onRemove: (idx: number) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  chipsRowStyle: React.CSSProperties;
};

const ComboWithChips: React.FC<ComboWithChipsProps> = ({
  label, placeholder, query, setQuery, options, selected, onAdd, onRemove, stop,
  inputStyle, dropdownStyle, dropdownItem, chipStyle, chipsRowStyle,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ width: (inputStyle.width as number) || undefined }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={chipsRowStyle}>
          {selected.map((s, i) => (
            <span key={s.id} style={chipStyle}>
              {s.label}
              <button
                aria-label="Remove"
                onMouseDown={stop}
                onClick={() => onRemove(i)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && options.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {options.map((opt) => (
                <div
                  key={opt.id}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onAdd(opt)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type ComboCatsProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onAdd: (item: string) => void;
  onRemove: (idx: number) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  chipsRowStyle: React.CSSProperties;
};

const ComboCats: React.FC<ComboCatsProps> = ({
  label, placeholder, options, selected, onAdd, onRemove, stop,
  inputStyle, dropdownStyle, dropdownItem, chipStyle, chipsRowStyle,
}) => {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const filtered = options.filter(o => o.toLowerCase().startsWith(q.toLowerCase()));
  return (
    <div style={{ width: (inputStyle.width as number) || undefined }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={chipsRowStyle}>
          {selected.map((s, i) => (
            <span key={`${s}-${i}`} style={chipStyle}>
              {s}
              <button
                aria-label="Remove"
                onMouseDown={stop}
                onClick={() => onRemove(i)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && filtered.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {filtered.map((opt) => (
                <div
                  key={opt}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onAdd(opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type SingleComboProps = {
  label: string;
  placeholder: string;
  query: string;
  setQuery: (v: string) => void;
  options: { id: string; label: string }[];
  selected: { id: string; label: string } | null;
  onSelect: (v: { id: string; label: string } | null) => void;
  stop: (e: React.SyntheticEvent) => void;
  inputStyle: React.CSSProperties;
  dropdownStyle: React.CSSProperties;
  dropdownItem: React.CSSProperties;
  chipStyle: React.CSSProperties;
  width: number;
};

const SingleCombo: React.FC<SingleComboProps> = ({
  label, placeholder, query, setQuery, options, selected, onSelect, stop,
  inputStyle, dropdownStyle, dropdownItem, chipStyle, width,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ width }}>
      <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {selected && (
          <span style={chipStyle}>
            {selected.label}
            <button
              aria-label="Remove"
              onMouseDown={stop}
              onClick={() => onSelect(null)}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
            >
              ×
            </button>
          </span>
        )}
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            onMouseDown={stop}
            style={inputStyle}
          />
          {open && options.length > 0 && (
            <div style={{ ...dropdownStyle, top: 40 }}>
              {options.map((opt) => (
                <div
                  key={opt.id}
                  style={dropdownItem}
                  onMouseDown={stop}
                  onClick={() => onSelect(opt)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
