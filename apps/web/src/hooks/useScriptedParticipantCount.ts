import { useMemo, useState } from "react";
import { useLiveCount } from "./useLiveCount";
import { useReducedMotionGuard } from "@/components/games/shared/hooks/useReducedMotionGuard";

export const SURVIVAL_PARTICIPANT_SEED = 3_842;

export type ScriptedParticipantCount = {
  count: number;
  bumpTick: number;
  bump: () => void;
};

export function useScriptedParticipantCount(seed = SURVIVAL_PARTICIPANT_SEED): ScriptedParticipantCount {
  const reducedMotion = useReducedMotionGuard();
  const liveBase = useLiveCount(seed, { active: !reducedMotion });
  const [tapBump, setTapBump] = useState(0);
  const [bumpTick, setBumpTick] = useState(0);

  const bump = () => {
    setTapBump((n) => n + 1);
    setBumpTick((n) => n + 1);
  };

  const count = useMemo(() => liveBase + tapBump, [liveBase, tapBump]);

  return { count, bumpTick, bump };
}
