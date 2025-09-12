import React, { RefObject, useRef, useState } from "react";
import { NodeBall } from "./NodeBall";
import { buildNotionUrl } from "../../utils/link";

type Vec = { x: number; y: number };

type NotionNodeLike = {
  id: string;
  title?: string;
  name?: string;
  url?: string | null;
  link?: string | null;
  href?: string | null;
};

type Props = {
  id: string;
  node: NotionNodeLike;

  // screen-space
  posScreen: Vec;
  sizeScreen: number;

  // world-space
  sizeWorld: number;

  containerRef: RefObject<HTMLDivElement>;
  scale: number;
  pan: Vec;

  onPinStart: (id: string, p: Vec) => void;
  onPinMove: (id: string, p: Vec) => void;
  onPinEnd: (id: string, p: Vec, v?: { vx: number; vy: number }) => void;

  onToggle: (id: string) => void;
  canToggle?: boolean;

  fill: string;
  stroke: string;
  labelColor: string;
};

const DRAG_THRESHOLD_PX = 2;

export const NodeItem: React.FC<Props> = ({
  id,
  node,
  posScreen,
  sizeScreen,
  sizeWorld,
  containerRef,
  scale,
  pan,
  onPinStart,
  onPinMove,
  onPinEnd,
  onToggle,
  canToggle = true,
  fill,
  stroke,
  labelColor,
}) => {
  const [dragging, setDragging] = useState(false);

  const press = useRef<{ x: number; y: number } | null>(null);
  const lastWorld = useRef<Vec | null>(null);
  const ignoreNextClick = useRef(false);

  const title = node.title || node.name || id;
  const notionUrl = buildNotionUrl(title, id);

  const clientToWorldTopLeft = (clientX: number, clientY: number): Vec => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    const wx = (clientX - left - pan.x) / scale;
    const wy = (clientY - top - pan.y) / scale;
    return { x: wx - sizeWorld / 2, y: wy - sizeWorld / 2 };
    // NOTE: we keep positions as top-left in world space
  };

  const startDragIfMoved = (clientX: number, clientY: number) => {
    if (!press.current) return false;
    const dx = clientX - press.current.x;
    const dy = clientY - press.current.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX && !dragging) {
      // initialize from current screen position -> world
      const worldX = (posScreen.x - pan.x) / scale;
      const worldY = (posScreen.y - pan.y) / scale;
      const p0 = { x: worldX, y: worldY };
      lastWorld.current = p0;
      setDragging(true);
      onPinStart(id, p0);
      return true;
    }
    return dragging;
  };

  const handlePointerDown = (x: number, y: number) => {
    press.current = { x, y };
  };

  const handlePointerMove = (x: number, y: number, buttons: number) => {
    if (!buttons) return; // released
    if (!press.current) return;

    const isDragging = startDragIfMoved(x, y);
    if (!isDragging) return;

    const p = clientToWorldTopLeft(x, y);
    onPinMove(id, p);
    lastWorld.current = p;
  };

  const handlePointerUp = () => {
    if (dragging) {
      const p = lastWorld.current;
      if (p) onPinEnd(id, p, { vx: 0, vy: 0 });
      setDragging(false);
      ignoreNextClick.current = true;
      window.setTimeout(() => (ignoreNextClick.current = false), 180);
    }
    press.current = null;
    lastWorld.current = null;
  };

  const handleClick = () => {
    if (ignoreNextClick.current) return;
    if (dragging) return;
    if (canToggle) onToggle(id);
  };

  const handleDoubleClick = () => {
    const url = (node.url || node.link || node.href || notionUrl || "").trim();
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  };

  return (
    <NodeBall
      id={id}
      title={title}
      x={posScreen.x}
      y={posScreen.y}
      size={sizeScreen}
      dragging={dragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      fill={fill}
      stroke={stroke}
      labelColor={labelColor}
    />
  );
};
