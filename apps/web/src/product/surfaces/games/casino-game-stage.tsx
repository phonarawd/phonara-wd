import { forwardRef } from 'react';
import type { BlackjackMove, GameCode, HiLoGuess } from '@phonara/game-engine';

import { isCasinoBatchAGame } from '@/domain/casino-games-batch-a-display-contract';
import { isCasinoBatchBGame } from '@/domain/casino-games-batch-b-display-contract';
import { isCasinoBatchCGame } from '@/domain/casino-games-batch-c-display-contract';
import {
  isCasinoBatchDGame,
  normalizeRouletteLegs,
} from '@/domain/casino-games-batch-d-display-contract';
import { BlackjackStage } from '@/product/surfaces/games/blackjack-stage';
import { CasinoGameStagePlaceholder } from '@/product/surfaces/games/casino-game-stage-placeholder';
import { CrashStage } from '@/product/surfaces/games/crash-stage';
import { DeepshaftStage } from '@/product/surfaces/games/deepshaft-stage';
import { DiceStage } from '@/product/surfaces/games/dice-stage';
import { GoldRushStage } from '@/product/surfaces/games/gold-rush-stage';
import { HiloStage } from '@/product/surfaces/games/hilo-stage';
import { LimboStage } from '@/product/surfaces/games/limbo-stage';
import { MinesStage } from '@/product/surfaces/games/mines-stage';
import { MintReelsStage } from '@/product/surfaces/games/mint-reels-stage';
import { MomentumStage } from '@/product/surfaces/games/momentum-stage';
import { PlinkoStage } from '@/product/surfaces/games/plinko-stage';
import { RouletteStage } from '@/product/surfaces/games/roulette-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

export type CasinoGameStageLiveControls = {
  liveMode: boolean;
  liveSessionActive?: boolean;
  liveCashoutBusy?: boolean;
  liveMultiplier?: string | null;
  liveRoundStatus?: string | null;
  onLiveCashout?: () => void;
  onLiveRevealCell?: (cell: number) => void;
  onLiveGuess?: (guess: HiLoGuess) => void;
  onLiveMove?: (move: BlackjackMove) => void;
};

export type CasinoGameStageProps = {
  gameCode: GameCode;
  selection: Record<string, unknown>;
  onSelectionChange?: (next: Record<string, unknown>) => void;
  selectionDisabled?: boolean;
  liveControls?: CasinoGameStageLiveControls;
};

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((n): n is number => typeof n === 'number' && Number.isInteger(n));
}

function asHiloGuesses(value: unknown): HiLoGuess[] {
  if (!Array.isArray(value)) return [];
  return value.filter((g): g is HiLoGuess => g === 'higher' || g === 'lower' || g === 'skip');
}

function asBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  return false;
}

const BJ_MOVES = new Set<BlackjackMove>(['hit', 'stand', 'double', 'split', 'insurance']);

function asBlackjackActions(value: unknown): Array<{ seat: number; move: BlackjackMove }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const seat =
      typeof row['seat'] === 'number' && Number.isInteger(row['seat']) ? row['seat'] : null;
    const move = row['move'];
    if (seat === null || typeof move !== 'string' || !BJ_MOVES.has(move as BlackjackMove)) {
      return [];
    }
    return [{ seat, move: move as BlackjackMove }];
  });
}

/**
 * Stage slot router — Batch A/B/C/D live; unknown codes keep placeholder.
 */
export const CasinoGameStage = forwardRef<CasinoStageHandle, CasinoGameStageProps>(
  function CasinoGameStage(
    { gameCode, selection, onSelectionChange, selectionDisabled, liveControls },
    ref,
  ) {
    const live = liveControls?.liveMode === true;
    if (isCasinoBatchAGame(gameCode)) {
      if (gameCode === 'crash') {
        return (
          <CrashStage
            ref={ref}
            autoCashout={String(selection['autoCashout'] ?? '')}
            liveMode={live}
            liveMultiplier={liveControls?.liveMultiplier}
            liveRoundStatus={liveControls?.liveRoundStatus}
            liveCashoutBusy={liveControls?.liveCashoutBusy}
            onLiveCashout={liveControls?.onLiveCashout}
          />
        );
      }
      if (gameCode === 'limbo') {
        return <LimboStage ref={ref} target={String(selection['target'] ?? '')} />;
      }
      return (
        <DiceStage
          ref={ref}
          target={String(selection['target'] ?? '')}
          direction={String(selection['direction'] ?? 'over')}
        />
      );
    }

    if (isCasinoBatchBGame(gameCode)) {
      if (gameCode === 'mines') {
        const mineCount = Number(selection['mineCount'] ?? 3);
        return (
          <MinesStage
            ref={ref}
            mineCount={Number.isFinite(mineCount) ? mineCount : 3}
            revealedCells={asNumberArray(selection['revealedCells'])}
            selectionDisabled={selectionDisabled}
            liveMode={live}
            liveSessionActive={liveControls?.liveSessionActive}
            liveCashoutBusy={liveControls?.liveCashoutBusy}
            onLiveRevealCell={liveControls?.onLiveRevealCell}
            onLiveCashout={liveControls?.onLiveCashout}
            onRevealedCellsChange={
              onSelectionChange
                ? (next) => onSelectionChange({ ...selection, revealedCells: next })
                : undefined
            }
          />
        );
      }
      const startRaw = selection['startCard'];
      const startCard =
        typeof startRaw === 'number' && Number.isInteger(startRaw) ? startRaw : null;
      return (
        <HiloStage
          ref={ref}
          startCard={startCard}
          guesses={asHiloGuesses(selection['guesses'])}
          selectionDisabled={selectionDisabled}
          liveMode={live}
          liveSessionActive={liveControls?.liveSessionActive}
          liveCashoutBusy={liveControls?.liveCashoutBusy}
          onLiveGuess={liveControls?.onLiveGuess}
          onLiveCashout={liveControls?.onLiveCashout}
          onGuessesChange={
            onSelectionChange
              ? (next) => onSelectionChange({ ...selection, guesses: next })
              : undefined
          }
        />
      );
    }

    if (isCasinoBatchCGame(gameCode)) {
      if (gameCode === 'plinko') {
        return (
          <PlinkoStage
            ref={ref}
            rows={Number(selection['rows'] ?? 12)}
            risk={String(selection['risk'] ?? 'medium')}
          />
        );
      }
      if (gameCode === 'mint_reels') {
        const lines = Number(selection['lines'] ?? 20);
        return <MintReelsStage ref={ref} lines={Number.isFinite(lines) ? lines : 20} />;
      }
      if (gameCode === 'gold_rush') {
        const lines = Number(selection['lines'] ?? 20);
        return <GoldRushStage ref={ref} lines={Number.isFinite(lines) ? lines : 20} />;
      }
      const comboBefore = Number(selection['comboBefore'] ?? 0);
      return (
        <MomentumStage
          ref={ref}
          comboBefore={Number.isFinite(comboBefore) ? comboBefore : 0}
          cashOut={asBool(selection['cashOut'])}
        />
      );
    }

    if (isCasinoBatchDGame(gameCode)) {
      if (gameCode === 'roulette') {
        return (
          <RouletteStage
            ref={ref}
            bets={normalizeRouletteLegs(selection['bets'])}
            selectionDisabled={selectionDisabled}
            onBetsChange={
              onSelectionChange
                ? (next) => onSelectionChange({ ...selection, bets: next })
                : undefined
            }
          />
        );
      }
      if (gameCode === 'blackjack') {
        return (
          <BlackjackStage
            ref={ref}
            actions={asBlackjackActions(selection['actions'])}
            selectionDisabled={selectionDisabled}
            liveMode={live}
            liveSessionActive={liveControls?.liveSessionActive}
            onLiveMove={liveControls?.onLiveMove}
            onActionsChange={
              onSelectionChange
                ? (next) => onSelectionChange({ ...selection, actions: next })
                : undefined
            }
          />
        );
      }
      return (
        <DeepshaftStage
          ref={ref}
          riskTier={String(selection['riskTier'] ?? 'standard')}
          targetDepth={Number(selection['targetDepth'] ?? 5)}
        />
      );
    }

    return <CasinoGameStagePlaceholder gameCode={gameCode} />;
  },
);
