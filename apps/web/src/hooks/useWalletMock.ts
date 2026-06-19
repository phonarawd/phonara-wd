import { useCallback, useEffect, useSyncExternalStore } from "react";

// L1-10-W F1 + L1-10-W-AMEND D5 — wallet mock SOT.
// Hydration-safe: server + first client snapshot = SEED (stable).
// localStorage read happens only inside useEffect → no SSR/CSR mismatch.
// F9: six tx.type values; deposit/withdraw method in {crypto, krw, giftcard}.
// String-only amounts (BigInt math). No Number()/parseFloat anywhere.

const STORAGE_KEY = "wallet:state:v1";

export type WalletTxType =
  | "deposit"
  | "withdraw"
  | "bet"
  | "payout"
  | "cashout"
  | "bonus";

export type WalletTxStatus =
  | "pending"
  | "confirming"
  | "pending_review"
  | "complete"
  | "failed";

export type WalletDepositMethod = "crypto" | "krw" | "giftcard";
export type WalletWithdrawMethod = "crypto" | "krw";
export type WalletKycStatus = "unverified" | "pending" | "verified";

export interface WalletTx {
  id: string;
  type: WalletTxType;
  amount: string; // signed integer string; "+12000" / "-5000"
  status: WalletTxStatus;
  createdAt: string;
  method?: WalletDepositMethod; // present on deposit/withdraw rows
}

export interface WalletState {
  cash: string;
  bonus: string;
  locked: string;
  kyc: WalletKycStatus;
  tx: WalletTx[];
}

// ── deterministic SEED (frozen — stable identity for SSR/CSR snapshots) ──
const SEED: WalletState = Object.freeze({
  cash: "1250000",
  bonus: "50000",
  locked: "20000",
  kyc: "unverified" as WalletKycStatus,
  tx: Object.freeze([
    {
      id: "tx-seed-1",
      type: "deposit",
      amount: "+500000",
      status: "complete",
      createdAt: "2026-06-14T03:21:00.000Z",
      method: "krw",
    },
    {
      id: "tx-seed-2",
      type: "bet",
      amount: "-25000",
      status: "complete",
      createdAt: "2026-06-14T05:02:00.000Z",
    },
    {
      id: "tx-seed-3",
      type: "payout",
      amount: "+62500",
      status: "complete",
      createdAt: "2026-06-14T06:30:00.000Z",
    },
    {
      id: "tx-seed-4",
      type: "bonus",
      amount: "+10000",
      status: "complete",
      createdAt: "2026-06-15T01:00:00.000Z",
    },
    {
      id: "tx-seed-5",
      type: "cashout",
      amount: "+18400",
      status: "complete",
      createdAt: "2026-06-15T11:45:00.000Z",
    },
    {
      id: "tx-seed-6",
      type: "deposit",
      amount: "+200000",
      status: "pending_review",
      createdAt: "2026-06-15T22:10:00.000Z",
      method: "giftcard",
    },
  ]) as unknown as WalletTx[],
}) as WalletState;

const cloneSeed = (): WalletState => ({
  cash: SEED.cash,
  bonus: SEED.bonus,
  locked: SEED.locked,
  kyc: SEED.kyc,
  tx: SEED.tx.map((t) => ({ ...t })),
});

// ── string-only BigInt helpers ──
function addInt(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}
function subInt(a: string, b: string): string {
  return (BigInt(a) - BigInt(b)).toString();
}
function signedToInt(amount: string): string {
  if (amount.startsWith("+")) return amount.slice(1);
  return amount;
}

// ── store: cached starts as SEED on both server & client (hydration-safe) ──
let cached: WalletState = cloneSeed();
let hydrated = false;
const listeners = new Set<() => void>();

function getSnapshot(): WalletState {
  return cached;
}
function getServerSnapshot(): WalletState {
  return SEED;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletState;
      if (parsed && typeof parsed.cash === "string" && Array.isArray(parsed.tx)) {
        cached = parsed;
        emit();
        return;
      }
    }
  } catch {
    // fall through
  }
  persist();
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function update(mut: (s: WalletState) => WalletState) {
  cached = mut(cached);
  persist();
  emit();
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(
    Math.random() * 1e6,
  ).toString(36)}`;
}

// ── public API ──
export interface WalletActions {
  pushDepositPending: (amount: string, method: WalletDepositMethod) => string;
  completeDeposit: (id: string, netAmount: string) => void;
  requestWithdraw: (amount: string, method?: WalletWithdrawMethod) => string;
  completeWithdraw: (id: string) => void;
  resetForTest: () => void;
  setKyc: (status: WalletKycStatus) => void;
}

export function useWalletMock(): WalletState & WalletActions {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hydrate from localStorage AFTER first render (matches SSR HTML exactly).
  useEffect(() => {
    hydrateFromStorage();
  }, []);

  const pushDepositPending = useCallback(
    (amount: string, method: WalletDepositMethod): string => {
      const id = genId("dep");
      update((s) => {
        const entry: WalletTx = {
          id,
          type: "deposit",
          amount: `+${signedToInt(amount)}`,
          // giftcard requires manual review; others go through normal pending.
          status: method === "giftcard" ? "pending_review" : "pending",
          createdAt: new Date().toISOString(),
          method,
        };
        return { ...s, tx: [entry, ...s.tx].slice(0, 50) };
      });
      return id;
    },
    [],
  );

  const completeDeposit = useCallback((id: string, netAmount: string) => {
    update((s) => ({
      ...s,
      cash: addInt(s.cash, netAmount),
      tx: s.tx.map((x) =>
        x.id === id
          ? ({ ...x, status: "complete", amount: `+${netAmount}` } as WalletTx)
          : x,
      ),
    }));
  }, []);

  const requestWithdraw = useCallback(
    (amount: string, method: WalletWithdrawMethod = "crypto"): string => {
      const id = genId("wd");
      update((s) => {
        const entry: WalletTx = {
          id,
          type: "withdraw",
          amount: `-${signedToInt(amount)}`,
          status: "pending",
          createdAt: new Date().toISOString(),
          method,
        };
        return {
          ...s,
          cash: subInt(s.cash, signedToInt(amount)),
          tx: [entry, ...s.tx].slice(0, 50),
        };
      });
      return id;
    },
    [],
  );

  const completeWithdraw = useCallback((id: string) => {
    update((s) => ({
      ...s,
      tx: s.tx.map((x) =>
        x.id === id ? ({ ...x, status: "complete" } as WalletTx) : x,
      ),
    }));
  }, []);

  const resetForTest = useCallback(() => {
    cached = cloneSeed();
    hydrated = true;
    persist();
    emit();
  }, []);

  const setKyc = useCallback((status: WalletKycStatus) => {
    update((s) => ({ ...s, kyc: status }));
  }, []);

  return {
    ...state,
    pushDepositPending,
    completeDeposit,
    requestWithdraw,
    completeWithdraw,
    resetForTest,
    setKyc,
  };
}
