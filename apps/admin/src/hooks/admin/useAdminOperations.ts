import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/components/admin/primitives';
import { useAppConfig } from '../use-app-config';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';
import {
  getOpsHealthRaw,
  setFeatureEnabled,
  setSystemMode,
} from '../../domain/ops';
import type {
  AdminKillSwitchRow,
  AdminOpsHealthRow,
  OpsHealthCategory,
  OpsHealthFilters,
  OpsHealthStatus,
  OpsKillCategory,
  OpsKillFilters,
  OpsKillTone,
  UseAdminOperations,
} from './useAdminOperationsMock';

export type {
  AdminKillSwitchRow,
  AdminOpsHealthRow,
  OpsHealthCategory,
  OpsHealthFilters,
  OpsHealthStatus,
  OpsKillCategory,
  OpsKillFilters,
  OpsKillTone,
  UseAdminOperations,
} from './useAdminOperationsMock';

const MIN_REASON = 4;

const KILL_DEFS: Array<{
  id: string;
  switchKey: string;
  category: OpsKillCategory;
  labelKey: string;
  tone: OpsKillTone;
  configKey: string;
  feature?: string;
}> = [
  {
    id: 'ks_system_halt',
    switchKey: 'system_halt',
    category: 'system',
    labelKey: 'admin.operations.kill.label.system_halt',
    tone: 'danger',
    configKey: 'system_halt',
  },
  {
    id: 'ks_system_readonly',
    switchKey: 'system_readonly',
    category: 'system',
    labelKey: 'admin.operations.kill.label.system_readonly',
    tone: 'warning',
    configKey: 'system_readonly',
  },
  {
    id: 'ks_feature_deposit',
    switchKey: 'feature_deposit',
    category: 'wallet',
    labelKey: 'admin.operations.kill.label.feature_deposit',
    tone: 'primary',
    configKey: 'feature_deposit_enabled',
    feature: 'deposit',
  },
  {
    id: 'ks_feature_withdrawal',
    switchKey: 'feature_withdrawal',
    category: 'wallet',
    labelKey: 'admin.operations.kill.label.feature_withdrawal',
    tone: 'primary',
    configKey: 'feature_withdrawal_enabled',
    feature: 'withdrawal',
  },
  {
    id: 'ks_feature_spot',
    switchKey: 'feature_spot',
    category: 'trading',
    labelKey: 'admin.operations.kill.label.feature_spot',
    tone: 'primary',
    configKey: 'feature_spot_enabled',
    feature: 'spot',
  },
  {
    id: 'ks_feature_futures',
    switchKey: 'feature_futures',
    category: 'trading',
    labelKey: 'admin.operations.kill.label.feature_futures',
    tone: 'primary',
    configKey: 'feature_futures_enabled',
    feature: 'futures',
  },
  {
    id: 'ks_feature_staking',
    switchKey: 'feature_staking',
    category: 'trading',
    labelKey: 'admin.operations.kill.label.feature_staking',
    tone: 'primary',
    configKey: 'feature_staking_enabled',
    feature: 'staking',
  },
  {
    id: 'ks_feature_game',
    switchKey: 'feature_game',
    category: 'earn',
    labelKey: 'admin.operations.kill.label.feature_game',
    tone: 'primary',
    configKey: 'feature_game_enabled',
    feature: 'game',
  },
  {
    id: 'ks_feature_referral',
    switchKey: 'feature_referral',
    category: 'earn',
    labelKey: 'admin.operations.kill.label.feature_referral',
    tone: 'primary',
    configKey: 'feature_referral_enabled',
    feature: 'referral',
  },
];

function isRecord(value: Json | unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStatus(value: unknown): OpsHealthStatus {
  return value === 'critical' || value === 'warning' || value === 'ok' ? value : 'warning';
}

function healthCategoryFor(checkKey: string): OpsHealthCategory {
  if (checkKey.includes('cron') || checkKey.includes('liquidation')) return 'cron';
  if (checkKey.includes('queue') || checkKey.includes('lag')) return 'queue';
  if (checkKey.includes('budget')) return 'budget';
  return 'infra';
}

function mapHealthRows(value: Json): AdminOpsHealthRow[] {
  if (!isRecord(value)) return [];
  const rawChecks = Array.isArray(value['checks']) ? value['checks'] : [];
  return rawChecks
    .map((row, index): AdminOpsHealthRow | null => {
      if (!isRecord(row)) return null;
      const checkKey = typeof row['id'] === 'string' ? row['id'] : `check_${index}`;
      return {
        id: `oh_${checkKey}`,
        checkKey,
        category: healthCategoryFor(checkKey),
        status: parseStatus(row['status']),
        summary: typeof row['summary'] === 'string' ? row['summary'] : '',
        lastRunAt: typeof row['lastRunAt'] === 'string' ? row['lastRunAt'] : '',
        lastSuccessfulAt:
          typeof row['lastSuccessfulAt'] === 'string' ? row['lastSuccessfulAt'] : undefined,
        lastErrorAt: typeof row['lastErrorAt'] === 'string' ? row['lastErrorAt'] : undefined,
        observedAt:
          typeof row['observedAt'] === 'string'
            ? row['observedAt']
            : typeof value['lastUpdatedAt'] === 'string'
              ? value['lastUpdatedAt']
              : new Date().toISOString(),
      };
    })
    .filter((row): row is AdminOpsHealthRow => row !== null);
}

function filterHealth(rows: AdminOpsHealthRow[], f: OpsHealthFilters): AdminOpsHealthRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (f.category !== 'all' && r.category !== f.category) return false;
    if (!q) return true;
    return (
      r.checkKey.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
    );
  });
}

function filterKill(rows: AdminKillSwitchRow[], f: OpsKillFilters): AdminKillSwitchRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.category !== 'all' && r.category !== f.category) return false;
    if (!q) return true;
    return (
      r.switchKey.toLowerCase().includes(q) || r.labelKey.toLowerCase().includes(q)
    );
  });
}

const validReason = (r: string) => r.trim().length >= MIN_REASON;

const HEALTH_CATEGORIES: OpsHealthCategory[] = ['cron', 'queue', 'budget', 'infra'];
const KILL_CATEGORIES: OpsKillCategory[] = [
  'system',
  'wallet',
  'trading',
  'sports',
  'earn',
];

/** Engine-backed operations desk — replaces mock in production hubs. */
export function useAdminOperations(): UseAdminOperations {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: config, isFetched: configFetched } = useAppConfig();
  const configReady = configFetched;
  const { data: auditLogs = [] } = useAuditLogs(30);

  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ['app-config'] });
  }, [qc]);

  const { data: healthRows = [], refetch: refetchHealth } = useQuery({
    queryKey: ['ops-health', 'desk'],
    queryFn: async () => mapHealthRows(await getOpsHealthRaw()),
    enabled: mfaReady,
    staleTime: 60_000,
    refetchInterval: mfaReady ? 60_000 : false,
  });

  const [healthFilters, setHealthFilters] = useState<OpsHealthFilters>({
    search: '',
    status: 'all',
    category: 'all',
  });
  const [killFilters, setKillFilters] = useState<OpsKillFilters>({
    search: '',
    category: 'all',
  });

  const killSwitches = useMemo<AdminKillSwitchRow[]>(() => {
    return KILL_DEFS.map((def) => ({
      id: def.id,
      switchKey: def.switchKey,
      category: def.category,
      labelKey: def.labelKey,
      enabled: config?.[def.configKey] === 'true',
      tone: def.tone,
    }));
  }, [config]);

  const filteredHealth = useMemo(
    () => filterHealth(healthRows, healthFilters),
    [healthRows, healthFilters],
  );

  const filteredKillSwitches = useMemo(
    () => filterKill(killSwitches, killFilters),
    [killSwitches, killFilters],
  );

  const opsAudit = useMemo<AdminAuditEvent[]>(() => {
    return auditLogs.slice(0, 20).map((log) => ({
      id: log.id,
      at: log.created_at,
      actorKey: 'admin.primitive.audit.actor.system',
      actionKey: log.action,
      subject:
        typeof log.payload === 'object' && log.payload !== null
          ? String((log.payload as Record<string, unknown>)['feature'] ?? log.action)
          : log.action,
      reason:
        typeof log.payload === 'object' && log.payload !== null
          ? String((log.payload as Record<string, unknown>)['reason'] ?? '')
          : undefined,
    }));
  }, [auditLogs]);

  const refreshHealth = useCallback(() => {
    void refetchHealth();
    void qc.invalidateQueries({ queryKey: ['app-config'] });
  }, [qc, refetchHealth]);

  const applyKillMutation = useCallback(
    async (row: AdminKillSwitchRow, enabled: boolean, reason: string): Promise<boolean> => {
      const def = KILL_DEFS.find((d) => d.id === row.id);
      if (!def) return false;
      try {
        if (def.switchKey === 'system_halt' || def.switchKey === 'system_readonly') {
          const halt =
            def.switchKey === 'system_halt'
              ? enabled
              : config?.['system_halt'] === 'true';
          const readonly =
            def.switchKey === 'system_readonly'
              ? enabled
              : config?.['system_readonly'] === 'true';
          await setSystemMode({ halt, readonly, reason });
        } else if (def.feature) {
          await setFeatureEnabled({ feature: def.feature, enabled, reason });
        } else {
          return false;
        }
        await qc.refetchQueries({ queryKey: ['app-config'] });
        await qc.invalidateQueries({ queryKey: ['audit-logs'] });
        await qc.invalidateQueries({ queryKey: ['ops-health'] });
        return true;
      } catch {
        return false;
      }
    },
    [config, qc],
  );

  const setKillSwitch = useCallback(
    (id: string, enabled: boolean, reason: string): boolean => {
      if (!validReason(reason)) return false;
      const row = killSwitches.find((r) => r.id === id);
      if (!row || row.enabled === enabled) return false;
      void applyKillMutation(row, enabled, reason.trim());
      return true;
    },
    [applyKillMutation, killSwitches],
  );

  const confirmKillSwitch = useCallback(
    async (id: string, enabled: boolean, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = killSwitches.find((r) => r.id === id);
      if (!row || row.enabled === enabled) return false;
      return applyKillMutation(row, enabled, reason.trim());
    },
    [applyKillMutation, killSwitches],
  );

  const confirmBulkKillSwitch = useCallback(
    async (ids: string[], enabled: boolean, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        const row = killSwitches.find((r) => r.id === id);
        if (row && row.enabled !== enabled) {
          const ok = await applyKillMutation(row, enabled, reason.trim());
          if (ok) any = true;
        }
      }
      return any;
    },
    [applyKillMutation, killSwitches],
  );

  const bulkSetKillSwitch = useCallback(
    (ids: string[], enabled: boolean, reason: string): boolean => {
      if (!validReason(reason)) return false;
      let any = false;
      for (const id of ids) {
        const row = killSwitches.find((r) => r.id === id);
        if (row && row.enabled !== enabled) {
          void applyKillMutation(row, enabled, reason.trim());
          any = true;
        }
      }
      return any;
    },
    [applyKillMutation, killSwitches],
  );

  const resetForTest = useCallback(() => {
    setHealthFilters({ search: '', status: 'all', category: 'all' });
    setKillFilters({ search: '', category: 'all' });
  }, []);

  return {
    health: healthRows,
    filteredHealth,
    healthFilters,
    setHealthFilters,
    refreshHealth,
    healthCategories: HEALTH_CATEGORIES,
    killSwitches,
    filteredKillSwitches,
    killFilters,
    setKillFilters,
    setKillSwitch,
    bulkSetKillSwitch,
    opsAudit,
    killCategories: KILL_CATEGORIES,
    resetForTest,
    confirmKillSwitch,
    confirmBulkKillSwitch,
    configReady,
  };
}
