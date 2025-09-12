// src/config/palette.ts

export type PaletteKey =
  | "minimal"
  | "forest"
  | "ocean"
  | "sunset"
  | "candy"
  | "slate"
  | "aurora"
  | "orchid";

export const MINIMAL_GRAY = "#e5e7eb";

export const PALETTES: Record<PaletteKey, string[]> = {
  minimal: [MINIMAL_GRAY],
  forest: ["#e8f5e9","#c8e6c9","#a5d6a7","#81c784","#43a047","#2e7d32"],
  ocean:  ["#e0f2fe","#bae6fd","#7dd3fc","#38bdf8","#0ea5e9","#0369a1"],
  sunset: ["#fff1f2","#ffe4e6","#fecdd3","#fb7185","#f43f5e","#be123c"],
  candy:  ["#fce7f3","#fbcfe8","#f9a8d4","#f472b6","#ec4899","#be185d"],
  slate:  ["#f8fafc","#e2e8f0","#cbd5e1","#94a3b8","#64748b","#334155"],
  aurora: ["#ecfeff","#cffafe","#a5f3fc","#67e8f9","#22d3ee","#0891b2"],
  orchid: ["#faf5ff","#f3e8ff","#e9d5ff","#d8b4fe","#c084fc","#7c3aed"],
};

function luminance(hex: string) {
  const s = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.substring(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function readableText(fill: string) {
  return luminance(fill) > 0.6 ? "#111827" : "#ffffff";
}
