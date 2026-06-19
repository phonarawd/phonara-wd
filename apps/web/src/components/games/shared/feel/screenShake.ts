/**
 * Apply a brief shake animation to a DOM element via Web Animations API.
 * Returns the Animation handle; caller may cancel.
 * Honours prefers-reduced-motion: no-op when reduced.
 */
export function screenShake(
  el: HTMLElement | null,
  opts: { amplitude?: number; duration?: number; reduced?: boolean } = {},
): Animation | null {
  if (!el) return null;
  const { amplitude = 6, duration = 220, reduced = false } = opts;
  if (reduced) return null;
  if (typeof el.animate !== "function") return null;
  const frames: Keyframe[] = [
    { transform: "translate(0,0)" },
    { transform: `translate(${-amplitude}px, ${amplitude / 2}px)` },
    { transform: `translate(${amplitude}px, ${-amplitude / 2}px)` },
    { transform: `translate(${-amplitude / 2}px, 0)` },
    { transform: "translate(0,0)" },
  ];
  return el.animate(frames, { duration, easing: "ease-out" });
}
