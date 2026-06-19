import { useCallback, useEffect, useSyncExternalStore } from "react";

// L1-15-A — admin sports desk mock SOT.
// Hydration-safe: server + first client snapshot = SEED (stable identity).
// localStorage hydrate only inside useEffect → no SSR/CSR mismatch (mirrors useWalletMock).
// String-only money (BigInt). No Number()/parseFloat. No supabase/rpc — display-only.
// PHONARA adapter wires real rpc_admin_list_unsettled_sports_fixtures / rpc_admin_suspend_market.

const STORAGE_KEY = "admin:sports:state:v1";

export type SportsFixtureStatus = "live" | "ft" | "scheduled";

export interface SportsFixtureRow {
  id: string;
  league: string;
  home: string;
  away: string;
  kickoff: string; // ISO
  unsettledMarkets: number;
  exposure: string; // integer KRW string
  status: SportsFixtureStatus;
}

export interface MarketSuspension {
  fixtureId: string;
  reason: string;
  at: string; // ISO
}

export type RiskSeverity = "info" | "warn" | "crit";

export interface RiskEvent {
  id: string;
  severity: RiskSeverity;
  labelKey: string; // i18n key — never a Korean literal
  at: string;
}

export interface ExposureAggregate {
  total: string;
  max: string;
  openBets: number;
}

export type RiskTier = "A" | "B" | "C";

export interface AdminSportsState {
  featureEnabled: boolean;
  fixtures: SportsFixtureRow[];
  suspended: MarketSuspension[];
  risk: RiskEvent[];
  exposure: ExposureAggregate;
  tier: RiskTier;
}

// ── deterministic SEED ─────────────────────────────────────────────────
const SEED: AdminSportsState = Object.freeze({
  featureEnabled: true,
  fixtures: Object.freeze([
    {
      id: "FX-2026-0614-001",
      league: "EPL",
      home: "Arsenal",
      away: "Manchester City",
      kickoff: "2026-06-14T18:30:00.000Z",
      unsettledMarkets: 12,
      exposure: "48200000",
      status: "ft",
    },
    {
      id: "FX-2026-0614-002",
      league: "MLB",
      home: "Dodgers",
      away: "Yankees",
      kickoff: "2026-06-15T02:05:00.000Z",
      unsettledMarkets: 7,
      exposure: "21500000",
      status: "ft",
    },
    {
      id: "FX-2026-0615-003",
      league: "KBO",
      home: "LG Twins",
      away: "Doosan Bears",
      kickoff: "2026-06-15T09:30:00.000Z",
      unsettledMarkets: 3,
      exposure: "6200000",
      status: "ft",
    },
    {
      id: "FX-2026-0616-004",
      league: "UFC",
      home: "Adesanya",
      away: "Du Plessis",
      kickoff: "2026-06-16T03:00:00.000Z",
      unsettledMarkets: 5,
      exposure: "14800000",
      status: "ft",
    },
    {
      id: "FX-2026-0616-005",
      league: "NBA",
      home: "Celtics",
      away: "Nuggets",
      kickoff: "2026-06-16T23:30:00.000Z",
      unsettledMarkets: 2,
      exposure: "3400000",
      status: "scheduled",
    },
    {
      id: "FX-2026-0617-006",
      league: "World Cup Q",
      home: "Korea",
      away: "Japan",
      kickoff: "2026-06-17T10:00:00.000Z",
      unsettledMarkets: 9,
      exposure: "31200000",
      status: "live",
    },
  ]) as unknown as SportsFixtureRow[],
  suspended: Object.freeze([]) as unknown as MarketSuspension[],
  risk: Object.freeze([
    {
      id: "RE-001",
      severity: "crit",
      labelKey: "admin.sports.risk.event.exposureSpike",
      at: "2026-06-16T01:12:00.000Z",
    },
    {
      id: "RE-002",
      severity: "warn",
      labelKey: "admin.sports.risk.event.lateSettlement",
      at: "2026-06-16T00:48:00.000Z",
    },
    {
      id: "RE-003",
      severity: "warn",
      labelKey: "admin.sports.risk.event.oddsDriftFlag",
      at: "2026-06-15T23:30:00.000Z",
    },
    {
      id: "RE-004",
      severity: "info",
      labelKey: "admin.sports.risk.event.feedReconnect",
      at: "2026-06-15T22:10:00.000Z",
    },
  ]) as unknown as RiskEvent[],
  exposure: Object.freeze({
    total: "125300000",
    max: "60000000",
    openBets: 1842,
  }) as ExposureAggregate,
  tier: "B",
}) as AdminSportsState;

const cloneSeed = (): AdminSportsState => ({
  featureEnabled: SEED.featureEnabled,
  fixtures: SEED.fixtures.map((f) => ({ ...f })),
  suspended: SEED.suspended.map((s) => ({ ...s })),
  risk: SEED.risk.map((r) => ({ ...r })),
  exposure: { ...SEED.exposure },
  tier: SEED.tier,
});

// ── store ──────────────────────────────────────────────────────────────
let cached: AdminSportsState = cloneSeed();
let hydrated = false;
const listeners = new Set<() => void>();

function getSnapshot(): AdminSportsState {
  return cached;
}
function getServerSnapshot(): AdminSportsState {
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
      const parsed = JSON.parse(raw) as AdminSportsState;
      if (
        parsed &&
        typeof parsed.featureEnabled === "boolean" &&
        Array.isArray(parsed.fixtures) &&
        Array.isArray(parsed.suspended) &&
        Array.isArray(parsed.risk)
      ) {
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

function update(mut: (s: AdminSportsState) => AdminSportsState) {
  cached = mut(cached);
  persist();
  emit();
}

export interface AdminSportsActions {
  setFeatureEnabled: (enabled: boolean) => void;
  suspendMarket: (fixtureId: string, reason: string) => void;
  unsuspendMarket: (fixtureId: string) => void;
  resetForTest: () => void;
}

export function useAdminSportsMock(): AdminSportsState & AdminSportsActions {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  const setFeatureEnabled = useCallback((enabled: boolean) => {
    update((s) => ({ ...s, featureEnabled: enabled }));
  }, []);

  const suspendMarket = useCallback((fixtureId: string, reason: string) => {
    if (reason.trim().length < 4) return;
    update((s) => {
      if (s.suspended.some((x) => x.fixtureId === fixtureId)) return s;
      const entry: MarketSuspension = {
        fixtureId,
        reason: reason.trim(),
        at: new Date().toISOString(),
      };
      return { ...s, suspended: [entry, ...s.suspended] };
    });
  }, []);

  const unsuspendMarket = useCallback((fixtureId: string) => {
    update((s) => ({
      ...s,
      suspended: s.suspended.filter((x) => x.fixtureId !== fixtureId),
    }));
  }, []);

  const resetForTest = useCallback(() => {
    cached = cloneSeed();
    hydrated = true;
    persist();
    emit();
  }, []);

  return {
    ...state,
    setFeatureEnabled,
    suspendMarket,
    unsuspendMarket,
    resetForTest,
  };
}

// ── display helpers (string-only; no Number/parseFloat) ────────────────
export function formatKrwGrouped(intStr: string): string {
  const neg = intStr.startsWith("-");
  const body = neg ? intStr.slice(1) : intStr;
  const out = body.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}₩${out}`;
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 1) return "now";
  if (Math.abs(mins) < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
