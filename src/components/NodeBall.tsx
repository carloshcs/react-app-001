import React, { useRef } from "react";

export interface NodeBallProps {
  id: string;
  title: string;
  x: number;
  y: number;
  size: number;
  dragging: boolean;

  onPointerDown: (clientX: number, clientY: number, buttons: number) => void;
  onPointerMove: (clientX: number, clientY: number, buttons: number) => void;
  onPointerUp: () => void;

  onClick: () => void;
  onDoubleClick: () => void;
}

export const NodeBall: React.FC<NodeBallProps> = ({
  title, x, y, size, dragging,
  onPointerDown, onPointerMove, onPointerUp, onClick, onDoubleClick,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const style: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: "#f5f5f5",
    border: "2px solid #ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: dragging ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
    cursor: dragging ? "grabbing" : "grab",
    userSelect: "none",
    zIndex: 1,
    touchAction: "none", // important: stops browser panning/zooming so we get pointer events
  };

  return (
    <div
      ref={ref}
      className="node-ball"
      style={style}
      onPointerDown={(e) => {
        // Capture subsequent pointer events even if the pointer leaves the element
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        onPointerDown(e.clientX, e.clientY, e.buttons);
      }}
      onPointerMove={(e) => {
        // If for any reason the button was released elsewhere, buttons will be 0.
        onPointerMove(e.clientX, e.clientY, e.buttons);
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        e.stopPropagation();
        onPointerUp();
      }}
      onPointerCancel={(e) => {
        // Treat cancel like an up to avoid stuck drags
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        onPointerUp();
      }}
      onLostPointerCapture={() => {
        // Extra safety – if capture is lost, end any ongoing drag
        onPointerUp();
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
    >
      <span
        style={{
          pointerEvents: "none",
          textAlign: "center",
          fontSize: Math.max(12, size * 0.15),
          lineHeight: 1.2,
          padding: "0 4px",
          wordBreak: "break-word",
        }}
      >
        {title}
      </span>
    </div>
  );
};
