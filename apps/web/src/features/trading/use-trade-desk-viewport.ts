import { useSyncExternalStore } from 'react';

import {
  TRADE_DESK_DESKTOP_MIN_WIDTH_PX,
  TRADE_DESK_TABLET_MIN_WIDTH_PX,
  resolveTradeDeskLayoutTier,
  type TradeDeskLayoutTier,
} from '@/domain/trade-mobile-layout-display-contract';

const TRADE_DESK_DESKTOP_MEDIA_QUERY = `(min-width: ${TRADE_DESK_DESKTOP_MIN_WIDTH_PX}px)`;
const TRADE_DESK_TABLET_MEDIA_QUERY = `(min-width: ${TRADE_DESK_TABLET_MIN_WIDTH_PX}px)`;

export type TradeDeskViewport = {
  layoutTier: TradeDeskLayoutTier;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
};

const SERVER_VIEWPORT: TradeDeskViewport = {
  layoutTier: 'mobile',
  isDesktop: false,
  isTablet: false,
  isMobile: true,
};

let cachedViewport: TradeDeskViewport = SERVER_VIEWPORT;

function getDesktopMatchMedia(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(TRADE_DESK_DESKTOP_MEDIA_QUERY);
}

function getTabletMatchMedia(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(TRADE_DESK_TABLET_MEDIA_QUERY);
}

function buildTradeDeskViewport(widthPx: number): TradeDeskViewport {
  const layoutTier = resolveTradeDeskLayoutTier(widthPx);
  return {
    layoutTier,
    isDesktop: layoutTier === 'desktop',
    isTablet: layoutTier === 'tablet',
    isMobile: layoutTier === 'mobile',
  };
}

function refreshTradeDeskViewportCache(): TradeDeskViewport {
  const width =
    typeof window !== 'undefined' && typeof window.innerWidth === 'number' ? window.innerWidth : 0;
  const next = buildTradeDeskViewport(width);
  if (
    cachedViewport.layoutTier === next.layoutTier &&
    cachedViewport.isDesktop === next.isDesktop &&
    cachedViewport.isTablet === next.isTablet &&
    cachedViewport.isMobile === next.isMobile
  ) {
    return cachedViewport;
  }
  cachedViewport = next;
  return cachedViewport;
}

function subscribeTradeDeskViewport(onStoreChange: () => void): () => void {
  const desktopQuery = getDesktopMatchMedia();
  const tabletQuery = getTabletMatchMedia();
  if (!desktopQuery || !tabletQuery) {
    return () => {};
  }
  desktopQuery.addEventListener('change', onStoreChange);
  tabletQuery.addEventListener('change', onStoreChange);
  window.addEventListener('resize', onStoreChange);
  return () => {
    desktopQuery.removeEventListener('change', onStoreChange);
    tabletQuery.removeEventListener('change', onStoreChange);
    window.removeEventListener('resize', onStoreChange);
  };
}

function getTradeDeskViewportSnapshot(): TradeDeskViewport {
  return refreshTradeDeskViewportCache();
}

function getTradeDeskViewportServerSnapshot(): TradeDeskViewport {
  return SERVER_VIEWPORT;
}

/** Trade desk shell tier — mobile (<768) · tablet (768–1023) · desktop (1024+). */
export function useTradeDeskViewport(): TradeDeskViewport {
  return useSyncExternalStore(
    subscribeTradeDeskViewport,
    getTradeDeskViewportSnapshot,
    getTradeDeskViewportServerSnapshot,
  );
}
