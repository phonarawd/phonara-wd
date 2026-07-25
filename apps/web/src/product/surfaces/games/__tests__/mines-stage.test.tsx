/**
 * Mines — Phase 1C functional QA + quantified motion polish + perf check (phase1c-mines).
 * Covers what casino-games-batch-b-stages.test.tsx does not: the live/progressive
 * mine-hit reveal-order race (a mid-round `playOutcome` call landing in the same
 * tick as the prop update that would otherwise carry the newly-revealed cell —
 * see `ParsedMinesOutcome.revealedCells` doc), the live-mode "confirmed safe"
 * tile visual (previously indistinguishable from a mere pre-bet pick), the new
 * per-tile `ds-casino-tile-reveal` micro-feedback token, the multiplier-ladder
 * reveal/pop motion, and the cascade timer leak on unmount. Mirrors
 * limbo-stage.test.tsx / dice-stage.test.tsx's functional-QA/motion-polish/
 * perf-check structure for its sibling grid/reveal game. Mines' cascade is a
 * recursive real `setTimeout` chain (not rAF), so — like limbo-stage.test.tsx —
 * animated-path tests just `await` the real (short, <=160ms/tile) delay rather
 * than needing a rAF stub (cf. crash-stage.test.tsx / dice-stage.test.tsx).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { MinesStage } from '@/product/surfaces/games/mines-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function cellVisual(index: number): string | null {
  return screen.getByTestId(`casino-mines-cell-${index}`).getAttribute('data-cell-visual');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MinesStage functional QA — grid reveal, live cash-out, mine hit (phase1c-mines)', () => {
  it('renders an idle 25-cell grid with no picks and the 1.00x baseline multiplier', () => {
    wrap(<MinesStage mineCount={3} revealedCells={[]} />);
    expect(screen.getByTestId('casino-mines-grid')).toBeInTheDocument();
    expect(screen.getByTestId('casino-mines-cashout-mult')).toHaveTextContent('1.00×');
    expect(screen.getByTestId('casino-mines-picked-count')).toHaveTextContent('0/22');
    expect(cellVisual(0)).toBe('idle');
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.queryByTestId('casino-mines-live-cashout')).not.toBeInTheDocument();
  });

  it('grid reveal — picking and deselecting a pre-bet tile responds immediately (not a dead control)', () => {
    const onRevealedCellsChange = vi.fn();
    const { rerender } = wrap(
      <MinesStage mineCount={3} revealedCells={[]} onRevealedCellsChange={onRevealedCellsChange} />,
    );
    fireEvent.click(screen.getByTestId('casino-mines-cell-4'));
    expect(onRevealedCellsChange).toHaveBeenCalledWith([4]);

    // Deselect — same control, opposite direction, still responds. The parent
    // owns `revealedCells` (it is a prop, not stage-local state), so the test
    // re-renders with the "picked" value the callback above would have driven.
    onRevealedCellsChange.mockClear();
    rerender(
      <I18nProvider>
        <MinesStage
          mineCount={3}
          revealedCells={[4]}
          onRevealedCellsChange={onRevealedCellsChange}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('casino-mines-cell-4'));
    expect(onRevealedCellsChange).toHaveBeenCalledWith([]);
  });

  it('grid reveal — a decisive oneshot win cascades every picked cell to the safe checkmark and settles won=true', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 6, 12]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [9, 14, 20], hitMine: false });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-hit-mine', 'false');
    expect(cellVisual(0)).toBe('safe');
    expect(cellVisual(6)).toBe('safe');
    expect(cellVisual(12)).toBe('safe');
    // Any settle (win or lose) discloses the remaining mine positions dimly —
    // existing, intentional post-round transparency, distinct from the bold
    // "you hit this one" state a real hit gets (see the mine-hit test below).
    expect(cellVisual(9)).toBe('hidden-mine');
  });

  it('mine hit — the exact hit tile renders the bold "mine" state (not the dim disclosed-mine state)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 6]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [6, 0, 4], hitMine: true });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-hit-mine', 'true');
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'false');
    // Both revealed cells were mines here — the picked-order fallback (oneshot,
    // no live race) still resolves every one of them to the bold 'mine' state.
    expect(cellVisual(0)).toBe('mine');
    expect(cellVisual(6)).toBe('mine');
    // Disclosed-but-never-picked mine — dim "for context" state, distinct from
    // a tile the player actually hit.
    expect(cellVisual(4)).toBe('hidden-mine');
  });

  it('live mode — a mid-round safe reveal shows the tile as server-confirmed safe (checkmark), not a bare pre-bet pick', () => {
    wrap(
      <MinesStage
        mineCount={3}
        revealedCells={[2]}
        liveMode
        liveSessionActive
        onLiveRevealCell={vi.fn()}
        onLiveCashout={vi.fn()}
      />,
    );
    expect(cellVisual(2)).toBe('safe');
    expect(screen.getByTestId('casino-mines-cell-2')).toHaveTextContent('✓');
  });

  it('live mode without an active session still shows a carried-over pick as a plain "picked" chip, not a false "safe" claim', () => {
    wrap(<MinesStage mineCount={3} revealedCells={[2]} liveMode liveSessionActive={false} />);
    expect(cellVisual(2)).toBe('picked');
  });

  it('live mine hit — playOutcome uses the RPC-echoed revealedCells (not the one-tick-stale picked prop), so the busted tile itself renders as "mine"', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    // Stage's own `revealedCells` prop is still [2] — the parent has not yet
    // committed the setSelection() call it fires in the same synchronous tick
    // as this playOutcome() (see CasinoGameShell.handleLiveRevealCell). Without
    // the Phase 1C fix, `order` would fall back to picked=[2] and cell 9 (the
    // cell that was actually clicked and hit the mine) would never enter
    // revealedOrder — it would render as the dim 'hidden-mine' state instead
    // of the bold "you hit this" 'mine' state.
    wrap(
      <MinesStage
        ref={handle}
        mineCount={3}
        revealedCells={[2]}
        liveMode
        liveSessionActive
        onLiveCashout={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome({
        minePositions: [9, 14],
        hitMine: true,
        revealedCells: [2, 9],
      });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-hit-mine', 'true');
    expect(cellVisual(9)).toBe('mine');
    expect(cellVisual(2)).toBe('safe');
    expect(cellVisual(14)).toBe('hidden-mine');
    // Whether the cash-out control itself survives a busted session is owned
    // by the parent (CasinoGameShell derives liveSessionActive from real
    // progressiveSession state, which this isolated stage test does not wire)
    // — verified end-to-end in casino-game-shell.test.tsx instead.
  });

  it('live cash-out — the control is visible once a session is active, disabled with 0 picks, and enabled after a reveal', () => {
    const onLiveCashout = vi.fn();
    const { rerender } = wrap(
      <MinesStage
        mineCount={3}
        revealedCells={[]}
        liveMode
        liveSessionActive
        onLiveCashout={onLiveCashout}
      />,
    );
    expect(screen.getByTestId('casino-mines-live-cashout')).toBeDisabled();

    rerender(
      <I18nProvider>
        <MinesStage
          mineCount={3}
          revealedCells={[2]}
          liveMode
          liveSessionActive
          onLiveCashout={onLiveCashout}
        />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-mines-live-cashout')).toBeEnabled();
    fireEvent.click(screen.getByTestId('casino-mines-live-cashout'));
    expect(onLiveCashout).toHaveBeenCalledTimes(1);
  });

  it('live cash-out settle reuses the already-known revealedCells (no fresh click needed) and reads as a clean win', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <MinesStage
        ref={handle}
        mineCount={3}
        revealedCells={[2, 5]}
        liveMode
        liveSessionActive
        onLiveCashout={vi.fn()}
      />,
    );
    await act(async () => {
      // Cashout RPC shape (rpc_progressive_cashout) — minePositions disclosed,
      // hitMine stays false, revealedCells unchanged from the last safe step.
      await handle.current?.playOutcome({
        minePositions: [9],
        hitMine: false,
        revealedCells: [2, 5],
      });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-won', 'true');
    expect(cellVisual(2)).toBe('safe');
    expect(cellVisual(5)).toBe('safe');
  });

  it('a malformed RPC result (missing minePositions) is ignored — no crash, no phase change, control stays responsive', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0]} />);
    await act(async () => {
      await handle.current?.playOutcome({ hitMine: true });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-mines-stage')).not.toHaveAttribute('data-hit-mine');
  });

  it('reset() clears the settled outcome back to idle for the next round', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [9], hitMine: false });
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-stage-phase', 'settled');
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-mines-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-mines-stage')).not.toHaveAttribute('data-hit-mine');
    expect(cellVisual(0)).toBe('picked');
  });
});

describe('MinesStage quantified motion polish — tile-flip + ladder + win-only pop (phase1c-mines)', () => {
  it('a freshly revealed tile gets the tile-flip class; a tile that stays idle never does', () => {
    const { rerender } = wrap(<MinesStage mineCount={3} revealedCells={[]} />);
    expect(screen.getByTestId('casino-mines-cell-3')).not.toHaveClass('ds-casino-tile-reveal');

    rerender(
      <I18nProvider>
        <MinesStage mineCount={3} revealedCells={[3]} />
      </I18nProvider>,
    );
    expect(screen.getByTestId('casino-mines-cell-3')).toHaveClass('ds-casino-tile-reveal');
    expect(screen.getByTestId('casino-mines-cell-4')).not.toHaveClass('ds-casino-tile-reveal');
  });

  it('reduced motion skips the tile-flip class entirely even on a fresh pick', () => {
    usePrefersReducedMotion.mockReturnValue(true);
    wrap(<MinesStage mineCount={3} revealedCells={[3]} />);
    expect(screen.getByTestId('casino-mines-cell-3')).not.toHaveClass('ds-casino-tile-reveal');
  });

  it('the multiplier ladder remounts with the reveal-in class each time a new tile is picked', () => {
    const { rerender } = wrap(<MinesStage mineCount={3} revealedCells={[]} />);
    const firstMult = screen.getByTestId('casino-mines-cashout-mult');
    expect(firstMult).toHaveClass('ds-casino-reveal-in');

    rerender(
      <I18nProvider>
        <MinesStage mineCount={3} revealedCells={[0]} />
      </I18nProvider>,
    );
    const secondMult = screen.getByTestId('casino-mines-cashout-mult');
    expect(secondMult).not.toBe(firstMult);
    expect(secondMult).toHaveClass('ds-casino-reveal-in');
    // minesMultiplier(mineCount=3, revealCount=1) = floor((25/22)*99)/100 = 1.12.
    expect(secondMult).toHaveTextContent('1.12×');
  });

  it('a winning settle adds the number-pop and glow flash on top of the ladder reveal', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 1]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [9, 14], hitMine: false });
    });
    const mult = screen.getByTestId('casino-mines-cashout-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).toHaveClass('ds-casino-number-pop');
    expect(mult).toHaveClass('text-success');
    expect(screen.getByTestId('casino-mines-win-flash')).toBeInTheDocument();
  });

  it('a mine-hit settle stays calm — reveal-in only, no pop, no glow (CASINO_UX_CANON: lose is respectful)', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [0, 9], hitMine: true });
    });
    const mult = screen.getByTestId('casino-mines-cashout-mult');
    expect(mult).toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(mult).toHaveClass('text-danger');
    expect(screen.queryByTestId('casino-mines-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion collapses a win settle to instant — no reveal-in, no pop, no glow, correct value', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 1]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [9, 14], hitMine: false });
    });
    const mult = screen.getByTestId('casino-mines-cashout-mult');
    // minesMultiplier(mineCount=3, revealCount=2) = floor((100/77)*99)/100 = 1.28.
    expect(mult).toHaveTextContent('1.28×');
    expect(mult).not.toHaveClass('ds-casino-reveal-in');
    expect(mult).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-mines-win-flash')).not.toBeInTheDocument();
    for (const idx of [0, 1]) {
      expect(screen.getByTestId(`casino-mines-cell-${idx}`)).not.toHaveClass(
        'ds-casino-tile-reveal',
      );
    }
  });
});

describe('MinesStage perf check (phase1c-mines)', () => {
  it('starting a new cascade clears the previous cascade tick timer instead of leaking it', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 1]} />);

    act(() => {
      void handle.current?.playOutcome({ minePositions: [9, 14], hitMine: false });
    });
    clearSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome({ minePositions: [10, 15], hitMine: false });
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('unmounting mid-cascade clears the pending recursive timer instead of leaking it', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0, 1, 2]} />);

    act(() => {
      void handle.current?.playOutcome({ minePositions: [9, 14, 20], hitMine: false });
    });
    clearSpy.mockClear();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('a live mine-hit immediately followed by unmount produces no console errors or warnings from a leaked cascade tick', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(
      <MinesStage
        ref={handle}
        mineCount={3}
        revealedCells={[2]}
        liveMode
        liveSessionActive
        onLiveCashout={vi.fn()}
      />,
    );

    act(() => {
      void handle.current?.playOutcome({
        minePositions: [9, 14],
        hitMine: true,
        revealedCells: [2, 9],
      });
    });
    unmount();

    // If the cascade's recursive setTimeout chain were not cancelled on
    // unmount, the still-pending ticks would fire during this real wait and
    // call setState on the now-unmounted component — React logs that as a
    // console.error. Waiting past the full cascade duration (2 cells * 160ms
    // ceiling) proves the leak is actually closed, not just that the spy was
    // called once at unmount time.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('drives every reveal/pop/glow/tile-flip effect through CSS classes only — no inline style', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<MinesStage ref={handle} mineCount={3} revealedCells={[0]} />);
    await act(async () => {
      await handle.current?.playOutcome({ minePositions: [9], hitMine: false });
    });
    expect(screen.getByTestId('casino-mines-cashout-mult')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-mines-win-flash')).not.toHaveAttribute('style');
    expect(screen.getByTestId('casino-mines-cell-0')).not.toHaveAttribute('style');
  });
});
