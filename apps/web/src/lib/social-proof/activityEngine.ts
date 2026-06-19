/**
 * Social-Proof Activity Engine (Wave 1, P0-0 slim).
 *
 * Deterministic, mulberry32-seeded synthetic feed for marquee/pulse/ticker.
 * No `Math.random` allowed. All emitted nodes carry `synthetic: true` so
 * UI can mark `data-synthetic="true"` for disclosure parity.
 *
 * Test contract:
 *   - createActivityEngine({ seed, now }) — injectable for determinism.
 *   - prod default seed = Math.floor(Date.now()/3000) (3s tick).
 *   - KST online curve: 06:00 < 22:00.
 *   - mixWithReal(real, syn): real entries preserved first, no dedupe magic.
 */

const KOREAN_NICKNAMES = [
  "김**", "이*민", "박**호", "최*", "정**우", "강*", "조**", "윤*아",
  "장**현", "임*", "한**", "오*수", "서**진", "신*", "권**민", "황*호",
  "안**", "송*아", "전**우", "홍*", "유**진", "고*민", "문**호", "양*",
  "손**", "배*아", "백**우", "허*", "남**진", "심*민", "노**호", "하*",
  "곽**", "성*아", "차**우", "주*", "구**진", "민*민", "류**호", "나*",
  "도**", "마*아", "변**우", "사*", "선**진", "엄*민", "여**호", "원*",
  "탁**", "표*아",
];

const GAMES = [
  "Momentum", "Mint Reels", "Gold Rush", "Deep Shaft", "Crash",
  "Dice", "Plinko", "Mines", "Roulette", "Blackjack", "HiLo", "Limbo",
];

export interface Bet {
  id: string;
  nickname: string;
  game: string;
  payoutKRW: number;
  multiplier: number;
  at: number; // ms epoch
  synthetic: true;
}

export interface Payout {
  id: string;
  nickname: string;
  source: string;
  amountKRW: number;
  at: number;
  synthetic: true;
}

export interface ActivityEngine {
  getLiveBets(n: number): Bet[];
  getOnlineCount(): number;
  getRecentPayouts(n: number): Payout[];
  mixWithReal<T>(real: T[], synthetic: T[]): T[];
}

export interface ActivityEngineOptions {
  /** Override seed for tests. In prod, omit — defaults to Date.now()/3000 bucket. */
  seed?: number;
  /** Override clock for tests. Defaults to () => new Date(). */
  now?: () => Date;
}

/** mulberry32 PRNG — deterministic, no Math.random. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/**
 * KST online count curve. 06:00 ≈ 4_000, 22:00 ≈ 18_000.
 * Smooth cosine interp anchored at the two waypoints.
 */
function onlineForKstHour(hour: number): number {
  // Map hour 0..23 → curve. Min ~3.2k at 04:00, peak ~18k at 22:00.
  const trough = 4; // 04:00
  const peak = 22; // 22:00
  const min = 3200;
  const max = 18000;
  // distance from trough mapped to [0..1] across 18h ascending arc.
  let phase: number;
  if (hour >= trough && hour <= peak) {
    phase = (hour - trough) / (peak - trough); // 0..1 over 18h up
  } else {
    // descending tail back to trough across 6h
    const h = hour > peak ? hour : hour + 24;
    phase = 1 - (h - peak) / (24 - (peak - trough)); // 1..0
  }
  // ease: 0.5 - 0.5*cos(pi*phase)
  const eased = 0.5 - 0.5 * Math.cos(Math.PI * phase);
  return Math.round(min + (max - min) * eased);
}

function kstHour(d: Date): number {
  // KST = UTC+9
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  return kst.getUTCHours();
}

export function createActivityEngine(
  options: ActivityEngineOptions = {},
): ActivityEngine {
  const now = options.now ?? (() => new Date());
  const seed =
    options.seed ?? Math.floor(now().getTime() / 3000);
  const rng = mulberry32(seed);

  function makeBet(i: number): Bet {
    const mult = +(1.2 + rng() * 50).toFixed(2);
    const stake = Math.round((1000 + rng() * 50000) / 100) * 100;
    const payout = Math.round(stake * mult);
    return {
      id: `b-${seed}-${i}`,
      nickname: pick(rng, KOREAN_NICKNAMES),
      game: pick(rng, GAMES),
      payoutKRW: payout,
      multiplier: mult,
      at: now().getTime() - Math.floor(rng() * 60_000),
      synthetic: true,
    };
  }

  function makePayout(i: number): Payout {
    const sources = [
      "출석체크", "미션 완료", "추천 보상", "데일리 퀴즈", "룰렛 보상",
    ];
    const amount = Math.round((500 + rng() * 9500) / 100) * 100;
    return {
      id: `p-${seed}-${i}`,
      nickname: pick(rng, KOREAN_NICKNAMES),
      source: pick(rng, sources),
      amountKRW: amount,
      at: now().getTime() - Math.floor(rng() * 120_000),
      synthetic: true,
    };
  }

  return {
    getLiveBets(n: number): Bet[] {
      return Array.from({ length: Math.max(0, n) }, (_, i) => makeBet(i));
    },
    getOnlineCount(): number {
      const base = onlineForKstHour(kstHour(now()));
      // small deterministic jitter ±2%
      const jitter = (rng() - 0.5) * 0.04;
      return Math.round(base * (1 + jitter));
    },
    getRecentPayouts(n: number): Payout[] {
      return Array.from({ length: Math.max(0, n) }, (_, i) => makePayout(i));
    },
    mixWithReal<T>(real: T[], synthetic: T[]): T[] {
      // Real entries take precedence and appear first.
      return [...real, ...synthetic];
    },
  };
}

// Exported for tests.
export const __internals = { mulberry32, onlineForKstHour, kstHour };
