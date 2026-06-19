import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { AdminAuditEvent } from "@/components/admin/primitives";

// L1-15-P0 N9 — admin mock hook factory.
// Hydration-safe: server + first client snapshot = SEED.
// localStorage hydrate inside useEffect. No supabase/rpc.

export interface AdminMockHookConfig<TRow, TFilters> {
  storageKey: string;
  seedRows: TRow[];
  seedFilters: TFilters;
  filterFn?: (rows: TRow[], filters: TFilters) => TRow[];
  auditCap?: number;
}

export interface AdminMockState<TRow, TFilters> {
  allRows: TRow[];
  filters: TFilters;
  audit: AdminAuditEvent[];
}

export interface AdminMockHookResult<TRow, TFilters> {
  rows: TRow[]; // filtered
  allRows: TRow[];
  filters: TFilters;
  setFilters: (f: TFilters | ((prev: TFilters) => TFilters)) => void;
  patchRow: (
    key: string,
    keyOf: (row: TRow) => string,
    mut: (row: TRow) => TRow,
  ) => void;
  appendAudit: (e: AdminAuditEvent) => void;
  audit: AdminAuditEvent[];
  hydrated: boolean;
  resetForTest: () => void;
}

export function createAdminMockHook<TRow, TFilters>(
  cfg: AdminMockHookConfig<TRow, TFilters>,
): () => AdminMockHookResult<TRow, TFilters> {
  const cap = cfg.auditCap ?? 50;

  const seed = (): AdminMockState<TRow, TFilters> => ({
    allRows: cfg.seedRows.slice(),
    filters: structuredClone(cfg.seedFilters),
    audit: [],
  });

  let cached: AdminMockState<TRow, TFilters> = seed();
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const persist = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(cfg.storageKey, JSON.stringify(cached));
      }
    } catch {
      // ignore quota / private mode
    }
  };

  const hydrateFromStorage = () => {
    if (hydrated) return;
    hydrated = true;
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(cfg.storageKey);
      if (!raw) {
        persist();
        return;
      }
      const parsed = JSON.parse(raw) as AdminMockState<TRow, TFilters>;
      if (parsed && Array.isArray(parsed.allRows) && Array.isArray(parsed.audit)) {
        cached = parsed;
        emit();
        return;
      }
    } catch {
      // fall through
    }
    persist();
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };

  const getSnapshot = () => cached;
  const getServerSnapshot = () => seed(); // always SEED (F5 LOCK)

  const update = (
    mut: (s: AdminMockState<TRow, TFilters>) => AdminMockState<TRow, TFilters>,
  ) => {
    cached = mut(cached);
    persist();
    emit();
  };

  return function useAdminMock(): AdminMockHookResult<TRow, TFilters> {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
      hydrateFromStorage();
    }, []);

    const setFilters = useCallback(
      (f: TFilters | ((prev: TFilters) => TFilters)) => {
        update((s) => ({
          ...s,
          filters:
            typeof f === "function"
              ? (f as (p: TFilters) => TFilters)(s.filters)
              : f,
        }));
      },
      [],
    );

    const patchRow = useCallback(
      (
        key: string,
        keyOf: (row: TRow) => string,
        mut: (row: TRow) => TRow,
      ) => {
        update((s) => ({
          ...s,
          allRows: s.allRows.map((r) => (keyOf(r) === key ? mut(r) : r)),
        }));
      },
      [],
    );

    const appendAudit = useCallback((e: AdminAuditEvent) => {
      update((s) => ({
        ...s,
        audit: [e, ...s.audit].slice(0, cap),
      }));
    }, []);

    const resetForTest = useCallback(() => {
      cached = seed();
      hydrated = true;
      persist();
      emit();
    }, []);

    const rows = cfg.filterFn
      ? cfg.filterFn(state.allRows, state.filters)
      : state.allRows;

    return {
      rows,
      allRows: state.allRows,
      filters: state.filters,
      setFilters,
      patchRow,
      appendAudit,
      audit: state.audit,
      hydrated,
      resetForTest,
    };
  };
}
