import { clamp } from './math'

export function radialPositions(cx: number, cy: number, count: number, radius: number) {
  const out: { x: number; y: number }[] = []
  if (count === 0) return out
  const step = (Math.PI * 2) / count
  for (let i = 0; i < count; i++) {
    const angle = i * step - Math.PI / 2
    out.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return out
}

export function clampToBox(x: number, y: number, size: number, width: number, height: number) {
  return {
    x: clamp(x, 0, Math.max(0, width - size)),
    y: clamp(y, 0, Math.max(0, height - size)),
  }
}
