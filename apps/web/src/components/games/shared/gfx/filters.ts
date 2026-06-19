/** CSS filter strings. Pixi-equivalent filters land Phase 2+. */
export const neonGlow = (color = "#22d3ee", strength = 6): string =>
  `drop-shadow(0 0 ${strength}px ${color}) drop-shadow(0 0 ${strength * 2}px ${color})`;

export const scanlines = (opacity = 0.08): string =>
  `repeating-linear-gradient(0deg, rgba(255,255,255,${opacity}) 0 1px, transparent 1px 3px)`;

export const vignette = (intensity = 0.6): string =>
  `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${intensity}) 100%)`;
