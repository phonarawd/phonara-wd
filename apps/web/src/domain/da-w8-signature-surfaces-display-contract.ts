/**
 * DA W8 Signature surfaces BUNDLE (§34.21–34.26 · YAML #226).
 * Authority: `da-w8-signature-surfaces-bundle` · PRODUCT_EXPERIENCE_CANON · ADR-009.
 * Absorbed (51st merge · same PR): home · wallet · trade · casino · sports · vip.
 * Sound (§34.27) DOC todo `da-w8-sound-design-spec-defer` — separate; not in this BUNDLE.
 */

import type { MessageKey } from '@phonara/i18n';

import { EVENTS_HUB_ROUTE } from './events-hub-display-contract';
import { HOME_MISSIONS_ROUTE } from './home-missions-display-contract';

export const DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO = 'da-w8-signature-surfaces-bundle' as const;

/** Prerequisite GATE — local id (avoid circular import with p12-gate contract). */
export const P12_GATE_MARKETING_TODO = 'p12-gate-marketing' as const;

/** Prerequisite GATE must be closed before this BUNDLE. */
export const DA_W8_SIGNATURE_SURFACES_PREREQUISITE_TODOS = [P12_GATE_MARKETING_TODO] as const;

/** §34.21–34.26 signature moments — one per surface (sound deferred). */
export const DA_W8_SIGNATURE_SURFACES = [
  'home',
  'wallet',
  'trade',
  'casino',
  'sports',
  'vip',
] as const;

export type DaW8SignatureSurface = (typeof DA_W8_SIGNATURE_SURFACES)[number];

/** Operator table §34.21–34.26 — scan cue id per surface. */
export const DA_W8_SIGNATURE_MOMENTS = {
  home: 'greeting-day-flow',
  wallet: 'living-balance',
  trade: 'market-heat-volume-pulse',
  casino: 'tile-float-glow',
  sports: 'kickoff-countdown',
  vip: 'xp-fill',
} as const satisfies Record<DaW8SignatureSurface, string>;

/** §34.21 Home — rules-based day flow order (reward → tasks → market → events). */
export const DA_W8_HOME_DAY_FLOW_STEPS = ['reward', 'tasks', 'market', 'events'] as const;

export type DaW8HomeDayFlowStep = (typeof DA_W8_HOME_DAY_FLOW_STEPS)[number];

export type DaW8HomeDayFlowDefinition = {
  id: DaW8HomeDayFlowStep;
  titleKey: MessageKey;
  route: string;
};

export const DA_W8_HOME_DAY_FLOW: readonly DaW8HomeDayFlowDefinition[] = [
  {
    id: 'reward',
    titleKey: 'earn.home.signatureFlow.reward',
    route: '/home',
  },
  {
    id: 'tasks',
    titleKey: 'earn.home.signatureFlow.tasks',
    route: HOME_MISSIONS_ROUTE,
  },
  {
    id: 'market',
    titleKey: 'earn.home.signatureFlow.market',
    route: '/trade',
  },
  {
    id: 'events',
    titleKey: 'earn.home.signatureFlow.events',
    route: EVENTS_HUB_ROUTE,
  },
] as const;

export type DaW8HomeGreetingPeriod = 'morning' | 'afternoon' | 'evening';

/** Time-of-day greeting period — display-only (local clock). */
export function resolveHomeGreetingPeriod(hour: number): DaW8HomeGreetingPeriod {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function resolveHomeGreetingMessageKey(period: DaW8HomeGreetingPeriod): MessageKey {
  if (period === 'morning') return 'earn.home.greeting.morning';
  if (period === 'afternoon') return 'earn.home.greeting.afternoon';
  return 'earn.home.greeting.evening';
}

/** Trade market heat tone — mirrors ticker change24 (display-only). */
export type DaW8MarketHeatTone = 'up' | 'down' | 'neutral';

export function resolveMarketHeatTone(tone: DaW8MarketHeatTone | null | undefined): DaW8MarketHeatTone {
  if (tone === 'up' || tone === 'down') return tone;
  return 'neutral';
}

export type KickoffCountdownView =
  | {
      kind: 'countdown';
      totalSeconds: number;
      clock: string;
    }
  | { kind: 'started' }
  | { kind: 'invalid' };

/** Pad 0–99 for countdown clock segments. */
function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

/** Format remaining seconds as H:MM:SS or MM:SS (display-only). */
export function formatKickoffCountdownClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/**
 * Kickoff countdown from ISO kickoff_at — display-only timer math.
 * Does not recompute odds/payouts.
 */
export function resolveKickoffCountdown(kickoffAt: string, nowMs: number): KickoffCountdownView {
  const kickoffMs = Date.parse(kickoffAt);
  if (!Number.isFinite(kickoffMs)) return { kind: 'invalid' };
  const deltaSec = Math.floor((kickoffMs - nowMs) / 1000);
  if (deltaSec <= 0) return { kind: 'started' };
  return {
    kind: 'countdown',
    totalSeconds: deltaSec,
    clock: formatKickoffCountdownClock(deltaSec),
  };
}

/** Surfaces that must wire W8 signature moments. */
export const DA_W8_SIGNATURE_WIRE_TARGETS = [
  'home_greeting_day_flow',
  'wallet_living_balance',
  'trade_market_heat',
  'casino_tile_float',
  'sports_kickoff_countdown',
  'vip_xp_fill',
] as const;

export type DaW8SignatureWireTarget = (typeof DA_W8_SIGNATURE_WIRE_TARGETS)[number];

/** On-disk artifacts required for W8 signature BUNDLE. */
export const DA_W8_SIGNATURE_ARTIFACT_PATHS = [
  'domain/da-w8-signature-surfaces-display-contract.ts',
  'product/tokens/signature-surfaces.css',
  'product/surfaces/home/earn-home-page.tsx',
  'product/surfaces/wallet/wallet-balance-hero.tsx',
  'product/surfaces/trade/trade-market-ticker-stats.tsx',
  'product/surfaces/casino/casino-lobby-page.tsx',
  'product/surfaces/sports/sports-fixture-board.tsx',
  'product/surfaces/sports/sports-kickoff-countdown.tsx',
  'product/surfaces/tier/tier-me-page.tsx',
  'product/primitives/progress-ring.tsx',
] as const;

/** gate:ai-impl owner paths — contract + tokens + wire consumers. */
export const DA_W8_SIGNATURE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w8-signature-surfaces-display-contract.test.ts',
  'apps/web/src/product/tokens/__tests__/signature-surfaces.test.ts',
  'apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/trade-market-ticker-stats.test.tsx',
  'apps/web/src/product/surfaces/casino/__tests__/casino-lobby-page.test.tsx',
  'apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx',
  'apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx',
  'apps/web/src/product/primitives/__tests__/progress-ring.test.tsx',
] as const;

/** Non-waivable sync for DA W8 BUNDLE closeout. */
export function assertDaW8SignatureSurfacesSync(): void {
  if (!DA_W8_SIGNATURE_SURFACES_PREREQUISITE_TODOS.includes(P12_GATE_MARKETING_TODO)) {
    throw new Error('da-w8-signature-surfaces-bundle: missing prerequisite p12-gate-marketing');
  }

  if (DA_W8_SIGNATURE_SURFACES.length !== 6) {
    throw new Error('da-w8-signature-surfaces-bundle: expected 6 signature surfaces');
  }

  for (const surface of DA_W8_SIGNATURE_SURFACES) {
    if (!(surface in DA_W8_SIGNATURE_MOMENTS)) {
      throw new Error(`da-w8-signature-surfaces-bundle: missing signature moment for ${surface}`);
    }
  }

  if (DA_W8_HOME_DAY_FLOW_STEPS.length !== 4) {
    throw new Error('da-w8-signature-surfaces-bundle: home day flow must be reward→tasks→market→events');
  }

  if (DA_W8_HOME_DAY_FLOW.map((s) => s.id).join(',') !== DA_W8_HOME_DAY_FLOW_STEPS.join(',')) {
    throw new Error('da-w8-signature-surfaces-bundle: home day flow order drift');
  }

  if (DA_W8_SIGNATURE_WIRE_TARGETS.length !== 6) {
    throw new Error('da-w8-signature-surfaces-bundle: wire targets incomplete');
  }
}
