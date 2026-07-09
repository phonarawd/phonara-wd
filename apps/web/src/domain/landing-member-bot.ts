/**
 * Landing presentation member bot — §28.7 cold-start social proof (engine 0).
 * Never surfaces 0 members; live count used only above threshold.
 */

import { LANDING_CUMULATIVE_STATS_THRESHOLD } from '@/domain/landing-display-contract';

/** Million-user platform baseline — presentation only. */
export const LANDING_MEMBER_BOT_BASE = 1_000_000;

/** Slow daily drift so the count feels alive across visits. */
export const LANDING_MEMBER_BOT_DAILY_DRIFT = 318;

const BOT_EPOCH_MS = Date.parse('2026-01-01T00:00:00+09:00');
const KST_TIME_ZONE = 'Asia/Seoul';

const AMBIENT_SESSION_SEED_KEY = 'pf.landing.ambientSeed';

/** Product presentation peaks follow KST — stable across operator TZ and CI (UTC). */
function getKstHour(at: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: KST_TIME_ZONE,
    }).format(at),
  );
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readSessionSeed(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const existing = sessionStorage.getItem(AMBIENT_SESSION_SEED_KEY);
    if (existing) return Number.parseInt(existing, 10);
    const seed = hashSeed(`${Date.now()}-${Math.random()}`);
    sessionStorage.setItem(AMBIENT_SESSION_SEED_KEY, String(seed));
    return seed;
  } catch {
    return Date.now();
  }
}

/** Session-stable member count — always >= 1M on presentation path. */
export function resolvePresentationMemberCount(
  at: Date = new Date(),
  sessionSeed = readSessionSeed(),
): number {
  const daysSinceEpoch = Math.max(0, Math.floor((at.getTime() - BOT_EPOCH_MS) / 86_400_000));
  const hour = getKstHour(at);
  const isPeak = hour >= 9 && hour <= 22;
  const hourlyBump = isPeak ? (hour - 9) * 2 : Math.max(0, hour);
  const rng = mulberry32(hashSeed(`${sessionSeed}-members-${at.toDateString()}`));
  const jitter = Math.floor(rng() * 97);

  return (
    LANDING_MEMBER_BOT_BASE + daysSinceEpoch * LANDING_MEMBER_BOT_DAILY_DRIFT + hourlyBump + jitter
  );
}

/** Concurrent signup bot — peak hours feel busier (presentation display prop). */
export function resolvePresentationSignupConcurrency(
  at: Date = new Date(),
  sessionSeed = readSessionSeed(),
): number {
  const hour = getKstHour(at);
  const isPeak = hour >= 9 && hour <= 22;
  const rng = mulberry32(hashSeed(`${sessionSeed}-signup-${hour}-${at.getDate()}`));
  const base = isPeak ? 168 : 47;
  const spread = Math.floor(rng() * (isPeak ? 284 : 72));
  return base + spread;
}

/** Live engine count when credibly large; otherwise presentation bot (never sub-million). */
export function resolveLandingMemberDisplay(liveCount?: number, at: Date = new Date()): number {
  const presentation = resolvePresentationMemberCount(at);
  if (liveCount === undefined) return presentation;
  if (liveCount < LANDING_CUMULATIVE_STATS_THRESHOLD) return presentation;
  if (liveCount < LANDING_MEMBER_BOT_BASE) return presentation;
  return liveCount;
}

/** Nudge concurrent signup count without large jumps (ticker refresh). */
export function nudgePresentationSignupConcurrency(
  current: number,
  at: Date = new Date(),
  sessionSeed = readSessionSeed(),
): number {
  const target = resolvePresentationSignupConcurrency(at, sessionSeed);
  const delta = target - current;
  if (Math.abs(delta) <= 12) return target;
  return current + Math.sign(delta) * (6 + Math.floor(mulberry32(sessionSeed)() * 6));
}
