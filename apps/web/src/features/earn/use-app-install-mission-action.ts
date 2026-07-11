import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  APP_INSTALL_MISSION_ERROR_KEY,
  APP_INSTALL_MISSION_SUCCESS_KEY,
  APP_INSTALL_RECORD_RPC,
  canRecordAppInstallAttribution,
  parseAppInstallAttributionResult,
  resolveAppInstallPlatform,
} from '@/domain/app-install-mission-display-contract';
import { useInstallPrompt } from '@/features/pwa/install-prompt-context';
import { isPwaStandalone } from '@/features/pwa/pwa-install';
import { homeMissionsPageKeys } from '@/features/earn/use-home-missions-page-controller';
import { viralMissionKeys } from '@/features/earn/use-viral-missions';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';

export type AppInstallMissionActionView = {
  canAct: boolean;
  busy: boolean;
  errorKey: MessageKey | null;
  isInstalled: boolean;
  canNativePrompt: boolean;
  recordOrInstall: () => Promise<void>;
};

export function useAppInstallMissionAction(): AppInstallMissionActionView {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const queryClient = useQueryClient();
  const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const recordAttribution = useCallback(async () => {
    if (!userId || !canRecordAppInstallAttribution()) return;
    const clientEventId = `app-install:${userId}:${Date.now()}`;
    const data = await callRpc(APP_INSTALL_RECORD_RPC, {
      p_platform: resolveAppInstallPlatform(),
      p_client_event_id: clientEventId,
      p_metadata: {},
    });
    const parsed = parseAppInstallAttributionResult(data);
    if (!parsed?.ok) {
      throw new Error('app_install_record_failed');
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeMissionsPageKeys.snapshot(userId) }),
      queryClient.invalidateQueries({ queryKey: viralMissionKeys.status(userId) }),
    ]);
    if (parsed.granted) {
      productToast.show({ zone: 'warm', key: APP_INSTALL_MISSION_SUCCESS_KEY });
    }
  }, [queryClient, userId]);

  const recordOrInstall = useCallback(async () => {
    if (!userId || busy || !canRecordAppInstallAttribution()) return;
    setBusy(true);
    setErrorKey(null);
    try {
      if (isPwaStandalone() || isInstalled) {
        await recordAttribution();
        return;
      }
      if (canPrompt) {
        const outcome = await promptInstall();
        if (outcome === 'accepted' || isPwaStandalone()) {
          await recordAttribution();
        }
        return;
      }
      await recordAttribution();
    } catch (err) {
      setErrorKey(translateError(err, APP_INSTALL_MISSION_ERROR_KEY));
    } finally {
      setBusy(false);
    }
  }, [busy, canPrompt, isInstalled, promptInstall, recordAttribution, userId]);

  return {
    canAct: Boolean(userId) && canRecordAppInstallAttribution(),
    busy,
    errorKey,
    isInstalled: isInstalled || isPwaStandalone(),
    canNativePrompt: canPrompt,
    recordOrInstall,
  };
}
