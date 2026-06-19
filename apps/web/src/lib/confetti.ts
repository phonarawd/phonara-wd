import confetti from "canvas-confetti";

/**
 * Short reward confetti — call only after mount (event handlers, etc.).
 * No-op when prefers-reduced-motion is active.
 */
export function celebrate(intensity: "small" | "medium" | "large" = "medium") {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const counts = { small: 60, medium: 110, large: 180 } as const;
  confetti({
    particleCount: counts[intensity],
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: ["#00F5C0", "#F5C84C", "#8B5CF6", "#4DABFF"],
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}
