/**
 * Blackjack — Phase 1E functional QA + real card-face rendering + deal/flip
 * polish (phase1e-blackjack / resume-phase1e-blackjack).
 *
 * Covers what casino-games-batch-d-stages.test.tsx does not: real rank/suit
 * faces (no UP/? placeholders), dealer hole flip pacing, win/lose motion
 * tokens, live mid-round hands, unmount timer cleanup, reduced-motion.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeBlackjackCard } from '@/domain/casino-games-batch-d-display-contract';
import { I18nProvider } from '@/product/i18n';
import { BlackjackStage } from '@/product/surfaces/games/blackjack-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

const WIN_WITH_HANDS = {
  totalMultiplier: 2,
  player: [1, 13], // A♠ K♠
  dealer: [26, 39], // K♥ Q♦
  playerValue: 21,
  dealerValue: 20,
};

const LOSE_WITH_HANDS = {
  totalMultiplier: 0,
  player: [5, 6],
  dealer: [10, 11],
  playerValue: 11,
  dealerValue: 20,
};

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function readRepo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('BlackjackStage — phase1e-blackjack', () => {
  it('idle shows face-down dealer slots — never UP/? text placeholders', () => {
    wrap(<BlackjackStage actions={[{ seat: 0, move: 'stand' }]} onActionsChange={vi.fn()} />);
    const up = screen.getByTestId('casino-blackjack-dealer-upcard');
    const hole = screen.getByTestId('casino-blackjack-dealer-hole');
    expect(up).toHaveAttribute('data-face', 'back');
    expect(hole).toHaveAttribute('data-face', 'back');
    expect(up.textContent).not.toMatch(/UP|\?/);
    expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
  });

  it('renders real rank+suit faces from RPC hands after settle', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <BlackjackStage
        ref={handle}
        actions={[{ seat: 0, move: 'stand' }]}
        onActionsChange={vi.fn()}
      />,
    );

    await act(async () => {
      const p = handle.current?.playOutcome(WIN_WITH_HANDS);
      await vi.runAllTimersAsync();
      await p;
    });

    await waitFor(() => {
      expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });

    const up = screen.getByTestId('casino-blackjack-dealer-upcard');
    expect(up).toHaveAttribute('data-face', 'up');
    expect(up).toHaveAttribute('data-card-id', '26');
    const ace = decodeBlackjackCard(1)!;
    expect(screen.getByTestId('casino-blackjack-player-card-0').textContent).toContain(
      ace.rankLabel,
    );
    expect(screen.getByTestId('casino-blackjack-player-card-0').textContent).toContain(
      ace.suitSymbol,
    );
    expect(screen.getByTestId('casino-blackjack-mult').textContent).toContain('2.00');
    expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute('data-has-hands', 'true');
  });

  it('win settle wires reveal-in + number-pop + cashout-flash; lose is calm reveal-in only', async () => {
    const handle = createRef<CasinoStageHandle>();
    const { rerender } = wrap(
      <BlackjackStage
        ref={handle}
        actions={[{ seat: 0, move: 'stand' }]}
        onActionsChange={vi.fn()}
      />,
    );

    await act(async () => {
      const p = handle.current?.playOutcome(WIN_WITH_HANDS);
      await vi.runAllTimersAsync();
      await p;
    });
    expect(screen.getByTestId('casino-blackjack-mult')).toHaveClass('ds-casino-reveal-in');
    expect(screen.getByTestId('casino-blackjack-mult')).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-blackjack-win-flash')).toBeInTheDocument();

    await act(async () => {
      handle.current?.reset();
    });
    rerender(
      <I18nProvider>
        <BlackjackStage
          ref={handle}
          actions={[{ seat: 0, move: 'stand' }]}
          onActionsChange={vi.fn()}
        />
      </I18nProvider>,
    );

    await act(async () => {
      const p = handle.current?.playOutcome(LOSE_WITH_HANDS);
      await vi.runAllTimersAsync();
      await p;
    });
    expect(screen.getByTestId('casino-blackjack-mult')).toHaveClass('ds-casino-reveal-in');
    expect(screen.getByTestId('casino-blackjack-mult')).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-blackjack-win-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute('data-won', 'false');
  });

  it('reduced-motion skips flip/reveal motion classes', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <BlackjackStage
        ref={handle}
        actions={[{ seat: 0, move: 'stand' }]}
        onActionsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_WITH_HANDS);
    });
    expect(screen.getByTestId('casino-blackjack-mult')).not.toHaveClass('ds-casino-reveal-in');
    expect(screen.queryByTestId('casino-blackjack-win-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('casino-blackjack-dealer-upcard')).not.toHaveClass(
      'ds-casino-card-flip',
    );
  });

  it('live mid-round hands update felt without inventing ranks', () => {
    const { rerender } = wrap(
      <BlackjackStage
        actions={[]}
        liveMode
        liveSessionActive
        livePlayerCards={[1, 12]}
        liveDealerCards={[26]}
        livePlayerValue={21}
        onLiveMove={vi.fn()}
      />,
    );
    expect(screen.getByTestId('casino-blackjack-player-card-0')).toHaveAttribute(
      'data-card-id',
      '1',
    );
    expect(screen.getByTestId('casino-blackjack-dealer-upcard')).toHaveAttribute(
      'data-card-id',
      '26',
    );
    expect(screen.getByTestId('casino-blackjack-live-hit')).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <BlackjackStage
          actions={[]}
          liveMode
          liveSessionActive
          livePlayerCards={[1, 12, 5]}
          liveDealerCards={[26]}
          livePlayerValue={16}
          onLiveMove={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-blackjack-player-card-2')).toHaveAttribute(
      'data-card-id',
      '5',
    );
  });

  it('action bar queues hit/stand when not live-locked', () => {
    const onActionsChange = vi.fn();
    wrap(
      <BlackjackStage actions={[{ seat: 0, move: 'stand' }]} onActionsChange={onActionsChange} />,
    );
    fireEvent.click(screen.getByTestId('casino-blackjack-action-hit'));
    expect(onActionsChange).toHaveBeenCalledWith([
      { seat: 0, move: 'stand' },
      { seat: 0, move: 'hit' },
    ]);
  });

  it('ignores malformed playOutcome (no invented settle)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <BlackjackStage
        ref={handle}
        actions={[{ seat: 0, move: 'stand' }]}
        onActionsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome({ player: [1], dealer: 'bad' });
    });
    expect(screen.getByTestId('casino-blackjack-stage')).toHaveAttribute(
      'data-stage-phase',
      'idle',
    );
  });

  it('unmount clears reveal timer (no setState-after-unmount)', async () => {
    const handle = createRef<CasinoStageHandle>();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = wrap(
      <BlackjackStage
        ref={handle}
        actions={[{ seat: 0, move: 'stand' }]}
        onActionsChange={vi.fn()}
      />,
    );
    await act(async () => {
      void handle.current?.playOutcome(WIN_WITH_HANDS);
    });
    unmount();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const leaked = errorSpy.mock.calls.some(
      (c) => String(c[0]).includes('unmounted') || String(c[0]).includes('not wrapped'),
    );
    expect(leaked).toBe(false);
    errorSpy.mockRestore();
  });

  it('source ratchet — deal step + card-flip + cleanup + no UP/? placeholders', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/blackjack-stage.tsx');
    expect(src).toMatch(/blackjackDealStepMs/);
    expect(src).toMatch(/ds-casino-card-flip/);
    expect(src).toMatch(/ds-casino-reveal-in/);
    expect(src).toMatch(/ds-casino-number-pop/);
    expect(src).toMatch(/ds-casino-cashout-flash/);
    expect(src).toMatch(/useEffect\(\(\) => clearTimer/);
    expect(src).toMatch(/decodeBlackjackCard/);
    expect(src).not.toMatch(/>\s*UP\s*</);
    expect(src).not.toMatch(/\{dealerRevealed \? \(outcome \? 'UP'/);
  });
});
