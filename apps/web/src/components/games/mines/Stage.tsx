/**
 * Mines · Stage — 5×5 tile grid + fairness sheet + preview stats.
 *
 * Engine wire-shape: `{ minePositions: number[]; hitMine: boolean }`.
 * Mines is ONE-SHOT — the engine decides the full layout at bet instant;
 * this Stage REPLAYS the pre-decided result with a CSS-transform-only
 * 3D flip animation. No rAF loop, no per-tile RPC.
 *
 * §0a OUTCOME-LEAK quarantine (BLOCKING invariant):
 *  - `minePositions[]` is read ONLY inside `resolveTileState` closure.
 *  - `MinesTile` receives a resolved `state` string ("hidden" | "picked"
 *    | "revealed-gem" | "bust") — NEVER the full layout array.
 *  - Untouched tiles stay `state: "hidden"` even after settle (including
 *    untouched mines). The only post-settle reveal of a mine is on a
 *    tile the player picked that turned out to be a mine ("bust").
 *  - Therefore mine indices cannot leak via DOM, attributes, classList,
 *    or React fiber memoizedProps of untouched tiles.
 *
 * Feel 2지 routing unchanged:
 *  - !hitMine && revealedCells.length > 0 → juice + win sound + Celebrate
 *  - hitMine → screenShake + lose sound
 */
import { useEffect, useMemo, useRef } from "react";
import { Bomb } from "lucide-react";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { useSound } from "../shared/hooks/useSound";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { minesPreviewMultiplier } from "./multiplier";
import { MinesTile, type MinesTileState } from "./MinesTile";
import "../shared/motion-tokens.css";
import type { ImportedGameSurfaceProps, MinesSelection } from "../shared/types";

const GRID = 25;
const CLICK_SOUND_THROTTLE_MS = 80;

type Props = Pick<
  ImportedGameSurfaceProps<"mines">,
  | "gameCode"
  | "selection"
  | "bet"
  | "busy"
  | "commitment"
  | "clientSeed"
  | "verification"
  | "onClientSeedChange"
  | "onSelectionChange"
>;

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const lastClickSoundRef = useRef(0);

  const sel = p.selection;
  const revealed = sel.revealedCells ?? [];
  const ready = Boolean(p.commitment);
  const settled = Boolean(p.bet);
  const result = p.bet?.result as
    | { minePositions?: number[]; hitMine?: boolean }
    | undefined;

  const nextMult = useMemo(
    () => minesPreviewMultiplier(revealed.length + 1, sel.mineCount),
    [revealed.length, sel.mineCount],
  );
  const currMult = useMemo(
    () =>
      revealed.length === 0
        ? "1.00"
        : minesPreviewMultiplier(revealed.length, sel.mineCount),
    [revealed.length, sel.mineCount],
  );

  const finalMult = Number(currMult);
  const tier =
    settled && result?.hitMine === false && revealed.length > 0 && finalMult >= 1.01
      ? celebrationTier(finalMult)
      : "none";

  // Feel routing on settle.
  useEffect(() => {
    if (!p.bet) return;
    if (result?.hitMine) {
      screenShake(stageRef.current, { reduced });
      play("lose");
    } else if (revealed.length > 0) {
      juice(badgeRef.current, { reduced });
      play("win");
    }
     
  }, [p.bet, reduced]);

  // §0a quarantine: minePositions read only here; resolved state shipped
  // per-tile. Untouched tiles always "hidden" — untouched mines do NOT
  // surface even at settle.
  function resolveTileState(i: number): MinesTileState {
    const touched = revealed.includes(i);
    if (!settled) return touched ? "picked" : "hidden";
    if (!touched) return "hidden";
    return result?.minePositions?.includes(i) ? "bust" : "revealed-gem";
  }

  const toggleTile = (i: number) => {
    if (settled || p.busy) return;
    const now = Date.now();
    if (now - lastClickSoundRef.current >= CLICK_SOUND_THROTTLE_MS) {
      lastClickSoundRef.current = now;
      play("click");
    }
    if (revealed.includes(i)) {
      p.onSelectionChange({
        ...sel,
        revealedCells: revealed.filter((c) => c !== i),
      } as MinesSelection);
    } else {
      const tileMineTotal = sel.mineCount;
      if (revealed.length + tileMineTotal >= GRID) return;
      p.onSelectionChange({
        ...sel,
        revealedCells: [...revealed, i],
      } as MinesSelection);
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative grid gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface) p-4"
    >
      <div className="flex items-center justify-between">
        <div
          ref={badgeRef}
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          <Bomb className="size-4 text-(--color-down)" /> Mines {sel.mineCount}
        </div>
        <FairnessSheet
          gameCode={p.gameCode}
          clientSeed={p.clientSeed}
          commitment={p.commitment}
          verification={p.verification}
          onClientSeedChange={p.onClientSeedChange}
        />
      </div>

      {/* Grid — fixed 5×5 aspect-square cells, CLS = 0. Idle micro-pulse
          is a sibling overlay so it never touches tile content. */}
      <div className="relative mx-auto w-full max-w-md">
        {!reduced && !settled && !ready && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-md bg-(--color-primary)/10 animate-tile-idle"
          />
        )}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: GRID }, (_, i) => (
            <MinesTile
              key={i}
              index={i}
              state={resolveTileState(i)}
              disabled={settled || !ready || p.busy}
              reduced={reduced}
              onToggle={toggleTile}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label={t("games.mines.stage.currentMult")} value={`${currMult}×`} />
        <Stat label={t("games.mines.stage.nextTile")} value={`${nextMult}×`} />
        <Stat
          label={t("games.mines.stage.picked")}
          value={`${revealed.length} / ${GRID - sel.mineCount}`}
        />
      </div>

      <CelebrateOverlay tier={tier} multiplier={currMult} reduced={reduced} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn("rounded-md border border-border bg-(--color-surface) p-2")}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
