import { useAdminTiersDesk } from './useAdminTiersDesk';

/** Read-only tier benefits projection for the dedicated E6 desk. */
export function useAdminTierBenefitsDesk() {
  const { goldenEarthLimits, earnMissionLimits, decayPolicy, refresh, isLoading, isError } =
    useAdminTiersDesk();

  return {
    goldenEarthLimits,
    earnMissionLimits,
    decayPolicy,
    refresh,
    isLoading,
    isError,
  };
}
