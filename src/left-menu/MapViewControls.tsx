import * as React from "react";

import {
  FilterCombo,
  CategoryCombo,
  SingleCombo,
  FilterComboOption,
} from "./FilterCombo";

type MapViewControlsProps = {
  nodeOptions: FilterComboOption[];
  categoryOptions: string[];
  maxDepth: number;
};

export const MapViewControls: React.FC<MapViewControlsProps> = ({
  nodeOptions,
  categoryOptions,
  maxDepth,
}) => {
  // local UI state (visual only)
  const [expandMode, setExpandMode] = React.useState<"expand" | "collapse">(
    "expand",
  );
  const [levelShown, setLevelShown] = React.useState<number>(
    Math.min(3, Math.max(1, maxDepth)),
  );
  const [levelsOpen, setLevelsOpen] = React.useState(false);

  const [showOnlyQuery, setShowOnlyQuery] = React.useState("");
  const [excludeQuery, setExcludeQuery] = React.useState("");
  const [centerQuery, setCenterQuery] = React.useState("");

  const [showOnlySel, setShowOnlySel] = React.useState<FilterComboOption[]>([]);
  const [excludeSel, setExcludeSel] = React.useState<FilterComboOption[]>([]);
  const [categoryOnlySel, setCategoryOnlySel] = React.useState<string[]>([]);
  const [categoryExcludeSel, setCategoryExcludeSel] = React.useState<string[]>([]);
  const [centerSel, setCenterSel] = React.useState<FilterComboOption | null>(
    null,
  );

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const filteredNodes = (q: string) =>
    nodeOptions.filter((o) =>
      o.label.toLowerCase().startsWith(q.trim().toLowerCase()),
    );
  const filteredCats = (q: string) =>
    categoryOptions.filter((c) =>
      c.toLowerCase().startsWith(q.trim().toLowerCase()),
    );
  const addUnique = <T,>(
    arr: T[],
    item: T,
    eq: (a: T, b: T) => boolean,
  ) => (arr.find((x) => eq(x, item)) ? arr : [...arr, item]);
  const removeAt = <T,>(arr: T[], index: number) =>
    arr.filter((_, i) => i !== index);

  const FIELD_W = 200; // compact width for Level + all filters below

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: "4px 0 8px",
  };
  const group: React.CSSProperties = { display: "grid", gap: 8 };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 4,
  };
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
  const segWrap: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  };
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

  return (
    <div>
      <div style={sectionTitle}>Map View</div>
      <div style={group}>
        {/* Expand / Collapse */}
        <div>
          <div style={labelStyle}>Expand</div>
          <div style={{ ...segWrap, width: FIELD_W }}>
            <button
              style={segBtn(expandMode === "expand")}
              onMouseDown={stop}
              onClick={() => setExpandMode("expand")}
            >
              Expand all
            </button>
            <button
              style={segBtn(expandMode === "collapse")}
              onMouseDown={stop}
              onClick={() => setExpandMode("collapse")}
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Show levels */}
        <div>
          <div style={labelStyle}>Show levels</div>
          <div style={{ position: "relative", width: FIELD_W }}>
            <div
              style={selectBoxNarrow}
              onMouseDown={stop}
              onClick={() => setLevelsOpen((v) => !v)}
            >
              <span>Level {levelShown}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {levelsOpen && (
              <div style={{ ...dropdownNarrow, top: 40 }}>
                {Array.from({ length: Math.max(1, maxDepth) }, (_, i) => i + 1).map(
                  (lvl) => (
                    <div
                      key={lvl}
                      style={{
                        ...dropdownItem,
                        background: lvl === levelShown ? "#f3f4f6" : "#fff",
                      }}
                      onMouseDown={stop}
                      onClick={() => {
                        setLevelShown(lvl);
                        setLevelsOpen(false);
                      }}
                    >
                      Level {lvl}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Show only filter */}
        <FilterCombo
          label="Show only filter"
          placeholder="Type to search nodes…"
          query={showOnlyQuery}
          setQuery={setShowOnlyQuery}
          options={filteredNodes(showOnlyQuery)}
          selected={showOnlySel}
          onAdd={(item) =>
            setShowOnlySel((prev) => addUnique(prev, item, (a, b) => a.id === b.id))
          }
          onRemove={(idx) =>
            setShowOnlySel((prev) => removeAt(prev, idx))
          }
          stop={stop}
          inputStyle={inputNarrow}
          dropdownStyle={dropdownNarrow}
          dropdownItem={dropdownItem}
          chipStyle={chip}
          chipsRowStyle={chipsRowNarrow}
        />

        {/* Exclude filter */}
        <FilterCombo
          label="Exclude filter"
          placeholder="Type to search nodes…"
          query={excludeQuery}
          setQuery={setExcludeQuery}
          options={filteredNodes(excludeQuery)}
          selected={excludeSel}
          onAdd={(item) =>
            setExcludeSel((prev) => addUnique(prev, item, (a, b) => a.id === b.id))
          }
          onRemove={(idx) => setExcludeSel((prev) => removeAt(prev, idx))}
          stop={stop}
          inputStyle={inputNarrow}
          dropdownStyle={dropdownNarrow}
          dropdownItem={dropdownItem}
          chipStyle={chip}
          chipsRowStyle={chipsRowNarrow}
        />

        {/* Show only categories */}
        <CategoryCombo
          label="Show only categories"
          placeholder="Type to search categories…"
          options={filteredCats("")}
          selected={categoryOnlySel}
          onAdd={(item) =>
            setCategoryOnlySel((prev) => addUnique(prev, item, (a, b) => a === b))
          }
          onRemove={(idx) =>
            setCategoryOnlySel((prev) => removeAt(prev, idx))
          }
          stop={stop}
          inputStyle={inputNarrow}
          dropdownStyle={dropdownNarrow}
          dropdownItem={dropdownItem}
          chipStyle={chip}
          chipsRowStyle={chipsRowNarrow}
        />

        {/* Exclude categories */}
        <CategoryCombo
          label="Exclude categories"
          placeholder="Type to search categories…"
          options={filteredCats("")}
          selected={categoryExcludeSel}
          onAdd={(item) =>
            setCategoryExcludeSel((prev) => addUnique(prev, item, (a, b) => a === b))
          }
          onRemove={(idx) =>
            setCategoryExcludeSel((prev) => removeAt(prev, idx))
          }
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
        <button style={resetBtn} onMouseDown={stop}>
          Reset Layout
        </button>
      </div>
    </div>
  );
};

