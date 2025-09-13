// Force configuration for Mind Map 1 only.
// Each future map gets its own file with the same shape.

export type ForceConfig = {
  /** Many-body repulsion strength (negative). */
  repulsion: number;
  /** Extra padding for collision radius. */
  collidePadding: number;
  /** Simulation alpha decay hint (kept for API symmetry even if hook fixes its own). */
  alphaDecay: number;
  /** Optional velocity decay hint (some hooks may use it). */
  velocityDecay?: number;
};

export const FORCE_CONFIG_MIND1: ForceConfig = {
  // Match your current “older” physics feel
  repulsion: -1000,
  collidePadding: 8,
  alphaDecay: 0.06,
  velocityDecay: 0.25, // hook may ignore; kept for future map hooks
};
