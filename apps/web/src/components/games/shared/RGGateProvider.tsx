/**
 * RGGateProvider + useRGGate — Lovable mock for responsible-gaming
 * pre-bet gating. Cursor adapter injects a real `policy` at paste time;
 * default policy always allows.
 *
 * Contract: every game's `place_bet` path MUST `await gate("place_bet")`
 * before calling `onOpenBetConfirm`. Returning false blocks submit and
 * opens the RGGate dialog with the reason.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RGGate, type RGReason } from "./RGGate";

export type RGIntent = "place_bet" | "deposit" | "withdraw";

export type RGPolicy = (intent: RGIntent) => Promise<RGReason | null>;

interface RGGateContextValue {
  /** Returns true → caller may proceed, false → blocked (dialog shown). */
  gate: (intent: RGIntent) => Promise<boolean>;
  openWithReason: (reason: RGReason) => void;
  close: () => void;
}

const Ctx = createContext<RGGateContextValue | null>(null);

const DEFAULT_POLICY: RGPolicy = async () => null;

export interface RGGateProviderProps {
  policy?: RGPolicy;
  onOpenSettings?: () => void;
  children: ReactNode;
}

export function RGGateProvider({
  policy = DEFAULT_POLICY,
  onOpenSettings,
  children,
}: RGGateProviderProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RGReason | null>(null);
  // Always read the freshest policy from the latest render.
  const policyRef = useRef(policy);
  policyRef.current = policy;

  const close = useCallback(() => setOpen(false), []);

  const openWithReason = useCallback((r: RGReason) => {
    setReason(r);
    setOpen(true);
  }, []);

  const gate = useCallback(async (intent: RGIntent) => {
    const r = await policyRef.current(intent);
    if (r) {
      setReason(r);
      setOpen(true);
      return false;
    }
    return true;
  }, []);

  const value = useMemo<RGGateContextValue>(
    () => ({ gate, openWithReason, close }),
    [gate, openWithReason, close],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <RGGate
        open={open}
        reason={reason}
        onClose={close}
        onOpenSettings={onOpenSettings}
      />
    </Ctx.Provider>
  );
}

/** Hook — must be called inside RGGateProvider. */
export function useRGGate(): RGGateContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useRGGate must be used within <RGGateProvider>");
  }
  return v;
}
