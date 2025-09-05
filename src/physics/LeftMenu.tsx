import React, { useEffect, useMemo, useState } from "react";

type LeftMenuProps = {
  width?: number;
  topGap?: number;
  leftGap?: number;
  bottomGap?: number;
  children?: React.ReactNode; // if you want to inject content later
};

export const LeftMenu: React.FC<LeftMenuProps> = ({
  width = 280,
  topGap = 24,
  leftGap = 24,
  bottomGap = 24,
  children,
}) => {
  const [hoverHotzone, setHoverHotzone] = useState(false);
  const [hoverPanel, setHoverPanel] = useState(false);
  const [pinned, setPinned] = useState<boolean>(() => {
    try { return localStorage.getItem("leftMenuPinned") === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("leftMenuPinned", pinned ? "1" : "0"); } catch {}
  }, [pinned]);

  const open = pinned || hoverHotzone || hoverPanel;

  const panelStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    top: topGap,
    left: leftGap,
    width,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    background: "#f3f4f6", // light gray
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 20,
    transform: `translateX(${open ? 0 : -(width + leftGap + 12)}px)`,
    transition: "transform 200ms ease, opacity 200ms ease",
    opacity: open ? 1 : 0.9,
    pointerEvents: open ? "auto" : "none",
  }), [open, width, topGap, bottomGap, leftGap]);

  const hotZoneStyle: React.CSSProperties = {
    position: "absolute",
    top: topGap,
    left: 0,
    width: 14,
    height: `calc(100% - ${topGap + bottomGap}px)`,
    zIndex: 19,
    background: "transparent",
    cursor: "default",
  };

  const edgePinBtn: React.CSSProperties = {
    position: "absolute",
    right: -18,
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    cursor: "pointer",
  };

  return (
    <>
      {/* Hover strip to reveal the menu */}
      <div
        className="left-menu-hotzone"
        style={hotZoneStyle}
        onMouseEnter={() => setHoverHotzone(true)}
        onMouseLeave={() => setHoverHotzone(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* The menu panel */}
      <div
        className="left-menu"
        style={panelStyle}
        onMouseEnter={() => setHoverPanel(true)}
        onMouseLeave={() => setHoverPanel(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Pin button hanging on the right edge */}
        <button
          aria-label={pinned ? "Unpin menu" : "Pin menu"}
          title={pinned ? "Unpin menu" : "Pin menu"}
          style={edgePinBtn}
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

        {/* Menu content (example) */}
        <div style={{ padding: 14, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Menu
          </div>

          <div>
            <input
              placeholder="Search"
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                height: 34,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                outline: "none",
              }}
            />
          </div>

          <div style={{ height: 1, background: "#e5e7eb", margin: "6px 0" }} />

          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={menuBtnStyle} onMouseDown={(e) => e.stopPropagation()}>Center on root</button>
            <button style={menuBtnStyle} onMouseDown={(e) => e.stopPropagation()}>Expand all</button>
            <button style={menuBtnStyle} onMouseDown={(e) => e.stopPropagation()}>Collapse all</button>
            <button style={menuBtnStyle} onMouseDown={(e) => e.stopPropagation()}>Reset layout</button>
          </nav>

          <div style={{ marginTop: "auto", fontSize: 12, color: "#6b7280" }}>
            Hover to open. Click pin to keep open.
          </div>

          {children}
        </div>
      </div>
    </>
  );
};

const menuBtnStyle: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontSize: 13,
  textAlign: "left" as const,
  padding: "0 10px",
  cursor: "pointer",
};
