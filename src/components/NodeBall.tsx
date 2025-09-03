import React from "react";

export interface NodeBallProps {
  id: string;
  title: string;
  x: number; y: number; size: number; dragging: boolean;
  onMouseDown: (clientX: number, clientY: number) => void;
  onMouseMove: (clientX: number, clientY: number) => void;
  onMouseUp:   () => void;
  onMouseLeave?: () => void;
  onTouchStart: (clientX: number, clientY: number) => void;
  onTouchMove:  (clientX: number, clientY: number) => void;
  onTouchEnd:   () => void;
  onClick:      () => void;
  onDoubleClick:() => void;
}

export const NodeBall: React.FC<NodeBallProps> = ({
  title, x, y, size, dragging,
  onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
  onTouchStart, onTouchMove, onTouchEnd, onClick, onDoubleClick,
}) => {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x, top: y, width: size, height: size,
    borderRadius: "50%",
    backgroundColor: "#f5f5f5",
    border: "2px solid #ddd",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: dragging ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
    cursor: dragging ? "grabbing" : "grab",
    userSelect: "none", zIndex: 1,
  };
  return (
    <div
      className="node-ball"
      style={style}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onMouseDown(e.clientX, e.clientY); }}
      onMouseMove={(e) => onMouseMove(e.clientX, e.clientY)}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) { e.stopPropagation(); onTouchStart(t.clientX, t.clientY); } }}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) onTouchMove(t.clientX, t.clientY); }}
      onTouchEnd={onTouchEnd}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
    >
      <span style={{ pointerEvents: "none", textAlign: "center", fontSize: Math.max(12, size * 0.15),
                     lineHeight: 1.2, padding: "0 4px", wordBreak: "break-word" }}>
        {title}
      </span>
    </div>
  );
};
