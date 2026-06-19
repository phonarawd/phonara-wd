/**
 * Tiny scale "pop" animation. Returns Animation handle.
 * No-op under reduced motion.
 */
export function juice(
  el: HTMLElement | null,
  opts: { scale?: number; duration?: number; reduced?: boolean } = {},
): Animation | null {
  if (!el) return null;
  const { scale = 1.08, duration = 180, reduced = false } = opts;
  if (reduced) return null;
  if (typeof el.animate !== "function") return null;
  return el.animate(
    [{ transform: "scale(1)" }, { transform: `scale(${scale})` }, { transform: "scale(1)" }],
    { duration, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}
