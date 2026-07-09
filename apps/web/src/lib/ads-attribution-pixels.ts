import {
  ADS_CONVERSION_EVENTS,
  ADS_PIXEL_ENV_KEYS,
  buildAdsEventParams,
} from '@/domain/ads-attribution-display-contract';

import { readPersistedAttribution } from './ads-attribution-consent';

type PixelVendor = 'tiktok' | 'meta' | 'google';

declare global {
  interface Window {
    ttq?: {
      load: (pixelId: string) => void;
      page: () => void;
      track: (event: string, params?: Record<string, string>) => void;
    };
    TiktokAnalyticsObject?: string;
    fbq?: (command: 'init' | 'track', eventOrId: string, params?: Record<string, string>) => void;
    _fbq?: Window['fbq'];
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let pixelsInitialized = false;

function envPixelId(key: keyof typeof ADS_PIXEL_ENV_KEYS): string | undefined {
  const envKey = ADS_PIXEL_ENV_KEYS[key];
  const value = import.meta.env[envKey] as string | undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function configuredAdsPixelIds(): Partial<Record<PixelVendor, string>> {
  const ids: Partial<Record<PixelVendor, string>> = {};
  const tiktok = envPixelId('tiktok');
  const meta = envPixelId('meta');
  const google = envPixelId('google');
  if (tiktok) ids.tiktok = tiktok;
  if (meta) ids.meta = meta;
  if (google) ids.google = google;
  return ids;
}

export function hasConfiguredAdsPixels(): boolean {
  return Object.keys(configuredAdsPixelIds()).length > 0;
}

function appendScript(src: string, id: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function ensureTikTokStub(): NonNullable<Window['ttq']> {
  if (window.ttq) return window.ttq;
  window.TiktokAnalyticsObject = 'ttq';
  const stub: NonNullable<Window['ttq']> = {
    load: (pixelId: string) => {
      appendScript(
        `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelId)}`,
        'phonara-ttq-script',
      );
    },
    page: () => {},
    track: () => {},
  };
  window.ttq = stub;
  return stub;
}

function initTikTokPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;
  const ttq = ensureTikTokStub();
  ttq.load(pixelId);
  ttq.page();
}

function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;
  if (!window.fbq) {
    type FbqFn = ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
    };
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    } as FbqFn;
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    appendScript('https://connect.facebook.net/en_US/fbevents.js', 'phonara-fbq-script');
  }
  window.fbq?.('init', pixelId);
  window.fbq?.('track', 'PageView');
}

function initGoogleTag(tagId: string): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    appendScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`,
      'phonara-gtag-script',
    );
    window.gtag('js', new Date());
  }
  window.gtag('config', tagId, { send_page_view: true });
}

export function loadAdsPixels(): void {
  if (typeof window === 'undefined' || pixelsInitialized) return;
  const ids = configuredAdsPixelIds();
  if (Object.keys(ids).length === 0) return;

  if (ids.tiktok) initTikTokPixel(ids.tiktok);
  if (ids.meta) initMetaPixel(ids.meta);
  if (ids.google) initGoogleTag(ids.google);

  pixelsInitialized = true;
}

function attributionParams(): Record<string, string> {
  return buildAdsEventParams(readPersistedAttribution());
}

export function trackAdsViewContent(): void {
  if (typeof window === 'undefined' || !pixelsInitialized) return;
  const params = attributionParams();

  window.ttq?.track(ADS_CONVERSION_EVENTS.viewContent, params);
  window.fbq?.('track', ADS_CONVERSION_EVENTS.viewContent, params);
  window.gtag?.('event', ADS_CONVERSION_EVENTS.viewContent, params);
}

export function trackAdsSignupComplete(): void {
  if (typeof window === 'undefined' || !pixelsInitialized) return;
  const params = attributionParams();

  window.ttq?.track(ADS_CONVERSION_EVENTS.completeRegistration, params);
  window.fbq?.('track', ADS_CONVERSION_EVENTS.completeRegistration, params);
  window.gtag?.('event', 'sign_up', { ...params, method: 'email' });
}

/** Test-only reset — vitest isolation. */
export function resetAdsPixelsForTests(): void {
  pixelsInitialized = false;
}
