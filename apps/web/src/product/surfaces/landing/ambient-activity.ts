import type { MessageKey } from '@phonara/i18n';
import { LANDING_AMBIENT_MASKED_NICKS } from '@phonara/i18n';

import {
  LANDING_AMBIENT_SIGNUP_LINE_RATIO,
  LANDING_MISSION_TEASERS,
  type LandingMissionTeaser,
} from '@/domain/landing-display-contract';

export type AmbientActivityMissionLine = {
  readonly id: string;
  readonly kind: 'mission';
  readonly maskedNick: string;
  readonly missionTitleKey: MessageKey;
  readonly rewardLabel: string;
};

export type AmbientActivitySignupLine = {
  readonly id: string;
  readonly kind: 'signup';
  readonly maskedNick: string;
};

export type AmbientActivityLine = AmbientActivityMissionLine | AmbientActivitySignupLine;

const MASKED_NICK_POOL = LANDING_AMBIENT_MASKED_NICKS;

const AMBIENT_SESSION_SEED_KEY = 'pf.landing.ambientSeed';

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

function getSessionSeed(): number {
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

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

function pickMission(
  rng: () => number,
  missions: readonly LandingMissionTeaser[],
): LandingMissionTeaser {
  return missions[Math.floor(rng() * missions.length)] ?? missions[0]!;
}

/** Daytime 9–22 local → faster rotation; late night → slower (§28.7). */
export function resolveAmbientRotationMs(now: Date = new Date()): number {
  const hour = now.getHours();
  const isPeak = hour >= 9 && hour <= 22;
  const minMs = isPeak ? 4000 : 6500;
  const maxMs = isPeak ? 8000 : 11000;
  const rng = mulberry32(hashSeed(`${getSessionSeed()}-${hour}`));
  return Math.round(minMs + rng() * (maxMs - minMs));
}

export function buildAmbientActivityLines(options?: {
  count?: number;
  seed?: number;
  missions?: readonly LandingMissionTeaser[];
  signupRatio?: number;
}): AmbientActivityLine[] {
  const count = options?.count ?? 12;
  const missions = options?.missions ?? LANDING_MISSION_TEASERS;
  const seed = options?.seed ?? getSessionSeed();
  const signupRatio = options?.signupRatio ?? LANDING_AMBIENT_SIGNUP_LINE_RATIO;
  const rng = mulberry32(seed);
  const nicks = shuffleWithRng(MASKED_NICK_POOL, rng);
  const lines: AmbientActivityLine[] = [];
  const used = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const maskedNick = nicks[index % nicks.length] ?? MASKED_NICK_POOL[0];
    const isSignup = rng() < signupRatio;

    if (isSignup) {
      const dedupeKey = `signup:${maskedNick}`;
      if (used.has(dedupeKey)) continue;
      used.add(dedupeKey);
      lines.push({
        id: `${dedupeKey}-${index}`,
        kind: 'signup',
        maskedNick,
      });
      continue;
    }

    const mission = pickMission(rng, missions);
    const dedupeKey = `mission:${maskedNick}:${mission.id}`;
    if (used.has(dedupeKey)) continue;
    used.add(dedupeKey);
    lines.push({
      id: `${dedupeKey}-${index}`,
      kind: 'mission',
      maskedNick,
      missionTitleKey: mission.titleKey,
      rewardLabel: mission.rewardLabel,
    });
  }

  if (lines.length > 0) return lines;

  return missions.slice(0, 3).map((mission, index) => ({
    id: `fallback-${mission.id}-${index}`,
    kind: 'mission' as const,
    maskedNick: MASKED_NICK_POOL[index % MASKED_NICK_POOL.length] ?? MASKED_NICK_POOL[0],
    missionTitleKey: mission.titleKey,
    rewardLabel: mission.rewardLabel,
  }));
}
