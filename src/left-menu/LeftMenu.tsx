import * as React from "react";
import { motion } from "framer-motion";
import * as Switch from "@radix-ui/react-switch";
import * as RadioGroup from "@radix-ui/react-radio-group";

type LeftMenuProps = {
  width?: number;
  topGap?: number;
  leftGap?: number;
  bottomGap?: number;
};

export const LeftMenu: React.FC<LeftMenuProps> = ({
  width = 280,
  topGap = 24,
  leftGap = 24,
  bottomGap = 24,
}) => {
  // Visual state only (no app wiring yet)
  const [pinned, setPinned] = React.useState<boolean>(() => {
    try { return localStorage.getItem("leftMenuPinned") === "1"; } catch { return false; }
  });
  const [hoverHotzone, setHoverHotzone] = React.useState(false);
  const [hoverPanel, setHoverPanel] = React.useState(false);

  const [darkMode, setDarkMode] = React.useState(false);
  const [palette, setPalette] = React.useState("light");
  const [layoutMode, setLayoutMode] = React.useState("force");

  React.useEffect(() => {
    try { localStorage.setItem("leftMenuPinned", pinned ? "1" : "0"); } catch {}
  }, [pinned]);

  const open = pinned || hoverHotzone || hoverPanel;

  // Panel chrome
  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: leftGap,
    width,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    background: "#f3f4f6", // light gray
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 20,
    pointerEvents: open ? "auto" : "none",
  };

  // Hover zone the size of the panel width: no need to touch the box to reveal it
  const hotZoneStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: 0,
    width, // same as panel width
    height: `calc(100% - ${topGap + bottomGap}px)`,
    zIndex: 19,
    background: "transparent",
  };

  // Header styles
  const headerStyle: React.CSSProperties = {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr", // left (Home), center (switch), right (pin)
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
    width: 34,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  return (
    <>
      {/* Hover strip: being within 'width' from the left edge reveals the panel */}
      <div
        className="left-menu-hotzone"
        style={hotZoneStyle}
        onMouseEnter={() => setHoverHotzone(true)}
        onMouseLeave={() => setHoverHotzone(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Sliding panel */}
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
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header: Home (left), Dark switch (center), Pin (right) */}
        <div style={headerStyle}>
          {/* Left: Home */}
          <button
            aria-label="Home"
            style={homeBtnStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Home
          </button>

          {/* Center: Dark/Light switch */}
          <div style={switchWrapStyle}>
            <span style={{ fontSize: 12, color: "#374151" }}>Dark</span>
            <Switch.Root
              checked={darkMode}
              onCheckedChange={setDarkMode}
              onMouseDown={(e) => e.stopPropagation()}
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

          {/* Right: Pin / Unpin (inside the panel, near the switch) */}
          <button
            aria-label={pinned ? "Unpin menu" : "Pin menu"}
            title={pinned ? "Unpin menu" : "Pin menu"}
            style={pinBtnStyle}
            onClick={(e) => { e.stopPropagation(); setPinned(v => !v); }}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              style={{ transform: pinned ? "rotate(-20deg)" : "rotate(0deg)", transition: "transform 160ms ease" }}
            >
              <path d="M17 8l-1-1-2 2-3-3 2-2-1-1-6 6 1 1 2-2 3 3-2 2 1 1 6-6z" fill="#6b7280" />
              <path d="M11 13l-6 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 14, height: "calc(100% - 58px)", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Map palette */}
          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Map palette
            </div>
            <RadioGroup.Root
              value={palette}
              onValueChange={setPalette}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ display: "grid", gap: 8 }}
            >
              {[
                { v: "light", label: "Light" },
                { v: "contrast", label: "High contrast" },
                { v: "depth", label: "Depth based" },
                { v: "tag", label: "Tag based" },
              ].map((o) => (
                <label key={o.v} style={radioRowStyle}>
                  <RadioGroup.Item value={o.v} style={radioOuterStyle}>
                    <RadioGroup.Indicator style={radioDotStyle} />
                  </RadioGroup.Item>
                  <span style={{ fontSize: 13, color: "#111827" }}>{o.label}</span>
                </label>
              ))}
            </RadioGroup.Root>
          </section>

          {/* Divider */}
          <div style={{ height: 1, background: "#e5e7eb", margin: "8px 0" }} />

          {/* Layout mode */}
          <section>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Layout mode
            </div>
            <RadioGroup.Root
              value={layoutMode}
              onValueChange={setLayoutMode}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ display: "grid", gap: 8 }}
            >
              {[
                { v: "force", label: "Force-directed" },
                { v: "radial", label: "Radial" },
              ].map((o) => (
                <label key={o.v} style={radioRowStyle}>
                  <RadioGroup.Item value={o.v} style={radioOuterStyle}>
                    <RadioGroup.Indicator style={radioDotStyle} />
                  </RadioGroup.Item>
                  <span style={{ fontSize: 13, color: "#111827" }}>{o.label}</span>
                </label>
              ))}
            </RadioGroup.Root>
          </section>

          <div style={{ marginTop: "auto", fontSize: 12, color: "#6b7280" }}>
            Hover near the left edge to reveal. Pin to keep open.
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Small style helpers (kept minimal and neutral)
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
