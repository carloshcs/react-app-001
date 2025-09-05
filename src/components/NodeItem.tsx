import React, { RefObject, useRef, useState } from "react";
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
  onPinEnd:   (id: string, p: { x: number; y: number }, v?: { vx: number; vy: number }) => void;
  onToggle: (id: string) => void;
  canToggle?: boolean;
};

const DRAG_START_THRESHOLD = 4;     // px, to distinguish click from drag
const CLICK_SUPPRESS_MS = 180;      // ignore click right after a drag
const SINGLE_CLICK_DELAY = 250;     // to differentiate single vs double click

export const NodeItem: React.FC<Props> = ({
  id, node, pos, containerRef, size, scale, pan,
  onPinStart, onPinMove, onPinEnd, onToggle, canToggle = true,
}) => {
  const [dragging, setDragging] = useState(false);

  // pointer state
  const pointerActive = useRef(false);
  const startClient = useRef<{ x: number; y: number } | null>(null);
  const startedDrag = useRef(false);
  const offset = useRef({ dx: 0, dy: 0 });
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // click control
  const justDragged = useRef(false);
  const clickTimer = useRef<number | null>(null);

  const getRect = () => containerRef.current?.getBoundingClientRect();
  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = getRect();
    const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const wx = (clientX - left - pan.x) / scale;
    const wy = (clientY - top  - pan.y) / scale;
    return { wx, wy };
  };

  // ---- POINTER FLOW (works for mouse and touch) ----
  const onPointerDown = (clientX: number, clientY: number, buttons: number) => {
    pointerActive.current = buttons !== 0; // must be pressed
    startClient.current = { x: clientX, y: clientY };
    startedDrag.current = false;
    lastPos.current = null;
  };

  const maybeStartDrag = (clientX: number, clientY: number) => {
    if (!startClient.current || startedDrag.current === true) return;
    const dx = clientX - startClient.current.x;
    const dy = clientY - startClient.current.y;
    if (dx * dx + dy * dy >= DRAG_START_THRESHOLD * DRAG_START_THRESHOLD) {
      const { wx, wy } = clientToWorld(startClient.current.x, startClient.current.y);
      offset.current.dx = wx - pos.x;
      offset.current.dy = wy - pos.y;

      startedDrag.current = true;
      setDragging(true);
      onPinStart(id, pos);
    }
  };

  const onPointerMove = (clientX: number, clientY: number, buttons: number) => {
    // If the button isn't held anymore, end any drag immediately.
    if (buttons === 0) {
      if (pointerActive.current) endDrag();
      pointerActive.current = false;
      return;
    }
    if (!pointerActive.current) return;

    maybeStartDrag(clientX, clientY);

    if (startedDrag.current) {
      const { wx, wy } = clientToWorld(clientX, clientY);
      const newX = wx - offset.current.dx;
      const newY = wy - offset.current.dy;
      onPinMove(id, { x: newX, y: newY });
      lastPos.current = { x: newX, y: newY };
    }
  };

  const onPointerUp = () => {
    if (pointerActive.current) endDrag();
    pointerActive.current = false;
  };

  const endDrag = () => {
    if (startedDrag.current) {
      setDragging(false);
      const p = lastPos.current ?? pos;
      onPinEnd(id, p, { vx: 0, vy: 0 });
      startedDrag.current = false;

      // ignore the click that often follows a drag release
      justDragged.current = true;
      window.setTimeout(() => (justDragged.current = false), CLICK_SUPPRESS_MS);
    }
    startClient.current = null;
  };

  // ---- CLICK / DOUBLE CLICK (don’t fire after a drag) ----
  const handleClick = () => {
    if (dragging || startedDrag.current || justDragged.current) return;

    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      if (canToggle) onToggle(id);
    }, SINGLE_CLICK_DELAY) as unknown as number;
  };

  const handleDoubleClick = () => {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
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
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  );
};
