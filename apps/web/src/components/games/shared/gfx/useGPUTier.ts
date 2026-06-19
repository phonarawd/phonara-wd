import { useEffect, useState } from "react";

export type GPUTier = "low" | "mid" | "high";

/**
 * Coarse GPU tier hint derived from devicePixelRatio + hardwareConcurrency.
 * Real WebGL probing happens in Phase 2 when Pixi is wired.
 */
export function useGPUTier(): GPUTier {
  const [tier, setTier] = useState<GPUTier>("mid");
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const cores = navigator.hardwareConcurrency ?? 4;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    if (cores <= 2 || dpr < 1.5) setTier("low");
    else if (cores >= 8 && dpr >= 2) setTier("high");
    else setTier("mid");
  }, []);
  return tier;
}
