/**
 * PHONARA × Lovable — Game surface contract.
 *
 * All game components are STRICTLY presentational. They never call RPC,
 * never compute payouts, never derive RNG. The Cursor-side adapter
 * (`useCasinoRoundPipeline`) owns money; this UI only receives strings
 * and callbacks.
 *
 * Currency / stake / payout / multiplier are ALWAYS decimal strings.
 * Never parseFloat for money — only for display formatting.
 */

export type GameCode =
  | "crash"
  | "dice"
  | "mines"
  | "plinko"
  | "limbo"
  | "hilo"
  | "mint_reels"
  | "gold_rush"
  | "blackjack"
  | "roulette"
  | "deepshaft"
  | "momentum";

export type Currency = "PHON" | "USDT";

export type BetStatus = "idle" | "opening" | "ready" | "placing" | "settled" | "error";

export interface RoundCommitment {
  round_id: string;
  server_seed_hash: string;
}

/**
 * PHONARA wire-shape status (BetResponse).
 * 1:1 union — must match `packages/api/src/casino/bet-response.ts`.
 * `'settled'` is a Lovable lifecycle value and NEVER appears here.
 */
export type BetResponseStatus =
  | "won"
  | "lost"
  | "pending"
  | "cancelled"
  | "voided"
  | "parity_hold";

/**
 * PHONARA BetResponse — server-authoritative bet wire shape.
 * Field names mirror PHONARA `packages/api` 1:1; do not add UI fields.
 */
export interface BetResponse {
  status: BetResponseStatus;
  /** Payout to player, decimal string. */
  payout: string;
  /** Game-specific result payload. Server-authoritative. */
  result: Record<string, unknown>;
  /** Server-issued bet id. */
  bet_id?: string;
  /** Idempotent replay flag. */
  already_placed?: boolean;
}

/**
 * UI-facing view over BetResponse. UI adapters may attach a derived
 * `multiplier` string for display; never round-trip it to the server.
 */
export type UiBetView = BetResponse & { multiplier?: string };

/** Back-compat alias — type-only export, no value re-export. */
export type BetResult = UiBetView;

/* ---------------- Verification evidence ---------------- */

/** PHONARA adapter shape — snake_case server seed. */
export interface PhonaraVerificationEvidence {
  ok: boolean;
  hmac: string;
  cursor: number;
  server_seed?: string;
}

/** Lovable UI shape — camelCase, consumed by FairnessSheet. */
export interface FairnessUiEvidence {
  ok: boolean;
  hmac: string;
  cursor: number;
  serverSeed?: string;
}

/** Back-compat alias. */
export type VerificationEvidence = FairnessUiEvidence;

/* ---------------- Recent bets ---------------- */

/** PHONARA adapter row — snake_case + result_payload. */
export interface PhonaraRecentBet {
  id: string;
  game: GameCode;
  currency: Currency;
  stake: string;
  payout: string;
  result_payload?: Record<string, unknown>;
  created_at: string | number;
}

/** Lovable strip row — consumed by BetHistoryStrip / Crash Stage history. */
export interface RecentBetStripRow {
  id: string;
  game: GameCode;
  currency: Currency;
  stake: string;
  payout: string;
  multiplier: string;
  at: number;
  win: boolean;
  /** optional — PHONARA adapter: result_payload; Lovable: toStripRow 보존 */
  result?: Record<string, unknown>;
}

/** Back-compat alias. */
export type RecentBet = RecentBetStripRow;

/* ---------------- Game-specific selection schemas (engine-fixed) ---------------- */

export interface CrashSelection {
  /** Target auto-cashout multiplier, decimal string, ≥ "1.01". */
  autoCashout: string;
}

export interface DiceSelection {
  /** Target threshold, decimal string ("0.01"–"99.99"). */
  target: string;
  direction: "over" | "under";
}

/**
 * Dice · engine result (PHONARA `packages/game-engine/src/games/dice.ts` 정본).
 * - roll ∈ [0.00, 99.99] (diceFromFloat = floor(f*10000)/100, 100.00 도달 불가)
 * - won: engine 진실 — over → roll>target, under → roll<target, tie=LOSE
 * - celebrate tier 진실: top-level `bet.multiplier` (HiLo `rounds[-1].multiplier`와 구분)
 * Stage/HUD는 `result.won`만 사용 — `over ? roll>target` 재계산 금지.
 * top-level `multiplier`/`totalMultiplier`/`resultMultiplier` 키 금지.
 */
export interface DiceResult {
  roll: number;
  won: boolean;
}

export interface MinesSelection {
  /** 1–24 mines on a 5x5 grid. */
  mineCount: number;
  /** Distinct cell indices 0–24 the player intends to reveal. */
  revealedCells: number[];
}

export interface PlinkoSelection {
  rows: 8 | 12 | 16;
  risk: "low" | "medium" | "high";
}

export interface LimboSelection {
  target: string;
}

export interface HiloSelection {
  startCard: number | null;
  guesses: ("higher" | "lower" | "skip")[];
}

/**
 * HiLo · engine result (PHONARA `packages/game-engine/src/games/hilo.ts` 정본).
 * - settle 진실: `won`
 * - celebrate tier 진실: `rounds[rounds.length - 1].multiplier`
 * 위 두 키 외에는 어떤 top-level multiplier 키도 두지 않는다.
 */
export interface HiLoRound {
  card: number;
  guess: "higher" | "lower" | "skip";
  correct: boolean;
  multiplier: number;
}

export interface HiLoResult {
  cards: number[];
  rounds: HiLoRound[];
  won: boolean;
}

/** Slot selection — PHONARA engine accepts ONLY `{ lines }`. `turbo` is UI-only. */
export interface SlotSelection {
  lines: number;
}

export type BlackjackMove =
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "insurance";

/** Blackjack — actions array is REPLACED on each change, never pushed. */
export interface BlackjackSelection {
  actions: { seat: number; move: BlackjackMove }[];
}

/** Roulette bet types — engine-fixed union. Do NOT add street/corner/line/dozen/column. */
export type RouletteBetType =
  | "straight"
  | "split"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "column1"
  | "column2"
  | "column3";

/**
 * Roulette bet.
 *  - straight: value = pocket 0..36
 *  - split:    value = LOWER adjacent pocket number (never sum).
 *              engine: pocket === value || pocket === value + 1
 *              Only valid for consecutive pairs (|a-b| === 1).
 *  - outside:  value = null
 * stakeWeight is an INTEGER number (chips are integer strings "1"/"5"/"25"/"100"/"500").
 */
export interface RouletteBet {
  type: RouletteBetType;
  value: number | null;
  stakeWeight: number;
}

export interface RouletteSelection {
  bets: RouletteBet[];
}

/**
 * Deepshaft — vertical mine-shaft dig game (greenfield · G#9).
 *
 * Engine contract (PHONARA side, deferred):
 *   selection: { riskTier, targetDepth }
 *   result:    { levels[], reachedDepth, caveIn, totalMultiplier, won }
 *
 * UI is consume-only. `levels[]` drives DECORATIVE progressive reveal —
 * NEVER engine truth for the settle banner. Settle banner reads
 * `totalMultiplier` / `won` / `caveIn` only.
 *
 * LAW 4 FULL: hidden depth cells must NEVER carry `gold`/`cavein`
 * tokens in DOM, className, data-*, or props.
 */
export type DeepshaftRiskTier = "safe" | "standard" | "deep";
export interface DeepshaftSelection {
  riskTier: DeepshaftRiskTier;
  /** 1..15 — clamped in Controls. */
  targetDepth: number;
}
export type DeepshaftLevel =
  | { kind: "gold"; levelMultiplier: string }
  | { kind: "cavein" };
export interface DeepshaftResult {
  /** length === reachedDepth + (caveIn ? 1 : 0). Decorative replay only. */
  levels: DeepshaftLevel[];
  reachedDepth: number;
  caveIn: boolean;
  totalMultiplier: string;
  won: boolean;
}

export interface MomentumSelection {
  comboBefore: number;
  cashOut: boolean;
}

export type SelectionFor<G extends GameCode> = G extends "crash"
  ? CrashSelection
  : G extends "dice"
    ? DiceSelection
    : G extends "mines"
      ? MinesSelection
      : G extends "plinko"
        ? PlinkoSelection
        : G extends "limbo"
          ? LimboSelection
          : G extends "hilo"
            ? HiloSelection
            : G extends "mint_reels"
              ? SlotSelection
              : G extends "gold_rush"
                ? SlotSelection
                : G extends "blackjack"
                  ? BlackjackSelection
                  : G extends "roulette"
                    ? RouletteSelection
                    : G extends "deepshaft"
                      ? DeepshaftSelection
                      : G extends "momentum"
                        ? MomentumSelection
                        : never;

/* ---------------- Standard game-surface props ---------------- */

export interface ImportedGameSurfaceProps<G extends GameCode = GameCode> {
  gameCode: G;
  currency: Currency;
  stake: string;
  selection: SelectionFor<G>;
  clientSeed: string;
  availableBalance: string | null;

  commitment: RoundCommitment | null;
  bet: UiBetView | null;
  verification: PhonaraVerificationEvidence | FairnessUiEvidence | null;
  recentBets: RecentBetStripRow[] | PhonaraRecentBet[];

  busy: boolean;
  confirmOpen: boolean;

  /**
   * PHONARA paste flag. When true, the Cursor shell owns the bet-confirm
   * dialog (PHONARA `CasinoShell` mounts it) and the game surface MUST
   * NOT mount its own `BetConfirmDialog` (avoids duplicate testids).
   * Lovable preview leaves this undefined → in-surface dialog renders.
   */
  pasteShellConfirm?: boolean;

  onStakeChange: (v: string) => void;
  onCurrencyChange: (c: Currency) => void;
  onSelectionChange: (sel: SelectionFor<G>) => void;
  onClientSeedChange: (seed: string) => void;

  onPrepareRound: () => void;
  onOpenBetConfirm: () => void;
  onSubmitBet: () => void;
  onCancelBetConfirm: () => void;
}

/* ---------------- §0a Auto-Bet typed per-game slot ---------------- */

/**
 * AutoSlotProps<G> — discriminated, per-game contract for the Auto tab's
 * game-specific parameter slot. Each game's auto component consumes the
 * matching variant; `AutoBetPanel.slot` is the render boundary.
 *
 * Back-compat: existing callers using `autoChildren: ReactNode` continue
 * to work. New callers should fill this typed slot instead.
 */
export type AutoSlotProps<G extends GameCode> = G extends "crash"
  ? { autoCashout: string; onAutoCashoutChange: (v: string) => void }
  : G extends "dice"
    ? {
        target: string;
        onTargetChange: (v: string) => void;
        direction: "over" | "under";
        onDirectionChange: (d: "over" | "under") => void;
      }
    : G extends "limbo"
      ? { target: string; onTargetChange: (v: string) => void }
      : G extends "mines"
        ? {
            mineCount: number;
            onMineCountChange: (n: number) => void;
            revealCount: number;
            onRevealCountChange: (n: number) => void;
          }
        : G extends "plinko"
          ? {
              rows: 8 | 12 | 16;
              onRowsChange: (n: 8 | 12 | 16) => void;
              risk: "low" | "medium" | "high";
              onRiskChange: (r: "low" | "medium" | "high") => void;
            }
          : G extends "deepshaft"
            ? {
                riskTier: DeepshaftRiskTier;
                onRiskTierChange: (t: DeepshaftRiskTier) => void;
                targetDepth: number;
                onTargetDepthChange: (n: number) => void;
              }
            : never;

