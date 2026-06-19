/**
 * Dice · Stage — roll readout + threshold bar + target slider + OVER/UNDER.
 *
 * Phase 5 v1 RED LOCK v3.1 — PHONARA `dice.ts` `resultFromFloats` 1:1:
 *   { roll: number /* [0.00, 99.99] *\/; won: boolean }
 *
 * Feel 2지 (정본 키만):
 *   - won === true && bet.multiplier >= 1.01 → juice + CelebrateOverlay(tier)
 *   - won === false                          → screenShake + lose sound
 *   - r.roll === undefined (idle settle)     → no-op
 *
 * WIN/LOSE 라벨·color 모두 `result.won` 진실 — Stage에서 `over ? roll>target`
 * 재계산 금지 (engine/UI drift). top-level `bet.multiplier` 사용 (HiLo의
 * `rounds[-1].multiplier`와 구분).
 *
 * The target slider and direction toggle live here (Stage canvas in the
 * original design); both wire to `onSelectionChange`.
 */
import { useEffect, useMemo, useRef } from "react";
import { Dice5 } from "lucide-react";
import { FairnessSheet } from "../shared/FairnessSheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import type { DiceSelection, ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<
  ImportedGameSurfaceProps<"dice">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "onClientSeedChange"
  | "onSelectionChange"
>;

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const target = Number(p.selection.target) || 50;
  const over = p.selection.direction === "over";
  const winChance = over ? 100 - target : target;
  // Display-only multiplier preview (1% house edge example — server is authoritative).
  const mult = useMemo(() => {
    const c = Math.max(0.01, winChance);
    return (99 / c || 0).toFixed(4);
  }, [winChance]);

  const r = p.bet?.result as { roll?: number; won?: boolean } | undefined;
  const roll = r?.roll;
  const won = r?.won === true;
  const settleMult = Number(p.bet?.multiplier ?? 0);
  const isWin = p.bet ? won && settleMult >= 1.01 : false;
  const tier = isWin ? celebrationTier(settleMult) : "none";

  // Feel 2지 routing — engine truth only (`result.won`).
  useEffect(() => {
    if (!p.bet || roll === undefined) return; // idle guard
    if (won && settleMult >= 1.01) {
      juice(badgeRef.current, { reduced });
      play("win");
    } else if (!won) {
      screenShake(stageRef.current, { reduced });
      play("lose");
    }
     
  }, [p.bet, reduced]);

  return (
    <div
      ref={stageRef}
      className="relative grid gap-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface) p-6"
    >
      <div className="flex items-center justify-between">
        <div ref={badgeRef} className="flex items-center gap-2">
          <Dice5 className="size-5 text-(--color-primary)" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dice
          </span>
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Roll readout */}
      <div className="text-center">
        <div className="font-mono text-5xl font-bold tabular-nums">
          {roll !== undefined ? roll.toFixed(2) : "—"}
        </div>
        <div
          className={cn(
            "mt-2 text-xs uppercase tracking-wider",
            roll === undefined
              ? "text-muted-foreground"
              : won
                ? "text-(--color-up)"
                : "text-(--color-down)",
          )}
        >
          {roll === undefined ? t("games.dice.stage.waiting") : won ? "WIN" : "LOSE"}
        </div>
      </div>

      {/* Threshold bar — transform-only fill + roll marker (no layout paint). */}
      <div className="relative h-8 overflow-hidden rounded-full bg-(--color-surface-elev) ring-1 ring-border">
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-full rounded-full bg-(--color-up)/30",
            reduced ? "" : "transition-transform duration-200 ease-out",
          )}
          style={{
            transform: `scaleX(${Math.max(0, Math.min(100, winChance)) / 100})`,
            transformOrigin: over ? "right" : "left",
            willChange: "transform",
          }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-(--color-gold)"
          style={{
            transform: `translateX(${target}%)`,
            willChange: "transform",
          }}
          aria-label={`target ${target}`}
        />
        {roll !== undefined && (
          <div
            className={cn(
              "absolute -top-1.5 size-3 rounded-full shadow",
              won ? "bg-(--color-up)" : "bg-(--color-down)",
              reduced ? "" : "transition-transform duration-300 ease-out",
            )}
            style={{
              left: 0,
              transform: `translateX(calc(${roll}% - 50%))`,
              willChange: "transform",
            }}
            data-testid="casino-dice-roll-marker"
          />
        )}
      </div>

      <div data-game-id="dice-target-input">
        <Slider
          value={[target]}
          min={2}
          max={98}
          step={0.01}
          onValueChange={([v]) => {
            if (v === undefined) return;
            p.onSelectionChange({ ...p.selection, target: v.toFixed(2) } as DiceSelection);
          }}
          aria-label={t("games.dice.stage.targetAria")}
        />
      </div>

      <div
        className="grid grid-cols-3 gap-2 text-center text-xs"
        data-game-id="dice-direction-pills"
      >
        <Stat label={t("games.dice.stage.multiplier")} value={`${mult}×`} />
        <Stat label={t("games.dice.stage.winChance")} value={`${winChance.toFixed(2)}%`} />
        <Stat
          label={t("games.dice.stage.direction")}
          value={
            <button
              type="button"
              onClick={() =>
                p.onSelectionChange({
                  ...p.selection,
                  direction: over ? "under" : "over",
                } as DiceSelection)
              }
              className="font-bold uppercase text-(--color-primary)"
            >
              {over ? "OVER ▲" : "UNDER ▼"}
            </button>
          }
        />
      </div>


      <CelebrateOverlay tier={tier} multiplier={settleMult.toFixed(2)} reduced={reduced} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-(--color-surface) p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
