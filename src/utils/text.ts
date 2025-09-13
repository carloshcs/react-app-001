// Shared helpers for fitting labels into circular nodes (or other constrained boxes)

export type FitTitleOpts = {
  /** Max number of lines to render. Default: 3 */
  maxLines?: number;
  /** Minimum and maximum font size (px). Defaults: 11–20 */
  minFont?: number;
  maxFont?: number;
  /**
   * Base font size factor relative to diameter.
   * fontSize ≈ diameter * sizeFactor (then clamped by min/max). Default: 0.18
   */
  sizeFactor?: number;
  /** Horizontal padding as a fraction of diameter. Default: 0.11 */
  sidePaddingFactor?: number;
  /** Line height multiplier. Default: 1.12 */
  lineHeightFactor?: number;
};

/**
 * Deterministic fit for a title inside a circle of given diameter.
 * We avoid DOM measurement for performance and use a stable heuristic:
 * - approximate average character width ~= 0.54 * fontSize for semi-bold sans.
 * - wrap by words up to `maxLines`
 * - truncate with ellipsis when needed.
 */
export function fitTitleToCircle(
  rawTitle: string,
  diameter: number,
  opts: FitTitleOpts = {}
): { lines: string[]; fontSize: number; lineHeight: number } {
  const {
    maxLines = 3,
    minFont = 11,
    maxFont = 20,
    sizeFactor = 0.18,
    sidePaddingFactor = 0.11,
    lineHeightFactor = 1.12,
  } = opts;

  const title = (rawTitle || "").trim();
  const baseFont = clamp(minFont, Math.round(diameter * sizeFactor), maxFont);
  const pad = Math.max(6, diameter * sidePaddingFactor);
  const usableWidth = Math.max(10, diameter - pad * 2);

  // Average character width heuristic for Inter/Segoe semi-bold
  const avgCharW = 0.54 * baseFont;
  const maxCharsPerLine = Math.max(6, Math.floor(usableWidth / avgCharW));

  if (!title) {
    const lineHeight = baseFont * lineHeightFactor;
    return { lines: [""], fontSize: baseFont, lineHeight };
  }

  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";

  for (const w of words) {
    const addLen = cur ? cur.length + 1 + w.length : w.length;
    if (addLen <= maxCharsPerLine) {
      cur = cur ? cur + " " + w : w;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break; // last line reserved for overflow/truncation
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);

  // If we still overflow (total text longer than we could place), ellipsize the last line.
  const joined = words.join(" ");
  if (lines.length === maxLines && joined.length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last.length > 1) {
      const room = Math.max(0, maxCharsPerLine - 1);
      lines[lines.length - 1] = last.slice(0, room).trimEnd() + "…";
    }
  }

  // Single super-long token (no spaces) fallback: slightly reduce base font and retry once.
  if (lines.length === 1 && lines[0].length > maxCharsPerLine + 2) {
    const smallerFont = clamp(minFont, Math.floor(baseFont * 0.92), maxFont);
    const smallerAvgCharW = 0.54 * smallerFont;
    const smallerMaxChars = Math.max(6, Math.floor(usableWidth / smallerAvgCharW));
    const line = lines[0];
    const trimmed = line.length > smallerMaxChars ? line.slice(0, smallerMaxChars - 1) + "…" : line;
    const lineHeight = smallerFont * lineHeightFactor;
    return { lines: [trimmed], fontSize: smallerFont, lineHeight };
  }

  const lineHeight = baseFont * lineHeightFactor;
  return { lines, fontSize: baseFont, lineHeight };
}

function clamp(min: number, v: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
