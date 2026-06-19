import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import type { BetSlipLeg, BetSlipMode } from "./types";
import { displayOddsMultiply } from "./display-odds-multiply";

const STORAGE_KEY = "phonara.sports.slip";
const TTL_MS = 24 * 60 * 60 * 1000;
const COMBO_MAX = 8;
const SGP_MAX = 12;

type Currency = "PHON" | "USDT";

interface PersistShape {
  legs: BetSlipLeg[];
  mode: BetSlipMode;
  stake: string;
  systemK?: number;
  savedAt: number;
}

interface BetSlipApi {
  systemK: number;
  setSystemK: (k: number) => void;
  legs: BetSlipLeg[];
  mode: BetSlipMode;
  stake: string;
  currency: Currency;
  hasOutcome: (outcomeId: string) => boolean;
  toggleLeg: (leg: BetSlipLeg) => void;
  removeLeg: (outcomeId: string) => void;
  clear: () => void;
  setMode: (mode: BetSlipMode) => void;
  setStake: (stake: string) => void;
  setCurrency: (currency: Currency) => void;
  place: () => void;
  /** Display-only combined odds label (NO Decimal multiply — F6/B6). */
  combinedOddsLabel: string;
}

const Ctx = createContext<BetSlipApi | null>(null);

function loadPersisted(): PersistShape | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > TTL_MS
    ) {
      return null;
    }
    if (!Array.isArray(parsed.legs)) return null;
    return {
      legs: parsed.legs as BetSlipLeg[],
      mode: (parsed.mode as BetSlipMode) ?? "single",
      stake: typeof parsed.stake === "string" ? parsed.stake : "",
      systemK: typeof parsed.systemK === "number" ? parsed.systemK : undefined,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function persist(
  legs: BetSlipLeg[],
  mode: BetSlipMode,
  stake: string,
  systemK: number,
) {
  try {
    const payload: PersistShape = {
      legs,
      mode,
      stake,
      systemK,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / SSR */
  }
}

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [legs, setLegs] = useState<BetSlipLeg[]>([]);
  const [mode, setModeState] = useState<BetSlipMode>("single");
  const [stake, setStakeState] = useState<string>("");
  const [systemK, setSystemKState] = useState<number>(2);
  const [currency, setCurrencyState] = useState<Currency>("PHON");
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const p = loadPersisted();
    if (p) {
      setLegs(p.legs);
      setModeState(p.mode);
      setStakeState(p.stake);
      if (typeof p.systemK === "number") setSystemKState(p.systemK);
    }
    hydrated.current = true;
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    persist(legs, mode, stake, systemK);
  }, [legs, mode, stake, systemK]);

  // Keep systemK valid against current N (display only — no payout impact).
  useEffect(() => {
    const n = legs.length;
    if (n < 3) return;
    const max = n - 1;
    if (systemK < 2) setSystemKState(2);
    else if (systemK > max) setSystemKState(max);
  }, [legs.length, systemK]);

  const setSystemK = useCallback((k: number) => setSystemKState(k), []);

  const hasOutcome = useCallback(
    (outcomeId: string) => legs.some((l) => l.outcomeId === outcomeId),
    [legs],
  );

  const removeLeg = useCallback((outcomeId: string) => {
    setLegs((prev) => prev.filter((l) => l.outcomeId !== outcomeId));
  }, []);

  const toggleLeg = useCallback(
    (leg: BetSlipLeg) => {
      // V3-2 mutex — same outcome 재클릭 = dedupe(remove). 그 외, 같은 fixture+marketId
      // (1-of-N) 기존 leg는 교체. 교체는 length 증가 없음 → COMBO/SGP guard 통과.
      const isDedupe = legs.some((l) => l.outcomeId === leg.outcomeId);
      if (!isDedupe) {
        const sameMarketReplace = legs.some(
          (l) => l.fixtureId === leg.fixtureId && l.marketId === leg.marketId,
        );
        // length 증가하는 add일 때만 limit guard 평가.
        if (!sameMarketReplace) {
          // B1 — combo ≤8.
          if (mode === "combo" && legs.length >= COMBO_MAX) {
            toast(t("sports.slip.combo_max"));
            return;
          }
          // B2 — sgp ≤12 same fixture only.
          if (mode === "sgp") {
            if (legs.length >= SGP_MAX) {
              toast(t("sports.slip.combo_max"));
              return;
            }
            const firstFixture = legs[0]?.fixtureId;
            if (firstFixture && firstFixture !== leg.fixtureId) {
              toast(t("sports.slip.sgp_same_fixture"));
              return;
            }
          }
        }
      }
      setLegs((prev) =>
        prev.some((l) => l.outcomeId === leg.outcomeId)
          ? prev.filter((l) => l.outcomeId !== leg.outcomeId) // 기존 dedupe
          : [
              ...prev.filter(
                (l) =>
                  !(l.fixtureId === leg.fixtureId && l.marketId === leg.marketId),
              ),
              leg, // 1-of-N 교체
            ],
      );
    },
    [legs, mode],
  );

  const clear = useCallback(() => {
    setLegs([]);
    setStakeState("");
  }, []);

  const setMode = useCallback(
    (next: BetSlipMode) => {
      // Switching into sgp with mixed-fixture legs → trim to first fixture.
      if (next === "sgp" && legs.length > 0) {
        const first = legs[0]?.fixtureId;
        if (!first) {
          setModeState(next);
          return;
        }
        const same = legs.every((l) => l.fixtureId === first);
        if (!same) {
          setLegs(legs.filter((l) => l.fixtureId === first));
          toast(t("sports.slip.sgp_same_fixture"));
        }
      }
      // Switching into combo with > COMBO_MAX legs (defensive trim).
      if (next === "combo" && legs.length > COMBO_MAX) {
        setLegs(legs.slice(0, COMBO_MAX));
        toast(t("sports.slip.combo_max"));
      }
      setModeState(next);
    },
    [legs],
  );

  const setStake = useCallback((s: string) => {
    // Numeric-only display input · NOT money math.
    const clean = s.replace(/[^\d.]/g, "");
    setStakeState(clean);
  }, []);

  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);

  const combinedOddsLabel = useMemo(() => {
    // B6 — display-only · Decimal string multiply · payout/balance 0 · engine SOT 별도.
    if (legs.length === 0) return "—";
    if (mode === "system") return "—";
    if (mode === "single") return legs[0]?.oddsDisplay ?? "—";
    return displayOddsMultiply(legs.map((l) => l.oddsDisplay));
  }, [legs, mode]);

  const place = useCallback(() => {
    // B5 — Place click is gated by ConfirmDialog upstream; this fires after confirm.
    if (legs.length === 0) return;
    toast.success(t("sports.slip.place_mock_success"));
    clear();
  }, [legs.length, clear]);

  const value = useMemo<BetSlipApi>(
    () => ({
      legs,
      mode,
      stake,
      currency,
      systemK,
      setSystemK,
      hasOutcome,
      toggleLeg,
      removeLeg,
      clear,
      setMode,
      setStake,
      setCurrency,
      place,
      combinedOddsLabel,
    }),
    [
      legs,
      mode,
      stake,
      currency,
      systemK,
      setSystemK,
      hasOutcome,
      toggleLeg,
      removeLeg,
      clear,
      setMode,
      setStake,
      setCurrency,
      place,
      combinedOddsLabel,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBetSlip(): BetSlipApi {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useBetSlip must be used within <BetSlipProvider />");
  }
  return v;
}

export const __BETSLIP_GUARDS_INTERNAL__ = {
  COMBO_MAX,
  SGP_MAX,
  STORAGE_KEY,
} as const;
