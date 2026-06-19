import { useEffect, useRef } from "react";

export interface GameLoopOptions {
  /** Fixed-step update in seconds (default 1/60). */
  step?: number;
  /** Max accumulated time per frame to avoid spiral-of-death (s). */
  maxFrameTime?: number;
  /** Called as many times per frame as needed at fixed step. */
  update: (dt: number) => void;
  /** Called once per visible frame with interpolation alpha (0–1). */
  render?: (alpha: number) => void;
  /** Pause when document/tab is hidden. Default true. */
  pauseOnHidden?: boolean;
  /** Active flag. Loop runs only when true. */
  active?: boolean;
}

/**
 * Fixed-timestep rAF loop. Decouples logic rate from render rate so
 * animations stay smooth on 120Hz screens and stable on 30Hz devices.
 * Auto-pauses on tab blur, page hide, and `prefers-reduced-motion`
 * is respected at the caller's discretion (you can early-return inside update).
 */
export function useGameLoop({
  step = 1 / 60,
  maxFrameTime = 0.25,
  update,
  render,
  pauseOnHidden = true,
  active = true,
}: GameLoopOptions): void {
  const updateRef = useRef(update);
  const renderRef = useRef(render);
  updateRef.current = update;
  renderRef.current = render;

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      let frameTime = (now - last) / 1000;
      last = now;
      if (frameTime > maxFrameTime) frameTime = maxFrameTime;
      acc += frameTime;
      while (acc >= step) {
        updateRef.current(step);
        acc -= step;
      }
      const alpha = acc / step;
      renderRef.current?.(alpha);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (!pauseOnHidden) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [step, maxFrameTime, pauseOnHidden, active]);
}
