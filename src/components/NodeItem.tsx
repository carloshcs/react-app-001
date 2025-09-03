import React, { RefObject, useEffect, useRef, useState } from "react";
import { NotionNode } from "../types";
import { NodeBall } from "./NodeBall";
import { buildNotionUrl } from "../utils/link";

type Props = {
  id: string;
  node: NotionNode;
  pos: { x: number; y: number };
  containerRef: RefObject<HTMLDivElement>;
  size: number;
  scale: number;
  pan: { x: number; y: number };
  onPinStart: (id: string, p: { x: number; y: number }) => void;
  onPinMove:  (id: string, p: { x: number; y: number }) => void;
  onPinEnd:   (id: string, p: { x: number; y: number }) => void;
  onToggle: (id: string) => void;
  canToggle?: boolean;
};

export const NodeItem: React.FC<Props> = ({
  id, node, pos, containerRef, size, scale, pan,
  onPinStart, onPinMove, onPinEnd, onToggle, canToggle = true,
}) => {
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const offset = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMoveMouse);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMoveTouch);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRect = () => containerRef.current?.getBoundingClientRect();

  const onMoveMouse = (e: MouseEvent) => {
    const rect = getRect(); const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const wx = (e.clientX - left - pan.x) / scale;
    const wy = (e.clientY - top  - pan.y) / scale;
    moved.current = true;
    onPinMove(id, { x: wx - offset.current.dx, y: wy - offset.current.dy });
  };
  const onMoveTouch = (e: TouchEvent) => {
    const t = e.touches[0]; if (!t) return;
    const rect = getRect(); const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const wx = (t.clientX - left - pan.x) / scale;
    const wy = (t.clientY - top  - pan.y) / scale;
    moved.current = true;
    onPinMove(id, { x: wx - offset.current.dx, y: wy - offset.current.dy });
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMoveMouse);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMoveTouch);
    window.removeEventListener("touchend", onUp);
    setDragging(false);
    onPinEnd(id, pos);
  };

  const start = (clientX: number, clientY: number) => {
    const rect = getRect(); const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const wx = (clientX - left - pan.x) / scale;
    const wy = (clientY - top  - pan.y) / scale;
    offset.current.dx = wx - pos.x;
    offset.current.dy = wy - pos.y;
    moved.current = false;
    setDragging(true);
    onPinStart(id, pos);
    window.addEventListener("mousemove", onMoveMouse);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMoveTouch, { passive: true });
    window.addEventListener("touchend", onUp);
  };

  const handleClick = () => { if (!moved.current && canToggle) onToggle(id); };
  const handleDblClick = () => {
    const url = buildNotionUrl(node.title, node.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <NodeBall
      id={id}
      title={node.title}
      x={pos.x}
      y={pos.y}
      size={size}
      dragging={dragging}
      onMouseDown={(x, y) => start(x, y)}
      onMouseMove={() => {}}
      onMouseUp={() => {}}
      onTouchStart={(x, y) => start(x, y)}
      onTouchMove={() => {}}
      onTouchEnd={() => {}}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
    />
  );
};
