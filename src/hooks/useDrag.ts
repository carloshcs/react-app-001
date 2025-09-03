import { useRef, useState, useCallback } from "react";
import { clampToBox } from "../utils/geometry";

type Vec = { x: number; y: number };

export function useDrag(initial: Vec, size: number) {
  const [pos, setPos] = useState<Vec>(initial);
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);

  const offsetRef = useRef({ dx: 0, dy: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getBounds = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      left: rect?.left ?? 0,
      top: rect?.top ?? 0,
      width: rect?.width ?? window.innerWidth,
      height: rect?.height ?? window.innerHeight
    };
  };

  const performMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return;
      const b = getBounds();
      const x = clientX - b.left - offsetRef.current.dx;
      const y = clientY - b.top - offsetRef.current.dy;
      setPos(clampToBox(x, y, size, b.width, b.height));
      moved.current = true;
    },
    [dragging, size]
  );

  const onMouseMove = (e: MouseEvent) => performMove(e.clientX, e.clientY);
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) performMove(t.clientX, t.clientY);
  };

  const stopAll = () => {
    setDragging(false);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopAll);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", stopAll);
  };

  const start = (clientX: number, clientY: number, container: HTMLDivElement | null) => {
    containerRef.current = container;
    const b = getBounds();
    offsetRef.current.dx = clientX - b.left - pos.x;
    offsetRef.current.dy = clientY - b.top - pos.y;
    moved.current = false;
    setDragging(true);

    // capture pointer globally while dragging
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopAll);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stopAll);
  };

  // Optional direct calls from child component; safe no-ops when not dragging
  const move = (clientX: number, clientY: number) => performMove(clientX, clientY);
  const stop = () => stopAll();

  return { pos, setPos, dragging, start, move, stop, moved };
}
