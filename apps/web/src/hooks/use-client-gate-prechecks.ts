import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GameCode } from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import {
  allClientGateConfigSelectKeys,
  buildClientGateConfigMap,
  CLIENT_GATE_REASON_KEYS,
  isClientGateFlagOn,
  resolveConsentGateBlocked,
  resolveGeoAccessBlocked,
  resolvePerGameCasinoBlocked,
  resolveWithdrawalMfaStepUpRequired,
  type ClientGateConfigMap,
  type PerGameConfigSlug,
} from '../domain/client-gate-contract';
import { loadUserSecurityState } from '../domain/user-auth-security';
import { useAuth } from '../contexts/auth-context';
import { fetchProfileGeoBlocked } from '../lib/geo-block';
import { supabase } from '../lib/supabase';
import { usePlatformGates } from './use-platform-gates';

export {
  CLIENT_GATE_CONFIG_KEYS,
  PER_GAME_CONFIG_SLUGS,
  type ClientGateConfigKey,
  type PerGameConfigSlug,
} from '../domain/client-gate-contract';

type OnboardingConsentCheck = {
  complete?: boolean;
};

async function fetchClientGateConfig(): Promise<ClientGateConfigMap> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', allClientGateConfigSelectKeys());
  if (error) throw error;
  return buildClientGateConfigMap(data ?? []);
}

async function fetchOnboardingConsentComplete(): Promise<boolean> {
  const { data, error } = await supabase.rpc('rpc_check_onboarding_consent');
  if (error) throw error;
  return Boolean((data as OnboardingConsentCheck)?.complete);
}

export type ClientGatePrecheckState = {
  loading: boolean;
  consentGateEnabled: boolean;
  consentBlocked: boolean;
  consentBlockedKey: MessageKey;
  geoBlockEnabled: boolean;
  geoBlocked: boolean;
  geoBlockedKey: MessageKey;
  withdrawalMfaStepUpEnabled: boolean;
  withdrawalMfaRequired: boolean;
  withdrawalMfaRequiredKey: MessageKey;
  resolveCasinoGameBlocked: (gameCode: GameCode) => {
    blocked: boolean;
    reasonKey: MessageKey | null;
  };
};

export function useClientGatePrechecks(): ClientGatePrecheckState {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const { casinoBlocked, loading: platformLoading } = usePlatformGates();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['app-config', 'client-gate-prechecks'],
    queryFn: fetchClientGateConfig,
    staleTime: 15_000,
    refetchOnMount: 'always',
  });

  const consentGateEnabled = isClientGateFlagOn(config?.consent_gate_enabled);
  const geoBlockEnabled = isClientGateFlagOn(config?.geo_block_enabled);
  const withdrawalMfaStepUpEnabled = isClientGateFlagOn(config?.withdrawal_mfa_step_up_enabled);

  const { data: onboardingConsentComplete = true, isLoading: consentCheckLoading } = useQuery({
    queryKey: ['onboarding-consent-check', userId],
    queryFn: fetchOnboardingConsentComplete,
    enabled: Boolean(userId) && consentGateEnabled,
    staleTime: 30_000,
  });

  const { data: profileGeoBlocked = false, isLoading: geoProfileLoading } = useQuery({
    queryKey: ['geo-block-profile', userId],
    queryFn: fetchProfileGeoBlocked,
    enabled: Boolean(userId) && geoBlockEnabled,
    staleTime: 30_000,
  });

  const { data: security, isLoading: securityLoading } = useQuery({
    queryKey: ['user-security-state', userId],
    queryFn: loadUserSecurityState,
    enabled: Boolean(userId) && withdrawalMfaStepUpEnabled,
    staleTime: 15_000,
  });

  const consentBlocked = resolveConsentGateBlocked({
    consentGateEnabled,
    onboardingConsentComplete,
  });

  const geoBlocked = resolveGeoAccessBlocked({
    geoBlockEnabled,
    profileGeoBlocked,
  });

  const withdrawalMfaRequired = resolveWithdrawalMfaStepUpRequired({
    mfaStepUpEnabled: withdrawalMfaStepUpEnabled,
    hasVerifiedTotp: security?.hasVerifiedTotp ?? false,
    currentAal: security?.currentLevel ?? null,
  });

  const loading =
    platformLoading ||
    configLoading ||
    (consentGateEnabled && consentCheckLoading) ||
    (geoBlockEnabled && geoProfileLoading) ||
    (withdrawalMfaStepUpEnabled && securityLoading);

  const resolveCasinoGameBlocked = useCallback(
    (gameCode: GameCode) => {
      const slug = gameCode as PerGameConfigSlug;
      return resolvePerGameCasinoBlocked({
        aggregateCasinoBlocked: casinoBlocked,
        perGameEnabled: config?.perGame[slug] ?? null,
      });
    },
    [casinoBlocked, config?.perGame],
  );

  return {
    loading,
    consentGateEnabled,
    consentBlocked,
    consentBlockedKey: CLIENT_GATE_REASON_KEYS.consent,
    geoBlockEnabled,
    geoBlocked,
    geoBlockedKey: CLIENT_GATE_REASON_KEYS.geo,
    withdrawalMfaStepUpEnabled,
    withdrawalMfaRequired,
    withdrawalMfaRequiredKey: CLIENT_GATE_REASON_KEYS.withdrawalMfa,
    resolveCasinoGameBlocked,
  };
}
