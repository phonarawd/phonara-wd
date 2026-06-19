/**
 * Blackjack · Stage — semicircle felt, dealer top, player single-seat bottom.
 *
 * Phase 4 v1 RED LOCK FINAL+ — engine truth:
 *   { totalMultiplier: string } only. Card payload (dealer/player) is
 *   preview-only and never participates in payout.
 *
 *   WIN  → Number(totalMultiplier) >= 1.01 (juice + CelebrateOverlay tier)
 *   PUSH → === 1                          (neutral · no juice / no shake)
 *   LOSE → < 1                            (shake)
 *
 * Reduced-motion: `bjFlip` keyframe disabled (instant placement).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FairnessSheet } from "../shared/FairnessSheet";
import { CelebrateOverlay } from "../shared/celebrate/CelebrateOverlay";
import { celebrationTier, type CelebrationTier } from "../shared/celebrate/tier";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { handScore } from "./playBlackjack";
import type { ImportedGameSurfaceProps } from "../shared/types";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];

type Props = Pick<
  ImportedGameSurfaceProps<"blackjack">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
> & { finished?: boolean };

function cardFace(idx: number) {
  const r = ((idx % 13) + 13) % 13;
  const s = Math.floor(idx / 13) % 4;
  return { rank: RANKS[r] ?? "?", suit: SUITS[s] ?? "?", red: s === 1 || s === 2 };
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const result = p.bet?.result as
    | { totalMultiplier?: string; dealer?: number[]; player?: number[] }
    | undefined;

  const dealer = useMemo(() => result?.dealer ?? [], [result?.dealer]);
  const player = useMemo(() => result?.player ?? [], [result?.player]);
  const mult = result?.totalMultiplier;
  const settleMult = mult != null ? Number(mult) : null;

  // 4-state tier: LOSS <1 (covers engine 0 LOSE) · PUSH ===1 · WIN >1 && <2.5 · BLACKJACK >=2.5
  const state: "idle" | "win" | "push" | "lose" | "blackjack" =
    settleMult == null
      ? "idle"
      : settleMult >= 2.5
        ? "blackjack"
        : settleMult > 1
          ? "win"
          : settleMult === 1
            ? "push"
            : "lose";

  const [tier, setTier] = useState<CelebrationTier>("none");
  const [shake, setShake] = useState(false);
  const lastBetKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const betKey = p.bet ? `${mult ?? ""}:${p.bet.status ?? ""}` : null;
    if (betKey === lastBetKeyRef.current) return;
    lastBetKeyRef.current = betKey;
    if ((state === "win" || state === "blackjack") && settleMult != null) {
      setTier(celebrationTier(settleMult));
      setShake(false);
    } else if (state === "lose") {
      setTier("none");
      setShake(true);
      const id = window.setTimeout(() => setShake(false), 350);
      return () => window.clearTimeout(id);
    } else {
      setTier("none");
      setShake(false);
    }
  }, [p.bet, mult, state, settleMult]);

  return (
    <div
      data-testid="casino-stage"
      className={cn(
        "relative grid gap-4 overflow-hidden rounded-2xl border border-emerald-600/40 ring-1 ring-amber-200/10",
        "bg-gradient-to-b from-emerald-950/90 via-emerald-900/50 to-emerald-950/80 p-4",
        shake && !reduced && "animate-[bjShake_0.35s_ease-in-out]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[40%_40%_20%_20%/50%_50%_15%_15%] border-2 border-amber-500/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(252,211,77,0.12), transparent 55%)",
        }}
      />

      <div className="relative flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
          Live Blackjack
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Dealer · PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle. */}
      <div className="relative grid place-items-center gap-2 pt-2">
        <div className="text-[10px] uppercase tracking-widest text-amber-300/80">DEALER</div>
        <div className="flex gap-2">
          {dealer.length === 0 ? (
            <PlaceholderCard />
          ) : (
            dealer.map((c, i) => (
              <Card key={i} card={cardFace(c)} delay={i * 0.12} reduced={reduced} />
            ))
          )}
        </div>
        {dealer.length > 0 && (
          <div className="text-xs tabular-nums text-emerald-200/70">{handScore(dealer)}</div>
        )}
      </div>

      {/* Player */}
      <div className="relative grid place-items-center gap-2 pb-4">
        <div className="flex gap-2">
          {player.length === 0 ? (
            <PlaceholderCard />
          ) : (
            player.map((c, i) => (
              <Card key={i} card={cardFace(c)} delay={0.3 + i * 0.12} reduced={reduced} />
            ))
          )}
        </div>
        {player.length > 0 && (
          <div className="text-xs tabular-nums text-emerald-200/70">{handScore(player)}</div>
        )}
        <div className="text-[10px] uppercase tracking-widest text-emerald-300/60">
          SEAT 1 · {p.selection.actions.length}
        </div>
      </div>

      {state !== "idle" && (
        <div
          className={cn(
            "relative grid place-items-center gap-1 rounded-lg border py-2 font-bold tabular-nums",
            state === "blackjack" &&
              "border-amber-300/70 bg-amber-500/15 text-amber-200 text-2xl",
            state === "win" &&
              "border-amber-400/60 bg-amber-500/10 text-amber-200 text-xl",
            state === "push" &&
              "border-stone-500/40 bg-stone-700/30 text-stone-200 text-sm",
            state === "lose" &&
              "border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm",
          )}
        >
          {state === "blackjack" && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(252,211,77,0.30), transparent 65%)",
              }}
            />
          )}
          <div className="flex items-center gap-2">
            {state === "blackjack" && <Crown className="size-5 text-amber-300" aria-hidden />}
            <span>
              {state === "blackjack"
                ? t("games.blackjack.blackjack")
                : state === "win"
                  ? t("games.blackjack.win")
                  : state === "push"
                    ? t("games.blackjack.push")
                    : t("games.blackjack.loss")}
            </span>
            {(state === "win" || state === "blackjack") && settleMult != null && (
              <span>· {settleMult.toFixed(2)}×</span>
            )}
          </div>
        </div>
      )}

      <CelebrateOverlay tier={tier} multiplier={mult ?? ""} reduced={reduced} />

      <style>{`
        @keyframes bjFlip {
          0% { transform: rotateY(180deg) translateY(-8px); opacity: 0; }
          60% { transform: rotateY(20deg) translateY(2px); opacity: 1; }
          100% { transform: rotateY(0) translateY(0); opacity: 1; }
        }
        @keyframes bjShake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-bj-card] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Card({
  card,
  delay,
  reduced,
}: {
  card: { rank: string; suit: string; red: boolean };
  delay: number;
  reduced: boolean;
}) {
  return (
    <div
      data-bj-card
      className="grid h-24 w-16 place-items-center rounded-md border border-stone-300/20 bg-stone-100 shadow-lg"
      style={
        reduced
          ? undefined
          : {
              animation: `bjFlip 0.45s cubic-bezier(0.2,0.7,0.2,1) ${delay}s both`,
              transformStyle: "preserve-3d",
            }
      }
    >
      <div className="text-center">
        <div
          className={cn(
            "text-xl font-black tabular-nums",
            card.red ? "text-rose-600" : "text-stone-900",
          )}
        >
          {card.rank}
        </div>
        <div className={cn("text-xl", card.red ? "text-rose-600" : "text-stone-900")}>
          {card.suit}
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="grid h-24 w-16 place-items-center rounded-md border border-dashed border-emerald-500/30 bg-emerald-900/20 text-[10px] text-emerald-300/60">
      —
    </div>
  );
}
