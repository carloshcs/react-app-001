import * as React from "react";

type Palette = {
  panelBg: string;
  panelBorder: string;
  text: string;
  textMuted: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
};

type PaletteKey =
  | "minimal"
  | "forest"
  | "ocean"
  | "sunset"
  | "candy"
  | "slate"
  | "aurora"
  | "orchid";

const ALL: { key: PaletteKey; name: string; preview: string[] }[] = [
  { key: "minimal", name: "Minimalistic gray", preview: ["#ffffff", "#e5e7eb", "#cbd5e1"] },
  { key: "forest", name: "Forest green", preview: ["#a5d6a7", "#66bb6a", "#43a047"] },
  { key: "ocean", name: "Ocean blue", preview: ["#7dd3fc", "#38bdf8", "#0284c7"] },
  { key: "sunset", name: "Sunset", preview: ["#fecdd3", "#fb7185", "#f43f5e"] },
  { key: "candy", name: "Candy", preview: ["#f9a8d4", "#ec4899", "#db2777"] },
  { key: "slate", name: "Slate", preview: ["#e2e8f0", "#94a3b8", "#475569"] },
  { key: "aurora", name: "Aurora", preview: ["#a5f3fc", "#22d3ee", "#06b6d4"] },
  { key: "orchid", name: "Orchid", preview: ["#e9d5ff", "#c084fc", "#a855f7"] },
];

export const LayoutControls: React.FC<{
  palette: Palette;
  paletteKey: PaletteKey;
  onPaletteChange: (k: PaletteKey) => void;
}> = ({ palette: c, paletteKey, onPaletteChange }) => {
  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: "4px 0 8px",
  };
  const label: React.CSSProperties = { fontSize: 12, color: c.textMuted, marginBottom: 4 };
  const box: React.CSSProperties = {
    width: 200,
    minHeight: 34,
    borderRadius: 10,
    border: `1px solid ${c.inputBorder}`,
    background: c.cardBg,
    color: c.text,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
  };
  const chip: React.CSSProperties = {
    width: 12,
    height: 12,
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.06)",
  };

  return (
    <div>
      <div style={sectionTitle}>Map Layout</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={label}>Layout mode</div>
          <div style={box}>Mind map 1</div>
        </div>

        <div>
          <div style={label}>Layout palettes</div>
          <details open>
            <summary style={{ cursor: "pointer", color: c.text, marginBottom: 6 }}>
              {ALL.find((p) => p.key === paletteKey)?.name}
            </summary>
            <div style={{ display: "grid", gap: 6 }}>
              {ALL.map((p) => (
                <button
                  key={p.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaletteChange(p.key);
                  }}
                  style={{
                    ...box,
                    justifyContent: "space-between",
                    borderColor: paletteKey === p.key ? "#22c55e" : c.inputBorder,
                  }}
                >
                  <span>{p.name}</span>
                  <span style={{ display: "flex", gap: 4 }}>
                    {p.preview.map((col) => (
                      <span key={col} style={{ ...chip, background: col }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
