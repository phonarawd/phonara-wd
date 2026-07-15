import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  canManageTradingApiKeys,
  resolveSettingsApiKeysHubExposure,
  resolveSettingsApiKeysPageExposure,
  SETTINGS_API_KEYS_ROUTE,
  type SettingsApiKeysExposureMode,
} from '@/domain/settings-api-keys-display-contract';
import {
  createTradingApiKey,
  listTradingApiKeys,
  revokeTradingApiKey,
  type CreateTradingApiKeyResult,
  type TradingApiKeyRow,
  type TradingApiKeyScope,
} from '@/domain/trading-api-keys';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export type SettingsApiKeysControllerView = {
  t: ReturnType<typeof useT>;
  route: typeof SETTINGS_API_KEYS_ROUTE;
  pageExposure: ReturnType<typeof resolveSettingsApiKeysPageExposure>;
  hubExposure: SettingsApiKeysExposureMode;
  canManageKeys: boolean;
  keys: TradingApiKeyRow[];
  keysLoading: boolean;
  refreshKeys: () => void;
  keyName: string;
  setKeyName: (value: string) => void;
  scopes: TradingApiKeyScope[];
  toggleScope: (scope: TradingApiKeyScope) => void;
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  creating: boolean;
  createErrorKey: MessageKey | null;
  createdSecret: CreateTradingApiKeyResult | null;
  createKey: () => Promise<void>;
  acknowledgeSecret: () => void;
  revokeTarget: TradingApiKeyRow | null;
  openRevoke: (row: TradingApiKeyRow) => void;
  closeRevoke: () => void;
  revoking: boolean;
  revokeErrorKey: MessageKey | null;
  revokeKey: () => Promise<void>;
};

export function useSettingsApiKeysController(): SettingsApiKeysControllerView {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const canManageKeys = canManageTradingApiKeys();

  const [keyName, setKeyName] = useState('');
  const [scopes, setScopes] = useState<TradingApiKeyScope[]>(['read']);
  const [createOpen, setCreateOpen] = useState(false);
  const [createErrorKey, setCreateErrorKey] = useState<MessageKey | null>(null);
  const [createdSecret, setCreatedSecret] = useState<CreateTradingApiKeyResult | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<TradingApiKeyRow | null>(null);
  const [revokeErrorKey, setRevokeErrorKey] = useState<MessageKey | null>(null);

  const keysQuery = useQuery({
    queryKey: ['trading-api-keys', userId],
    enabled: Boolean(userId) && canManageKeys,
    queryFn: () => listTradingApiKeys(),
  });

  const createMutation = useMutation({
    mutationFn: () => createTradingApiKey(keyName.trim(), scopes),
    onSuccess: (result) => {
      setCreatedSecret(result);
      setCreateOpen(false);
      setCreateErrorKey(null);
      setKeyName('');
      setScopes(['read']);
      void qc.invalidateQueries({ queryKey: ['trading-api-keys', userId] });
    },
    onError: (err) => {
      setCreateErrorKey(translateError(err));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeTarget) throw new Error('api_key_required');
      return revokeTradingApiKey(revokeTarget.id);
    },
    onSuccess: () => {
      setRevokeTarget(null);
      setRevokeErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['trading-api-keys', userId] });
    },
    onError: (err) => {
      setRevokeErrorKey(translateError(err));
    },
  });

  const toggleScope = useCallback((scope: TradingApiKeyScope) => {
    setScopes((prev) => {
      if (prev.includes(scope)) {
        const next = prev.filter((s) => s !== scope);
        return next.length === 0 ? prev : next;
      }
      return [...prev, scope];
    });
  }, []);

  const canCreate = useMemo(() => {
    if (!canManageKeys) return false;
    if (!keyName.trim()) return false;
    return scopes.length > 0;
  }, [canManageKeys, keyName, scopes.length]);

  return {
    t,
    route: SETTINGS_API_KEYS_ROUTE,
    pageExposure: resolveSettingsApiKeysPageExposure(),
    hubExposure: resolveSettingsApiKeysHubExposure(),
    canManageKeys,
    keys: keysQuery.data ?? [],
    keysLoading: keysQuery.isLoading,
    refreshKeys: () => {
      void keysQuery.refetch();
    },
    keyName,
    setKeyName,
    scopes,
    toggleScope,
    createOpen,
    openCreate: () => {
      if (!canManageKeys) return;
      setCreateErrorKey(null);
      setCreateOpen(true);
    },
    closeCreate: () => {
      if (createMutation.isPending) return;
      setCreateOpen(false);
    },
    creating: createMutation.isPending,
    createErrorKey,
    createdSecret,
    createKey: async () => {
      if (!canCreate || createMutation.isPending) return;
      setCreateErrorKey(null);
      await createMutation.mutateAsync();
    },
    acknowledgeSecret: () => {
      setCreatedSecret(null);
    },
    revokeTarget,
    openRevoke: (row) => {
      setRevokeErrorKey(null);
      setRevokeTarget(row);
    },
    closeRevoke: () => {
      if (revokeMutation.isPending) return;
      setRevokeTarget(null);
    },
    revoking: revokeMutation.isPending,
    revokeErrorKey,
    revokeKey: async () => {
      if (!revokeTarget || revokeMutation.isPending) return;
      setRevokeErrorKey(null);
      await revokeMutation.mutateAsync();
    },
  };
}
