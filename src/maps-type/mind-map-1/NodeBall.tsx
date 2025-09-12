import React from "react";

export interface NodeBallProps {
  id: string;
  title: string;
  x: number;
  y: number;
  size: number;
  dragging: boolean;

  // interaction
  onPointerDown: (clientX: number, clientY: number, buttons: number) => void;
  onPointerMove: (clientX: number, clientY: number, buttons: number) => void;
  onPointerUp: () => void;
  onClick: () => void;
  onDoubleClick: () => void;

  // visuals
  fill: string;
  stroke: string;
  labelColor: string;
}

type FitResult = { lines: string[]; fontSize: number };

/**
 * Fit a title inside a circle (diameter px), wrapping to at most maxLines.
 * Uses a simple character-per-pixel heuristic to avoid measuring DOM text.
 */
function fitTitleToCircle(title: string, diameter: number, maxLines = 3): FitResult {
  const clean = (title || "").trim();
  if (!clean) return { lines: [""], fontSize: Math.max(12, Math.min(18, diameter * 0.18)) };

  // target font size proportional to diameter; clamped
  let fontSize = Math.max(12, Math.min(20, diameter * 0.18));

  // available text width inside the circle (leave padding)
  const pad = Math.max(6, diameter * 0.11);
  const usable = Math.max(10, diameter - pad * 2);

  // average character width ≈ 0.54 * fontSize for semi-bold Inter/Segoe/etc.
  const avgCharW = 0.54 * fontSize;
  const maxCharsPerLine = Math.max(6, Math.floor(usable / avgCharW));

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let cur = "";

  for (const w of words) {
    const addLen = cur ? cur.length + 1 + w.length : w.length;
    if (addLen <= maxCharsPerLine) {
      cur = cur ? cur + " " + w : w;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break; // last line reserved
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);

  // If we still overflow in characters overall, truncate last line with ellipsis
  const joined = words.join(" ");
  if (lines.length === maxLines && joined.length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last.length > 1) {
      const room = Math.max(0, maxCharsPerLine - 1);
      lines[lines.length - 1] = last.slice(0, room).trimEnd() + "…";
    }
  }

  // If we generated only one very long word (no spaces) that still doesn't fit,
  // reduce font size slightly and try once more (rare for “Supercalifragilistic…” cases)
  if (lines.length === 1 && lines[0].length > maxCharsPerLine + 2) {
    fontSize = Math.max(11, fontSize * 0.92);
    const retry = fitTitleToCircle(clean, diameter, maxLines);
    return { lines: retry.lines, fontSize: Math.min(retry.fontSize, fontSize) };
  }

  return { lines, fontSize };
}

export const NodeBall: React.FC<NodeBallProps> = ({
  title,
  x,
  y,
  size,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onDoubleClick,
  fill,
  stroke,
  labelColor,
}) => {
  const fit = fitTitleToCircle(title, size, 3);
  const lineHeight = fit.fontSize * 1.12;
  const totalTextH = fit.lines.length * lineHeight;
  const firstBaselineY = size / 2 - totalTextH / 2 + lineHeight / 2;

  return (
    <div
      className="node-ball"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        zIndex: 2,
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        onPointerDown(e.clientX, e.clientY, e.buttons);
      }}
      onPointerMove={(e) => {
        onPointerMove(e.clientX, e.clientY, e.buttons);
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        e.stopPropagation();
        onPointerUp();
      }}
      onPointerCancel={(e) => {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        onPointerUp();
      }}
      onLostPointerCapture={() => onPointerUp()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ display: "block" }}
        shapeRendering="geometricPrecision"
        textRendering="optimizeLegibility"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 4) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <g
          fontFamily='Inter Variable, Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial'
          fontWeight={600}
          style={{ fontKerning: "normal" as any, fontVariationSettings: "'wght' 600" }}
          fill={labelColor}
        >
          {fit.lines.map((ln, i) => (
            <text
              key={i}
              x="50%"
              y={firstBaselineY + i * lineHeight}
              dominantBaseline="middle"
              textAnchor="middle"
              style={{ fontSize: fit.fontSize, letterSpacing: 0.1 }}
            >
              {ln}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};
