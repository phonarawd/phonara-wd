import { useCallback, useMemo, useState } from "react";
import { useLiveCount } from "./useLiveCount";

export const GOLDEN_EARTH_DEFAULTS = {
  seed: 9_872_341,
  milestone: 10_000_000,
  urgencyThreshold: 9_900_000,
} as const;

export type ScriptedCounterConfig = {
  seed?: number;
  milestone?: number;
  urgencyThreshold?: number;
};

export type ScriptedCounter = {
  globalCount: number;
  remainingToMilestone: number;
  isUrgent: boolean;
  bump: () => void;
  bumpTick: number;
};

export function useScriptedCounter(config: ScriptedCounterConfig = {}): ScriptedCounter {
  const seed = config.seed ?? GOLDEN_EARTH_DEFAULTS.seed;
  const milestone = config.milestone ?? GOLDEN_EARTH_DEFAULTS.milestone;
  const urgencyThreshold = config.urgencyThreshold ?? GOLDEN_EARTH_DEFAULTS.urgencyThreshold;

  const liveBase = useLiveCount(seed);
  const [tapBump, setTapBump] = useState(0);
  const [bumpTick, setBumpTick] = useState(0);

  const bump = useCallback(() => {
    setTapBump((n) => n + 1);
    setBumpTick((n) => n + 1);
  }, []);

  const globalCount = liveBase + tapBump;
  const remainingToMilestone = Math.max(0, milestone - globalCount);
  const isUrgent = globalCount >= urgencyThreshold;

  return useMemo(
    () => ({
      globalCount,
      remainingToMilestone,
      isUrgent,
      bump,
      bumpTick,
    }),
    [globalCount, remainingToMilestone, isUrgent, bump, bumpTick],
  );
}
