/**
 * HiLo · Stage — 카드 행, 시작 카드 picker, Higher/Skip/Lower 버튼,
 * 페어니스 시트. 원본 HiloGame 좌측 영역과 시각적으로 1:1.
 *
 * Phase 5 v1 LOCK — PHONARA `packages/game-engine/src/games/hilo.ts` 정본:
 *   {
 *     cards: number[];
 *     rounds: Array<{ card:number; guess:'higher'|'lower'|'skip'; correct:boolean; multiplier:number }>;
 *     won: boolean;
 *   }
 *
 * Feel 2지:
 *   - won === true && lastMult >= 1.01 → juice + CelebrateOverlay(tier)
 *   - won === false                    → screenShake + lose sound
 *   - rounds.length === 0 settle       → no-op (idle guard)
 *
 * tier 임계: `result.rounds[rounds.length - 1].multiplier` (top-level
 * resultMultiplier/multiplier 키 사용 금지 — paste adapter 1:1).
 *
 * 카드 진실(`result.cards`)은 항상 서버 `bet.result`에서 옴. 클라이언트
 * 측은 startCard·guesses UI 연출 전용. parseFloat은 사용하지 않는다
 * (HiLo 셀렉션은 숫자 카드 index + enum 배열).
 */
import { useEffect, useMemo, useRef } from "react";
import { ArrowDown, ArrowUp, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import type { HiloSelection, HiLoResult, ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<
  ImportedGameSurfaceProps<"hilo">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
  | "onSelectionChange"
>;

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

function cardLabel(idx: number | null): { rank: string; suit: string; red: boolean } | null {
  if (idx === null || idx === undefined) return null;
  const r = idx % 13;
  const s = Math.floor(idx / 13) % 4;
  return { rank: RANKS[r] ?? "?", suit: SUITS[s] ?? "?", red: s === 1 || s === 2 };
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const sel = p.selection;
  const ready = Boolean(p.commitment);
  const start = useMemo(() => cardLabel(sel.startCard), [sel.startCard]);
  const result = p.bet?.result as Partial<HiLoResult> | undefined;
  const revealed = (result?.cards ?? []).map(cardLabel);
  const lastMult = result?.rounds?.[result.rounds.length - 1]?.multiplier ?? 1;
  const won = result?.won === true;
  const isWin = p.bet ? won && Number(lastMult) >= 1.01 : false;
  const tier = isWin ? celebrationTier(Number(lastMult)) : "none";

  // Feel 2지 routing — 정본 키 사용.
  useEffect(() => {
    if (!p.bet) return;
    if ((result?.rounds?.length ?? 0) === 0) return; // idle guard
    if (won && Number(lastMult) >= 1.01) {
      juice(badgeRef.current, { reduced });
      play("win");
    } else if (!won) {
      screenShake(stageRef.current, { reduced });
      play("lose");
    }
     
  }, [p.bet, reduced]);

  const addGuess = (g: "higher" | "lower" | "skip") => {
    p.onSelectionChange({ ...sel, guesses: [...sel.guesses, g] } as HiloSelection);
  };
  const reset = () =>
    p.onSelectionChange({ startCard: null, guesses: [] } as HiloSelection);

  const startRankVal = sel.startCard !== null ? sel.startCard % 13 : null;
  const higherChance = startRankVal !== null ? ((12 - startRankVal) / 13) * 100 : 50;

  return (
    <div
      ref={stageRef}
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface) p-4"
      data-game-id="hilo-stage"
    >
      <style>{`@keyframes hiloFlip{0%{opacity:0;transform:rotateY(180deg)}60%{opacity:1}100%{opacity:1;transform:rotateY(0)}}@keyframes hiloBurst{0%{opacity:0;transform:scale(.7)}45%{opacity:.85;transform:scale(1.15)}100%{opacity:0;transform:scale(1.4)}}`}</style>
      <div className="flex items-center justify-between">
        <div
          ref={badgeRef}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {t("games.hilo.stage.guessCount", { count: sel.guesses.length })}
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              isWin ? "text-(--color-up)" : p.bet ? "text-(--color-down)" : "text-foreground",
            )}
            data-game-id="hilo-cumulative-mult"
            style={{ willChange: "transform" }}
          >
            {Number(lastMult).toFixed(2)}×
          </div>
          <FairnessSheet
            gameCode={p.gameCode}
            clientSeed={p.clientSeed}
            commitment={p.commitment}
            verification={p.verification}
            onClientSeedChange={p.onClientSeedChange}
          />
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-2 py-4">
        {!reduced && p.bet && (
          <span
            key={revealed.length}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl motion-safe:animate-[hiloBurst_400ms_ease-out_forwards]",
              isWin ? "bg-(--color-up)/35" : "bg-(--color-down)/20",
            )}
          />
        )}
        <Card card={start} highlighted />
        {revealed.map((c, i) => (
          <Card key={i} card={c} flipIndex={i} reduced={reduced} />
        ))}
        {sel.guesses.length > revealed.length && (
          <div className="grid h-28 w-20 place-items-center rounded-lg border border-dashed border-border bg-(--color-surface)/40 text-xs text-muted-foreground">
            {t("games.hilo.stage.idle")}
          </div>
        )}
      </div>


      {sel.startCard === null && (
        <div>
          <div className="mb-2 text-center text-xs text-muted-foreground">
            {t("games.hilo.stage.pickStart")}
          </div>
          <div
            className="mx-auto grid max-w-md gap-1"
            style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
          >
            {RANKS.map((r, i) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  p.onSelectionChange({ ...sel, startCard: i } as HiloSelection)
                }
                className="min-h-9 rounded border border-border bg-(--color-surface) text-xs font-bold hover:border-(--color-primary)/40"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {sel.startCard !== null && (
        <div className="grid grid-cols-3 gap-2">
          <GuessBtn
            icon={<ArrowUp className="size-4" />}
            label={`Higher ${higherChance.toFixed(0)}%`}
            onClick={() => addGuess("higher")}
            disabled={!ready || p.busy}
            tone="up"
          />
          <GuessBtn
            icon={<SkipForward className="size-4" />}
            label="Skip"
            onClick={() => addGuess("skip")}
            disabled={!ready || p.busy}
          />
          <GuessBtn
            icon={<ArrowDown className="size-4" />}
            label={`Lower ${(100 - higherChance).toFixed(0)}%`}
            onClick={() => addGuess("lower")}
            disabled={!ready || p.busy}
            tone="down"
          />
        </div>
      )}

      {sel.startCard !== null && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("games.hilo.stage.reset")}
        </button>
      )}

      <CelebrateOverlay tier={tier} multiplier={Number(lastMult).toFixed(2)} reduced={reduced} />
    </div>
  );
}

function Card({
  card,
  highlighted,
  flipIndex,
  reduced,
}: {
  card: { rank: string; suit: string; red: boolean } | null;
  highlighted?: boolean;
  flipIndex?: number;
  reduced?: boolean;
}) {
  if (!card) return null;
  const animate = !reduced && flipIndex !== undefined;
  return (
    <div
      className={cn(
        "grid h-28 w-20 place-items-center rounded-lg border bg-(--color-surface) text-center shadow-sm",
        highlighted ? "border-(--color-primary)" : "border-border",
        animate && "motion-safe:animate-[hiloFlip_350ms_ease-out_both]",
      )}
      style={animate ? { willChange: "transform", transformStyle: "preserve-3d" } : undefined}
    >
      <div>
        <div
          className={cn(
            "text-2xl font-bold tabular-nums",
            card.red ? "text-(--color-down)" : "text-foreground",
          )}
        >
          {card.rank}
        </div>
        <div className={cn("text-2xl", card.red ? "text-(--color-down)" : "text-foreground")}>
          {card.suit}
        </div>
      </div>
    </div>
  );
}

function GuessBtn({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-11 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition-colors disabled:opacity-50",
        tone === "up" && "border-(--color-up)/40 text-(--color-up) hover:bg-(--color-up)/10",
        tone === "down" &&
          "border-(--color-down)/40 text-(--color-down) hover:bg-(--color-down)/10",
        !tone && "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
