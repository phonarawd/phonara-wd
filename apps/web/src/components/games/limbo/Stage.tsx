/**
 * Limbo · Stage — multiplier counter + target input + fairness sheet.
 *
 * Phase 4 v1.3 — PHONARA `packages/game-engine/src/games/limbo.ts` result:
 *   { resultMultiplier: number; won: boolean }
 *
 * Win / Loss / Neutral 3구간 (Limbo 전용 — Plinko와 의도적으로 다름):
 *   - won && final >= 1.01            → win  · juice · CelebrateOverlay
 *   - !won && final >= 1.01           → loss · screenShake (고배수 미스)
 *   - !won && 1.0 ≤ final < 1.01      → neutral · tier 'none' · no shake
 *   - final < 1                       → 엔진 불가 (limbo.ts Math.max(1,raw))
 *                                         · mock 방어용으로만 tier 'none'
 *
 * Counter ease-out animation은 표시 전용 — 최종값은 항상 서버
 * `resultMultiplier`로 스냅. selection.target은 string으로 유지하고
 * parseFloat은 표시/비교 시점에서만 Number(...) 호출.
 *
 * **금지**: `bet.result.multiplier` (구 string 경로) · `bet.multiplier`
 * fallback. red:grep blocks both.
 */
import { useEffect, useRef, useState } from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { ImportedGameSurfaceProps, LimboSelection } from "../shared/types";

type Props = Pick<
  ImportedGameSurfaceProps<"limbo">,
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

  // PHONARA Limbo engine result: { resultMultiplier: number; won: boolean }.
  const r = (p.bet?.result ?? {}) as { resultMultiplier?: number; won?: boolean };
  const final = Number(r.resultMultiplier ?? 0);
  const won = r.won === true;
  const isWin = won && final >= 1.01;
  const tier = isWin ? celebrationTier(final) : "none";

  const target = Number(p.selection.target) || 0;
  const winChance = target > 0 ? (99 / target).toFixed(4) : "0";
  const [display, setDisplay] = useState("1.00");

  useEffect(() => {
    if (!final || final <= 0) return;
    if (reduced) {
      setDisplay(final.toFixed(2));
      play(isWin ? "win" : "lose");
      return;
    }
    const start = performance.now();
    // Fast-ramp + settle: aggressive early acceleration (Stake Limbo feel),
    // shorter cap (~1000ms) — bet CTA is never gated on animation, so a
    // double-tap re-bet during settle simply restarts the ramp.
    const dur = Math.min(1000, 400 + Math.log2(Math.max(1, final)) * 140);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay((1 + (final - 1) * eased).toFixed(2));
      if (t < 1) raf = requestAnimationFrame(tick);
      else play(isWin ? "win" : "lose");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [final, reduced, isWin, play]);

  // 3구간 feel routing.
  useEffect(() => {
    if (!p.bet) return;
    if (isWin) {
      juice(badgeRef.current, { reduced });
    } else if (!won && final >= 1.01) {
      // 고배수 미스 — Limbo 엔진 실경로.
      screenShake(stageRef.current, { reduced });
    }
    // 중립 !won && 1.0 ≤ final < 1.01 → no-op.
    // final < 1 → 엔진 불가 (Math.max(1, raw)), mock 방어 no-op.
     
  }, [p.bet, reduced]);

  return (
    <div
      ref={stageRef}
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface) p-8"
    >
      <style>{`@keyframes limboBurst{0%{opacity:0;transform:scale(.6)}40%{opacity:.85;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}`}</style>
      <div className="absolute right-3 top-3">
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <InfinityIcon className="size-4 text-(--color-primary)" /> Limbo
        </div>
        <div className="relative inline-block">
          {/* Settle burst — transform+opacity only, no rAF.
              Keyed off bet.id so each settle re-triggers. Reduced-motion: off. */}
          {!reduced && p.bet && final >= 1.01 && (
            <span
              key={final}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl",
                "motion-safe:animate-[limboBurst_400ms_ease-out_forwards]",
                isWin ? "bg-(--color-up)/40" : "bg-(--color-down)/25",
              )}
            />
          )}
          <div
            ref={badgeRef}
            style={{ willChange: "transform" }}
            className={cn(
              "font-mono text-7xl font-bold tabular-nums tracking-tight",
              final > 0
                ? isWin
                  ? "text-(--color-up)"
                  : "text-(--color-down)"
                : "text-foreground",
            )}
          >
            {display}×
          </div>
        </div>
        <div
          className="mt-2 text-xs text-muted-foreground"
          data-game-id="limbo-winchance"
        >
          {t("games.limbo.stage.targetWinChance", { target: p.selection.target || "—", chance: winChance })}
        </div>
      </div>

      {/* target input large */}
      <div data-game-id="limbo-target-input">
        <label
          htmlFor="t"
          className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          {t("games.limbo.stage.targetLabel")}
        </label>
        <input
          id="t"
          inputMode="decimal"
          value={p.selection.target}
          onChange={(e) =>
            p.onSelectionChange({
              target: e.target.value.replace(/[^\d.]/g, "").slice(0, 10),
            } as LimboSelection)
          }
          className="min-h-12 w-full rounded-md border border-border bg-(--color-surface) px-3 text-center font-mono text-xl tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          placeholder="2.00"
        />
      </div>

      <CelebrateOverlay tier={tier} multiplier={final.toFixed(2)} reduced={reduced} />
    </div>
  );
}
