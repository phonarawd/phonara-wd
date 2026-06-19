/**
 * A · gfx — GPU adapters & visual filters (Phase 1 export-only).
 * Game wiring (Pixi / WebGL) lands in Phase 2+.
 */
export { useGPUTier } from "./useGPUTier";
export type { GPUTier } from "./useGPUTier";
export { neonGlow, scanlines, vignette } from "./filters";
