import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
import { toast } from "@/hooks/use-toast";
import { celebrate } from "@/lib/confetti";
import { useReducedMotionGuard } from "@/components/games/shared/hooks/useReducedMotionGuard";
import { GOLDEN_EARTH_DEFAULTS } from "./useScriptedCounter";

const GLOBAL_JACKPOT_SEEN_KEY = "phonara_golden_earth_jackpot_seen";
const DEMO_PRIZE_AMOUNT = "1,000,000";

export type UseGoldenEarthTapOptions = {
  bump: () => void;
  globalCount: number;
  milestone?: number;
  jackpotEvery?: number;
};

export type GoldenEarthTap = {
  personalTaps: number;
  onTap: () => void;
  jackpotOpen: boolean;
  dismissJackpot: () => void;
  lastJackpotNth: number;
};

export function useGoldenEarthTap({
  bump,
  globalCount,
  milestone = GOLDEN_EARTH_DEFAULTS.milestone,
  jackpotEvery = 50,
}: UseGoldenEarthTapOptions): GoldenEarthTap {
  const reducedMotion = useReducedMotionGuard();
  const [personalTaps, setPersonalTaps] = useState(0);
  const [jackpotOpen, setJackpotOpen] = useState(false);
  const [lastJackpotNth, setLastJackpotNth] = useState(0);
  const prevGlobalRef = useRef(globalCount);

  const openJackpot = useCallback((nth: number) => {
    setLastJackpotNth(nth);
    setJackpotOpen(true);
    celebrate("medium");
  }, []);

  const onTap = useCallback(() => {
    bump();
    const nextPersonal = personalTaps + 1;
    setPersonalTaps(nextPersonal);

    const amount = Math.random() < 0.5 ? 1 : 2;
    toast(t("earn.goldenEarth.toast.bump", { amount }));

    if (!reducedMotion && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    const nextGlobal = globalCount + 1;
    const crossedGlobal =
      prevGlobalRef.current < milestone && nextGlobal >= milestone;
    const globalSeen =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(GLOBAL_JACKPOT_SEEN_KEY) === "1";

    if (nextPersonal > 0 && nextPersonal % jackpotEvery === 0) {
      openJackpot(nextPersonal);
      return;
    }

    if (crossedGlobal && !globalSeen) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(GLOBAL_JACKPOT_SEEN_KEY, "1");
      }
      openJackpot(nextPersonal);
    }
  }, [bump, personalTaps, globalCount, milestone, jackpotEvery, reducedMotion, openJackpot]);

  useEffect(() => {
    prevGlobalRef.current = globalCount;
  }, [globalCount]);

  const dismissJackpot = useCallback(() => {
    setJackpotOpen(false);
    toast(t("earn.goldenEarth.jackpot.dismissToast"));
  }, []);

  return {
    personalTaps,
    onTap,
    jackpotOpen,
    dismissJackpot,
    lastJackpotNth,
  };
}

export { DEMO_PRIZE_AMOUNT };
