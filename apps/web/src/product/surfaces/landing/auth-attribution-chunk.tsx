import { useAdsAttributionChunk } from '@/hooks/use-ads-attribution-chunk';

import { AdsConsentSheet } from './ads-consent-sheet';

type AuthAttributionChunkProps = {
  trackViewContent?: boolean;
};

/** Lazy ad pixel + consent host for landing/auth routes only (§28.5). */
export function AuthAttributionChunk({ trackViewContent }: AuthAttributionChunkProps) {
  const chunk = useAdsAttributionChunk({ trackViewContent });

  return (
    <AdsConsentSheet
      open={chunk.showConsentSheet}
      onAccept={chunk.acceptAnalytics}
      onDecline={chunk.declineAnalytics}
    />
  );
}
