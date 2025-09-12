// src/config/zoom.ts

export const ZOOM_MIN = 0.12;
export const ZOOM_MAX = 6;
export const ZOOM_STEP = 1.04;     // button +/- step
export const WHEEL_SENS = 0.0016;  // wheel sensitivity (smaller = gentler)

export const clampScale = (s: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s));
