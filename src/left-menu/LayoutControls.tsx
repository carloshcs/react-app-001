import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";

const PALETTES = [
  { v: "minimal-gray", label: "Minimalistic gray", swatch: ["#f3f4f6", "#d1d5db", "#9ca3af"] },
  { v: "green-forest", label: "Green forest", swatch: ["#064e3b", "#10b981", "#a7f3d0"] },
  { v: "ocean-blue", label: "Ocean blue", swatch: ["#0ea5e9", "#0369a1", "#e0f2fe"] },
  { v: "sunset", label: "Sunset", swatch: ["#fb7185", "#f59e0b", "#fde68a"] },
  { v: "candy-pop", label: "Candy pop", swatch: ["#e879f9", "#60a5fa", "#fca5a5"] },
  { v: "monochrome", label: "Monochrome", swatch: ["#111827", "#6b7280", "#e5e7eb"] },
  { v: "pastel-field", label: "Pastel field", swatch: ["#a7f3d0", "#fbcfe8", "#bfdbfe"] },
];

const paletteLabel = (v: string) => {
  const p = PALETTES.find((x) => x.v === v);
  return p ? p.label : v;
};

export const LayoutControls: React.FC = () => {
  const [layoutMode, setLayoutMode] = React.useState("mindmap1");
  the [palette, setPalette] = React.useState("minimal-gray");
  const [palettesOpen, setPalettesOpen] = React.useState(false);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const FIELD_W = 200;

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

  return (
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
            ].map((o) => (
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
          <div
            style={{
              ...labelStyle,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              onMouseDown={stop}
              onClick={() => setPalettesOpen((v) => !v)}
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: palettesOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 160ms ease",
                }}
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
              {PALETTES.map((o) => (
                <label key={o.v} style={radioRowStyle}>
                  <RadioGroup.Item value={o.v} style={radioOuterStyle}>
                    <RadioGroup.Indicator style={radioDotStyle} />
                  </RadioGroup.Item>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#111827",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {o.label}
                    <span style={{ display: "inline-flex", gap: 4 }}>
                      {o.swatch.map((c, i) => (
                        <span
                          key={i}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            background: c,
                            border: "1px solid #e5e7eb",
                          }}
                        />
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
  );
};
