import * as React from "react";
import { motion } from "framer-motion";
import * as Switch from "@radix-ui/react-switch";
import { MapViewControls } from "./MapViewControls";
import { LayoutControls } from "./LayoutControls";
import type { ComboOption } from "../App";

type Theme = "light" | "dark";
type PaletteKey =
  | "minimal"
  | "forest"
  | "ocean"
  | "sunset"
  | "candy"
  | "slate"
  | "aurora"
  | "orchid";

type LeftMenuProps = {
  width?: number;
  topGap?: number;
  leftGap?: number;
  bottomGap?: number;

  theme: Theme;
  setTheme: (t: Theme) => void;

  onExpandAll: () => void;
  onCollapseAll: () => void;

  // levels
  maxDepth: number;
  currentLevel: number;
  onChangeLevel: (lvl: number) => void;

  // filters & actions
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

  // palettes
  paletteKey: PaletteKey;
  onPaletteChange: (k: PaletteKey) => void;
};

export const LeftMenu: React.FC<LeftMenuProps> = (props) => {
  const {
    width = 280,
    topGap = 24,
    leftGap = 24,
    bottomGap = 24,
    theme,
    setTheme,
  } = props;

  const [pinned, setPinned] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("leftMenuPinned") === "1";
    } catch {
      return false;
    }
  });
  const [hoverHotzone, setHoverHotzone] = React.useState(false);
  const [hoverPanel, setHoverPanel] = React.useState(false);
  React.useEffect(() => {
    try {
      localStorage.setItem("leftMenuPinned", pinned ? "1" : "0");
    } catch {}
  }, [pinned]);

  const open = pinned || hoverHotzone || hoverPanel;
  const dark = theme === "dark";

  const c = dark
    ? {
        panelBg: "#1f2937",
        panelBorder: "#374151",
        text: "#e5e7eb",
        textMuted: "#9ca3af",
        cardBg: "#111827",
        inputBg: "#111827",
        inputBorder: "#374151",
        chipBg: "#111827",
        chipBorder: "#374151",
        divider: "#374151",
        thumb: "#ffffff",
        trackOn: "#e5e7eb",
        trackOff: "#374151",
        shadowOpen: "0 12px 28px rgba(0,0,0,0.35)",
        shadowClosed: "0 8px 16px rgba(0,0,0,0.22)",
        pinPrimary: "#e5e7eb",
        pinSecondary: "#6b7280",
      }
    : {
        panelBg: "#f3f4f6",
        panelBorder: "#e5e7eb",
        text: "#111827",
        textMuted: "#374151",
        cardBg: "#ffffff",
        inputBg: "#ffffff",
        inputBorder: "#e5e7eb",
        chipBg: "#ffffff",
        chipBorder: "#e5e7eb",
        divider: "#e5e7eb",
        thumb: "#ffffff",
        trackOn: "#111827",
        trackOff: "#e5e7eb",
        shadowOpen: "0 12px 28px rgba(0,0,0,0.10)",
        shadowClosed: "0 8px 16px rgba(0,0,0,0.06)",
        pinPrimary: "#111827",
        pinSecondary: "#9ca3af",
      };

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: leftGap,
    width,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    background: c.panelBg,
    border: `1px solid ${c.panelBorder}`,
    borderRadius: 16,
    boxShadow: open ? c.shadowOpen : c.shadowClosed,
    overflow: "hidden",
    zIndex: 20,
    pointerEvents: open ? "auto" : "none",
    color: c.text,
  };

  const hotZoneStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: 0,
    width,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    zIndex: 19,
    background: "transparent",
  };

  const headerStyle: React.CSSProperties = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "12px 14px",
    background: c.panelBg,
    borderBottom: `1px solid ${c.panelBorder}`,
    color: c.text,
  };

  const homeBtnStyle: React.CSSProperties = {
    justifySelf: "start",
    height: 34,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${c.inputBorder}`,
    background: c.cardBg,
    color: c.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  const switchWrapStyle: React.CSSProperties = {
    justifySelf: "center",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: c.textMuted,
  };

  const pinBtnStyle: React.CSSProperties = {
    justifySelf: "end",
    height: 34,
    width: 38,
    borderRadius: 12,
    border: `1px solid ${c.inputBorder}`,
    background: c.cardBg,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.06)",
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <div
        className="left-menu-hotzone"
        style={hotZoneStyle}
        onMouseEnter={() => setHoverHotzone(true)}
        onMouseLeave={() => setHoverHotzone(false)}
        onMouseDown={stop}
        onWheel={stop}
      />

      <motion.div
        className="left-menu"
        style={panelStyle}
        initial={false}
        animate={{ x: open ? 0 : -(width + leftGap + 12), opacity: open ? 1 : 0.92 }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
        onMouseEnter={() => setHoverPanel(true)}
        onMouseLeave={() => setHoverPanel(false)}
        onMouseDown={stop}
        onWheel={stop}
      >
        <div style={headerStyle}>
          <button aria-label="Home" style={homeBtnStyle} onMouseDown={stop}>
            Home
          </button>

          <div style={switchWrapStyle}>
            <span style={{ fontSize: 12 }}>{theme === "dark" ? "Dark" : "Light"}</span>
            <Switch.Root
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                const next: Theme = checked ? "dark" : "light";
                setTheme(next);
                try {
                  localStorage.setItem("theme", next);
                } catch {}
              }}
              onMouseDown={stop}
              aria-label="Toggle dark mode"
              style={{
                width: 44,
                height: 24,
                background: theme === "dark" ? c.trackOn : c.trackOff,
                borderRadius: 999,
                position: "relative",
                border: `1px solid ${c.inputBorder}`,
                cursor: "pointer",
              }}
            >
              <Switch.Thumb
                style={{
                  display: "block",
                  width: 18,
                  height: 18,
                  backgroundColor: c.thumb,
                  borderRadius: "50%",
                  boxShadow:
                    theme === "dark" ? "0 1px 3px rgba(0,0,0,0.6)" : "0 1px 3px rgba(0,0,0,0.2)",
                  transform: `translateX(${theme === "dark" ? 22 : 2}px)`,
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
            onClick={(e) => {
              e.stopPropagation();
              setPinned((v) => !v);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {pinned ? (
                <>
                  <path d="M12 4l-4 4h3v6h2V8h3l-4-4z" fill={c.pinPrimary} />
                  <path d="M12 20l4-4h-3v-2h-2v2H8l4 4z" fill={c.pinSecondary} />
                </>
              ) : (
                <>
                  <path d="M12 4l-4 4h3v2h2V8h3l-4-4z" fill={c.pinSecondary} />
                  <path d="M12 20l4-4h-3v-6h-2v6H8l4 4z" fill={c.pinPrimary} />
                </>
              )}
            </svg>
          </button>
        </div>

        <div
          style={{
            padding: 14,
            height: "calc(100% - 58px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            color: c.text,
          }}
        >
          {/* Map View */}
          <MapViewControls
            palette={c}
            onExpandAll={props.onExpandAll}
            onCollapseAll={props.onCollapseAll}
            maxDepth={props.maxDepth}
            currentLevel={props.currentLevel}
            onChangeLevel={props.onChangeLevel}
            nodeOptions={props.nodeOptions}
            categoryOptions={props.categoryOptions}
            showOnlySelected={props.showOnlySelected}
            excludeSelected={props.excludeSelected}
            showOnlyCategories={props.showOnlyCategories}
            excludeCategories={props.excludeCategories}
            onChangeShowOnly={props.onChangeShowOnly}
            onChangeExclude={props.onChangeExclude}
            onChangeShowOnlyCategories={props.onChangeShowOnlyCategories}
            onChangeExcludeCategories={props.onChangeExcludeCategories}
            centerSelected={props.centerSelected}
            onCenterSelect={props.onCenterSelect}
            onResetLayout={props.onResetLayout}
          />

          <div style={{ height: 1, background: c.divider, margin: "10px 0" }} />

          {/* Map Layout — now interactive palettes */}
          <LayoutControls
            palette={c}
            paletteKey={props.paletteKey}
            onPaletteChange={props.onPaletteChange}
          />

          <div style={{ height: 1, background: c.divider, margin: "10px 0" }} />

          {/* More */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: c.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                margin: "4px 0 8px",
              }}
            >
              More
            </div>
            <div style={{ display: "grid", gap: 8, width: 200 }}>
              {["Quick tutorial", "Manage Connections", "Configuration"].map((label) => (
                <button
                  key={label}
                  style={{
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${c.inputBorder}`,
                    background: c.cardBg,
                    color: c.text,
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "0 10px",
                  }}
                  onMouseDown={stop}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
};
