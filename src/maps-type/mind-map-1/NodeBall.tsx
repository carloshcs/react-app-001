import React from "react";
import { fitTitleToCircle } from "../../utils/text";

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
  const fit = fitTitleToCircle(title, size); // shared, deterministic
  const { lines, fontSize, lineHeight } = fit;
  const totalTextH = lines.length * lineHeight;
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
          {lines.map((ln, i) => (
            <text
              key={i}
              x="50%"
              y={firstBaselineY + i * lineHeight}
              dominantBaseline="middle"
              textAnchor="middle"
              style={{ fontSize, letterSpacing: 0.1 }}
            >
              {ln}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};
