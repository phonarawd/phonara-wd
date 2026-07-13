import { useCallback, useEffect, useState } from 'react';

import type { AdminOpsPushStatus } from '@/domain/admin-ops-push-display-contract';
import { useAuth } from '@/contexts/auth-context';
import {
  disableAdminOpsPush,
  enableAdminOpsPush,
  resolveAdminOpsPushStatus,
  resolveAdminOpsPushSupported,
} from '@/features/ops-push/admin-ops-web-push';

export type UseAdminOpsPush = {
  status: AdminOpsPushStatus;
  supported: boolean;
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAdminOpsPush(): UseAdminOpsPush {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [status, setStatus] = useState<AdminOpsPushStatus>('loading');
  const [busy, setBusy] = useState(false);
  const supported = resolveAdminOpsPushSupported();

  const refresh = useCallback(async () => {
    const next = await resolveAdminOpsPushStatus(userId);
    setStatus(next);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!userId) {
      setStatus('error');
      return;
    }
    setBusy(true);
    try {
      const result = await enableAdminOpsPush(userId);
      setStatus(result.ok ? 'on' : result.status);
    } finally {
      setBusy(false);
    }
  }, [userId]);

  const disable = useCallback(async () => {
    if (!userId) {
      setStatus('error');
      return;
    }
    setBusy(true);
    try {
      const result = await disableAdminOpsPush(userId);
      setStatus(result.ok ? 'off' : result.status);
    } finally {
      setBusy(false);
    }
  }, [userId]);

  return { status, supported, busy, enable, disable, refresh };
}
