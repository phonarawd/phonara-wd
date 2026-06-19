import { useEffect, useRef, useState } from "react";

/**
 * P1.2 perf — IntersectionObserver gate (one-shot or continuous).
 *
 * Returns `true` once `ref.current` has intersected the viewport.
 * SSR-safe (returns false) — used to defer expensive timers on off-screen cards.
 *
 * `once: true` (default) keeps it `true` after first reveal (cheap mount work, no re-evaluate).
 * `once: false` toggles with viewport, useful for pausing timers when scrolled away.
 */
export function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  options: IntersectionObserverInit & { once?: boolean } = {},
): boolean {
  const { once = true, root, rootMargin = "120px", threshold = 0 } = options;
  const [inView, setInView] = useState(false);
  const onceRef = useRef(once);
  onceRef.current = once;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (onceRef.current) io.disconnect();
        } else if (!onceRef.current) {
          setInView(false);
        }
      },
      { root, rootMargin, threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref, root, rootMargin, threshold]);

  return inView;
}
