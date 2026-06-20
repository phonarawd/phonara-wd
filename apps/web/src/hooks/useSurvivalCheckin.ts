import { useCallback, useMemo, useState } from "react";
import { t } from "@/i18n";
import { toast } from "@/hooks/use-toast";
import { useReducedMotionGuard } from "@/components/games/shared/hooks/useReducedMotionGuard";

const CHECKIN_STORAGE_KEY = "phonara_survival_checked_today";
const CHECKIN_RANK_KEY = "phonara_survival_rank_today";

export type SurvivalTierBand = "gold" | "silver" | "bronze" | "default";

export type SurvivalCheckin = {
  checkedInToday: boolean;
  scriptedRank: number | null;
  tierBand: SurvivalTierBand;
  onCheckIn: () => void;
};

function getKSTDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function readCheckedInToday(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(CHECKIN_STORAGE_KEY) === getKSTDateKey();
}

function readStoredRank(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  if (sessionStorage.getItem(CHECKIN_STORAGE_KEY) !== getKSTDateKey()) return null;
  const stored = sessionStorage.getItem(CHECKIN_RANK_KEY);
  if (!stored) return null;
  const rank = Number(stored);
  return Number.isFinite(rank) ? rank : null;
}

function writeCheckedInToday(rank: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(CHECKIN_STORAGE_KEY, getKSTDateKey());
  sessionStorage.setItem(CHECKIN_RANK_KEY, String(rank));
}

export function computeScriptedRank(tapIndex: number): number {
  return 8 + (tapIndex % 35);
}

export function tierBandFromRank(rank: number): SurvivalTierBand {
  if (rank === 1) return "gold";
  if (rank >= 2 && rank <= 10) return "silver";
  if (rank >= 11 && rank <= 1000) return "bronze";
  return "default";
}

export function tierLabelKey(band: SurvivalTierBand): string {
  switch (band) {
    case "gold":
      return "earn.survival.rank.tier.gold";
    case "silver":
      return "earn.survival.rank.tier.silver";
    case "bronze":
      return "earn.survival.rank.tier.bronze";
    default:
      return "earn.survival.rank.tier.default";
  }
}

export type UseSurvivalCheckinOptions = {
  phase: "before" | "open" | "closed";
  onParticipantBump?: () => void;
};

export function useSurvivalCheckin({ phase, onParticipantBump }: UseSurvivalCheckinOptions): SurvivalCheckin {
  const reducedMotion = useReducedMotionGuard();
  const [checkedInToday, setCheckedInToday] = useState(readCheckedInToday);
  const [scriptedRank, setScriptedRank] = useState<number | null>(() => readStoredRank());
  const [tapIndex, setTapIndex] = useState(0);

  const tierBand = useMemo(
    () => (scriptedRank !== null ? tierBandFromRank(scriptedRank) : "default"),
    [scriptedRank],
  );

  const onCheckIn = useCallback(() => {
    if (phase !== "open") return;

    if (checkedInToday) {
      toast(t("earn.survival.toast.already"));
      return;
    }

    const nextIndex = tapIndex + 1;
    const rank = computeScriptedRank(nextIndex - 1);
    setTapIndex(nextIndex);
    setScriptedRank(rank);
    setCheckedInToday(true);
    writeCheckedInToday(rank);

    toast(t("earn.survival.toast.checkedIn", { rank }));
    onParticipantBump?.();

    if (!reducedMotion && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [phase, checkedInToday, tapIndex, onParticipantBump, reducedMotion]);

  return {
    checkedInToday,
    scriptedRank,
    tierBand,
    onCheckIn,
  };
}
