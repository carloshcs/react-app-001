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
  // Your project seems to accept an optional velocity on end; keeping that call shape:
  onPinEnd:   (id: string, p: { x: number; y: number }, v?: { vx: number; vy: number }) => void;
  onToggle: (id: string) => void;
  canToggle?: boolean;
};

const HOLD_MS = 220;      // press-and-hold duration to start dragging
const CLICK_SUPPRESS_MS = 200; // suppress stray click right after a drag

export const NodeItem: React.FC<Props> = ({
  id, node, pos, containerRef, size, scale, pan,
  onPinStart, onPinMove, onPinEnd, onToggle, canToggle = true,
}) => {
  const [dragging, setDragging] = useState(false);

  // refs for gesture state
  const holdTimer = useRef<number | null>(null);
  const pressing = useRef(false);
  const pressClient = useRef<{ x: number; y: number } | null>(null);
  const offset = useRef({ dx: 0, dy: 0 });

  const lastPos = useRef<{ x: number; y: number; t: number } | null>(null);
  const ignoreNextClick = useRef(false);

  // --- helpers ---
  const getRect = () => containerRef.current?.getBoundingClientRect();

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = getRect();
    const left = rect?.left ?? 0, top = rect?.top ?? 0;
    const wx = (clientX - left - pan.x) / scale;
    const wy = (clientY - top  - pan.y) / scale;
    return { wx, wy };
  };

  const beginDrag = (clientX: number, clientY: number) => {
    // compute initial offset based on current pointer vs node pos
    const { wx, wy } = clientToWorld(clientX, clientY);
    offset.current.dx = wx - pos.x;
    offset.current.dy = wy - pos.y;
    setDragging(true);
    onPinStart(id, pos);

    // start listening globally
    window.addEventListener("mousemove", onMoveMouse);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMoveTouch, { passive: true });
    window.addEventListener("touchend", onUp);
  };

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // --- movement handlers (active only while dragging) ---
  const onMoveMouse = (e: MouseEvent) => {
    if (!dragging) return;
    const { wx, wy } = clientToWorld(e.clientX, e.clientY);
    const newX = wx - offset.current.dx;
    const newY = wy - offset.current.dy;
    onPinMove(id, { x: newX, y: newY });
    const now = Date.now();
    lastPos.current = { x: newX, y: newY, t: now };
  };

  const onMoveTouch = (e: TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    if (!t) return;
    const { wx, wy } = clientToWorld(t.clientX, t.clientY);
    onPinMove(id, { x: wx - offset.current.dx, y: wy - offset.current.dy });
    const now = Date.now();
    lastPos.current = { x: wx - offset.current.dx, y: wy - offset.current.dy, t: now };
  };

  const onUp = () => {
    clearHold();
    pressing.current = false;

    if (dragging) {
      // finish drag, compute velocity
      setDragging(false);
      let x = pos.x, y = pos.y, vx = 0, vy = 0;
      if (lastPos.current) {
        const lp = lastPos.current;
        const dt = Math.max(0.001, (Date.now() - lp.t) / 1000);
        x = lp.x; y = lp.y;
        // Velocity is tricky with last sample; keep simple or set 0
        vx = 0; vy = 0;
      }
      onPinEnd(id, { x, y }, { vx, vy });

      // prevent click toggle right after drag
      ignoreNextClick.current = true;
      window.setTimeout(() => { ignoreNextClick.current = false; }, CLICK_SUPPRESS_MS);

      // remove listeners
      window.removeEventListener("mousemove", onMoveMouse);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMoveTouch);
      window.removeEventListener("touchend", onUp);
    }
  };

  useEffect(() => {
    // cleanup on unmount
    return () => {
      clearHold();
      window.removeEventListener("mousemove", onMoveMouse);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMoveTouch);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- press start (mouse/touch) -> set a hold timer to actually start drag ---
  const onPressStart = (clientX: number, clientY: number) => {
    pressing.current = true;
    pressClient.current = { x: clientX, y: clientY };

    clearHold();
    holdTimer.current = window.setTimeout(() => {
      // If still pressing after HOLD_MS, start drag
      if (pressing.current && pressClient.current) {
        beginDrag(pressClient.current.x, pressClient.current.y);
      }
    }, HOLD_MS) as unknown as number;
  };

  // Click handlers from NodeBall
  const handleClick = () => {
    // Ignore a click that comes right after a drag
    if (ignoreNextClick.current) return;
    if (dragging) return; // safety
    // If we’re still in the hold window, this click will clear the hold in onUp anyway
    if (canToggle) onToggle(id);
  };

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
      // Start a potential drag only after HOLD_MS (press-and-hold)
      onMouseDown={(x, y) => onPressStart(x, y)}
      onMouseMove={() => {}}
      onMouseUp={() => onUp()}
      onTouchStart={(x, y) => onPressStart(x, y)}
      onTouchMove={() => {}}
      onTouchEnd={() => onUp()}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
    />
  );
};
