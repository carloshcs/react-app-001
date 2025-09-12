import * as React from "react";
import type { ComboOption } from "../App";

type Palette = {
  panelBg: string;
  panelBorder: string;
  text: string;
  textMuted: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  chipBg: string;
  chipBorder: string;
  divider: string;
};

type MapViewControlsProps = {
  palette: Palette;

  onExpandAll?: () => void;
  onCollapseAll?: () => void;

  // levels
  maxDepth: number;
  currentLevel: number;
  onChangeLevel: (lvl: number) => void;

  // filters
  nodeOptions: ComboOption[];
  categoryOptions: string[];

  showOnlySelected: string[];
  excludeSelected: string[];
  showOnlyCategories: string[];
  excludeCategories: string[];

  onChangeShowOnly: (ids: string[]) => void;
  onChangeExclude: (ids: string[]) => void;
  onChangeShowOnlyCategories: (cats: string[]) => void;
  onChangeExcludeCategories: (cats: string[]) => void;

  centerSelected: string | null;
  onCenterSelect: (id: string | null) => void;

  onResetLayout: () => void;
};

const FIELD_W = 200;

const styles = (c: Palette) => ({
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: c.textMuted,
    textTransform: "uppercase" as const, letterSpacing: 0.4,
    margin: "4px 0 8px",
  },
  label: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
  segWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  segBtn: (active: boolean) => ({
    height: 34, borderRadius: 10,
    border: `1px solid ${c.inputBorder}`,
    background: active ? c.text : c.cardBg,
    color: active ? (c.panelBg === "#1f2937" ? "#0b1220" : "#ffffff") : c.text,
    fontSize: 13, cursor: "pointer",
  }),
  input: {
    width: FIELD_W, height: 34, padding: "0 10px",
    borderRadius: 10, border: `1px solid ${c.inputBorder}`,
    background: c.inputBg, outline: "none", fontSize: 13, color: c.text,
  },
  selectBox: {
    width: FIELD_W, height: 34, borderRadius: 10,
    border: `1px solid ${c.inputBorder}`, background: c.cardBg,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 10px", fontSize: 13, color: c.text, cursor: "pointer",
  },
  chipsRow: { display: "flex", gap: 6, flexWrap: "wrap" as const, maxWidth: FIELD_W },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 8px", background: c.chipBg,
    border: `1px solid ${c.chipBorder}`, borderRadius: 999,
    fontSize: 12, color: c.text,
  },
  dropdown: {
    position: "absolute" as const,
    top: 38,                  // ⟵ was 6; now opens below the input
    left: 0,
    width: FIELD_W,
    maxHeight: 180,
    overflow: "auto",
    background: c.cardBg,
    border: `1px solid ${c.inputBorder}`,
    borderRadius: 10,
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    zIndex: 30,
  },
  dropdownItem: {
    padding: "8px 10px", fontSize: 13, color: c.text,
    cursor: "pointer", borderBottom: `1px solid ${c.panelBorder}`,
  },
  resetBtn: {
    width: FIELD_W, height: 36, borderRadius: 12,
    border: `1px solid ${c.inputBorder}`, background: c.cardBg,
    color: c.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
});

function useTypeahead<T extends { id: string; label: string }>(
  options: T[], selectedIds: string[],
) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options.slice(0, 200);
    return options.filter(o => o.label.toLowerCase().includes(s)).slice(0, 200);
  }, [options, q]);
  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  return { q, setQ, open, setOpen, filtered, selected };
}

export const MapViewControls: React.FC<MapViewControlsProps> = (props) => {
  const { palette: c } = props;
  const s = styles(c);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const [levelsOpen, setLevelsOpen] = React.useState(false);

  // show only / exclude nodes
  const so = useTypeahead(props.nodeOptions, props.showOnlySelected);
  const ex = useTypeahead(props.nodeOptions, props.excludeSelected);
  const addShowOnly = (id: string) => {
    if (!props.showOnlySelected.includes(id)) props.onChangeShowOnly([...props.showOnlySelected, id]);
  };
  const addExclude = (id: string) => {
    if (!props.excludeSelected.includes(id)) props.onChangeExclude([...props.excludeSelected, id]);
  };

  // categories search
  const [qCatOnly, setQCatOnly] = React.useState("");
  const [openCatOnly, setOpenCatOnly] = React.useState(false);
  const filteredCatOnly = React.useMemo(() => {
    const s = qCatOnly.trim().toLowerCase();
    if (!s) return props.categoryOptions;
    return props.categoryOptions.filter(v => v.toLowerCase().includes(s));
  }, [qCatOnly, props.categoryOptions]);

  const [qCatEx, setQCatEx] = React.useState("");
  const [openCatEx, setOpenCatEx] = React.useState(false);
  const filteredCatEx = React.useMemo(() => {
    const s = qCatEx.trim().toLowerCase();
    if (!s) return props.categoryOptions;
    return props.categoryOptions.filter(v => v.toLowerCase().includes(s));
  }, [qCatEx, props.categoryOptions]);

  // center view
  const [qCenter, setQCenter] = React.useState("");
  const [openCenter, setOpenCenter] = React.useState(false);
  const filteredCenter = React.useMemo(() => {
    const s = qCenter.trim().toLowerCase();
    if (!s) return props.nodeOptions.slice(0, 200);
    return props.nodeOptions.filter(v => v.label.toLowerCase().includes(s)).slice(0, 200);
  }, [qCenter, props.nodeOptions]);

  return (
    <div>
      <div style={s.sectionTitle}>Map View</div>

      {/* Expand / Collapse */}
      <div>
        <div style={s.label}>Expand</div>
        <div style={{ ...s.segWrap, width: FIELD_W }}>
          <button style={s.segBtn(false)} onMouseDown={stop} onClick={props.onExpandAll}>Expand all</button>
          <button style={s.segBtn(false)} onMouseDown={stop} onClick={props.onCollapseAll}>Collapse all</button>
        </div>
      </div>

      {/* Levels */}
      <div>
        <div style={s.label}>Show levels</div>
        <div style={{ position: "relative", width: FIELD_W }}>
          <div style={s.selectBox} onMouseDown={stop} onClick={() => setLevelsOpen(v => !v)}>
            <span>Level {props.currentLevel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke={c.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {levelsOpen && (
            <div style={{ ...s.dropdown, top: 40 }}>
              {Array.from({ length: Math.max(1, props.maxDepth) }, (_, i) => i + 1).map((lvl) => (
                <div
                  key={lvl}
                  style={{
                    ...s.dropdownItem,
                    background: lvl === props.currentLevel
                      ? (c.panelBg === "#1f2937" ? "#111827" : "#f3f4f6")
                      : c.cardBg,
                  }}
                  onMouseDown={stop}
                  onClick={() => { props.onChangeLevel(lvl); setLevelsOpen(false); }}
                >
                  Level {lvl}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Show only filter */}
      <div>
        <div style={s.label}>Show only filter</div>
        <div style={{ position: "relative" }}>
          <input
            style={s.input}
            placeholder="Type to search nodes…"
            value={so.q}
            onChange={(e) => { so.setQ(e.target.value); setTimeout(() => so.setOpen(true), 0); }}
            onFocus={() => so.setOpen(true)}
            onMouseDown={stop}
          />
          {so.open && (
            <div style={s.dropdown} onMouseDown={stop} onMouseLeave={() => so.setOpen(false)}>
              {so.filtered.length === 0 ? (
                <div style={{ ...s.dropdownItem, opacity: 0.6 }}>No matches</div>
              ) : (
                so.filtered.map(o => (
                  <div
                    key={o.id}
                    style={{ ...s.dropdownItem, background: so.selected.has(o.id) ? (c.panelBg === "#1f2937" ? "#111827" : "#f3f4f6") : c.cardBg }}
                    onClick={() => addShowOnly(o.id)}
                  >
                    {o.label}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={s.chipsRow}>
          {props.showOnlySelected.map((id, i) => (
            <span key={id} style={s.chip}>
              {props.nodeOptions.find(n => n.id === id)?.label || id}
              <button
                onMouseDown={stop}
                onClick={() => {
                  const next = props.showOnlySelected.slice(); next.splice(i, 1);
                  props.onChangeShowOnly(next);
                }}
                style={{ border: "none", background: "transparent", color: c.textMuted, cursor: "pointer" }}
                aria-label="remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Exclude filter */}
      <div>
        <div style={s.label}>Exclude filter</div>
        <div style={{ position: "relative" }}>
          <input
            style={s.input}
            placeholder="Type to search nodes…"
            value={ex.q}
            onChange={(e) => { ex.setQ(e.target.value); setTimeout(() => ex.setOpen(true), 0); }}
            onFocus={() => ex.setOpen(true)}
            onMouseDown={stop}
          />
          {ex.open && (
            <div style={s.dropdown} onMouseDown={stop} onMouseLeave={() => ex.setOpen(false)}>
              {ex.filtered.length === 0 ? (
                <div style={{ ...s.dropdownItem, opacity: 0.6 }}>No matches</div>
              ) : (
                ex.filtered.map(o => (
                  <div
                    key={o.id}
                    style={{ ...s.dropdownItem }}
                    onClick={() => addExclude(o.id)}
                  >
                    {o.label}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={s.chipsRow}>
          {props.excludeSelected.map((id, i) => (
            <span key={id} style={s.chip}>
              {props.nodeOptions.find(n => n.id === id)?.label || id}
              <button
                onMouseDown={stop}
                onClick={() => {
                  const next = props.excludeSelected.slice(); next.splice(i, 1);
                  props.onChangeExclude(next);
                }}
                style={{ border: "none", background: "transparent", color: c.textMuted, cursor: "pointer" }}
                aria-label="remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Show only categories */}
      <div>
        <div style={s.label}>Show only categories</div>
        <div style={{ position: "relative" }}>
          <input
            style={s.input}
            placeholder="Type to search categories…"
            value={qCatOnly}
            onChange={(e) => { setQCatOnly(e.target.value); setTimeout(() => setOpenCatOnly(true), 0); }}
            onFocus={() => setOpenCatOnly(true)}
            onMouseDown={stop}
          />
          {openCatOnly && (
            <div style={s.dropdown} onMouseDown={stop} onMouseLeave={() => setOpenCatOnly(false)}>
              {filteredCatOnly.length === 0 ? (
                <div style={{ ...s.dropdownItem, opacity: 0.6 }}>No matches</div>
              ) : (
                filteredCatOnly.map(v => (
                  <div
                    key={v}
                    style={{ ...s.dropdownItem, background: props.showOnlyCategories.includes(v) ? (c.panelBg === "#1f2937" ? "#111827" : "#f3f4f6") : c.cardBg }}
                    onClick={() => {
                      if (!props.showOnlyCategories.includes(v)) props.onChangeShowOnlyCategories([...props.showOnlyCategories, v]);
                    }}
                  >
                    {v}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={s.chipsRow}>
          {props.showOnlyCategories.map((v, i) => (
            <span key={v} style={s.chip}>
              {v}
              <button
                onMouseDown={stop}
                onClick={() => {
                  const next = props.showOnlyCategories.slice(); next.splice(i, 1);
                  props.onChangeShowOnlyCategories(next);
                }}
                style={{ border: "none", background: "transparent", color: c.textMuted, cursor: "pointer" }}
                aria-label="remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Exclude categories */}
      <div>
        <div style={s.label}>Exclude categories</div>
        <div style={{ position: "relative" }}>
          <input
            style={s.input}
            placeholder="Type to search categories…"
            value={qCatEx}
            onChange={(e) => { setQCatEx(e.target.value); setTimeout(() => setOpenCatEx(true), 0); }}
            onFocus={() => setOpenCatEx(true)}
            onMouseDown={stop}
          />
          {openCatEx && (
            <div style={s.dropdown} onMouseDown={stop} onMouseLeave={() => setOpenCatEx(false)}>
              {filteredCatEx.length === 0 ? (
                <div style={{ ...s.dropdownItem, opacity: 0.6 }}>No matches</div>
              ) : (
                filteredCatEx.map(v => (
                  <div
                    key={v}
                    style={{ ...s.dropdownItem, background: props.excludeCategories.includes(v) ? (c.panelBg === "#1f2937" ? "#111827" : "#f3f4f6") : c.cardBg }}
                    onClick={() => {
                      if (!props.excludeCategories.includes(v)) props.onChangeExcludeCategories([...props.excludeCategories, v]);
                    }}
                  >
                    {v}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={s.chipsRow}>
          {props.excludeCategories.map((v, i) => (
            <span key={v} style={s.chip}>
              {v}
              <button
                onMouseDown={stop}
                onClick={() => {
                  const next = props.excludeCategories.slice(); next.splice(i, 1);
                  props.onChangeExcludeCategories(next);
                }}
                style={{ border: "none", background: "transparent", color: c.textMuted, cursor: "pointer" }}
                aria-label="remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Center view (single) */}
      <div>
        <div style={s.label}>Center view</div>
        <div style={{ position: "relative" }}>
          <input
            style={s.input}
            placeholder="Type to search nodes…"
            value={qCenter}
            onChange={(e) => { setQCenter(e.target.value); setTimeout(() => setOpenCenter(true), 0); }}
            onFocus={() => setOpenCenter(true)}
            onMouseDown={stop}
          />
          {openCenter && (
            <div style={s.dropdown} onMouseDown={stop} onMouseLeave={() => setOpenCenter(false)}>
              {filteredCenter.length === 0 ? (
                <div style={{ ...s.dropdownItem, opacity: 0.6 }}>No matches</div>
              ) : (
                filteredCenter.map(o => (
                  <div
                    key={o.id}
                    style={{ ...s.dropdownItem, background: props.centerSelected === o.id ? (c.panelBg === "#1f2937" ? "#111827" : "#f3f4f6") : c.cardBg }}
                    onClick={() => { props.onCenterSelect(o.id); setOpenCenter(false); setQCenter(""); }}
                  >
                    {o.label}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {props.centerSelected && (
          <div style={s.chipsRow}>
            <span style={s.chip}>
              {props.nodeOptions.find(n => n.id === props.centerSelected)?.label || props.centerSelected}
              <button
                onMouseDown={stop}
                onClick={() => props.onCenterSelect(null)}
                style={{ border: "none", background: "transparent", color: c.textMuted, cursor: "pointer" }}
                aria-label="clear center"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Reset */}
      <div style={{ marginTop: 8 }}>
        <button style={s.resetBtn} onMouseDown={stop} onClick={props.onResetLayout}>Reset Layout</button>
      </div>
    </div>
  );
};
