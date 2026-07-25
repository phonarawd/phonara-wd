/**
 * Roulette — Phase 1E functional QA + quantified motion polish + wheel rAF perf
 * (phase1e-roulette / resume-phase1e-roulette).
 *
 * Covers what casino-games-batch-d-stages.test.tsx does not: chip placement
 * across bet types, wheel/ball spin settle, win vs lose motion tokens, chip-drop
 * class, unmount cleanup for the spin rAF, and reduced-motion collapse.
 * Mirrors deepshaft-stage.test.tsx for the sibling Batch D table stage.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CASINO_ROULETTE_OUTSIDE_TYPES } from '@/domain/casino-games-batch-d-display-contract';
import { I18nProvider } from '@/product/i18n';
import { RouletteStage } from '@/product/surfaces/games/roulette-stage';
import type { CasinoStageHandle } from '@/product/surfaces/games/casino-stage-types';

const { usePrefersReducedMotion } = vi.hoisted(() => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion,
}));

const WIN_OUTCOME = { winningNumber: 17, totalMultiplier: 2 };
const LOSE_OUTCOME = { winningNumber: 0, totalMultiplier: 0 };

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function readRepo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);

  // jsdom rAF does not drain an 1100ms spin; advance performance.now per frame.
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    now += 100;
    return setTimeout(() => cb(now), 0) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RouletteStage functional QA — chips, bet types, spin settle (phase1e-roulette)', () => {
  it('shows chip rack, wheel, table, and empty-bets copy before any placement', () => {
    wrap(<RouletteStage bets={[]} onBetsChange={vi.fn()} />);
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-roulette-wheel')).toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-chip-rack')).toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-table')).toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-total-weight')).toHaveTextContent('0');
    expect(screen.queryByTestId('casino-roulette-winning-number')).not.toBeInTheDocument();
    expect(screen.queryByTestId('casino-roulette-live-spin')).not.toBeInTheDocument();
  });

  it('places a straight chip and reports the upsert via onBetsChange', () => {
    const onBetsChange = vi.fn();
    wrap(<RouletteStage bets={[]} onBetsChange={onBetsChange} />);
    fireEvent.click(screen.getByTestId('casino-roulette-chip-5'));
    fireEvent.click(screen.getByTestId('casino-roulette-pocket-17'));
    expect(onBetsChange).toHaveBeenCalledWith([{ type: 'straight', value: 17, stakeWeight: 5 }]);
  });

  it('places every outside bet type from the rack', () => {
    const onBetsChange = vi.fn();
    wrap(<RouletteStage bets={[]} onBetsChange={onBetsChange} />);
    for (const type of CASINO_ROULETTE_OUTSIDE_TYPES) {
      onBetsChange.mockClear();
      fireEvent.click(screen.getByTestId(`casino-roulette-outside-${type}`));
      expect(onBetsChange).toHaveBeenCalledWith([{ type, value: null, stakeWeight: 1 }]);
    }
  });

  it('completes a consecutive split via two-tap mode', () => {
    const onBetsChange = vi.fn();
    wrap(<RouletteStage bets={[]} onBetsChange={onBetsChange} />);
    fireEvent.click(screen.getByTestId('casino-roulette-mode-split'));
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-bet-mode', 'split');
    fireEvent.click(screen.getByTestId('casino-roulette-pocket-16'));
    expect(screen.getByTestId('casino-roulette-split-hint')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('casino-roulette-pocket-17'));
    expect(onBetsChange).toHaveBeenCalledWith([{ type: 'split', value: 16, stakeWeight: 1 }]);
  });

  it('a decisive win settles winning number and multiplier from the RPC result', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-won', 'true');
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute(
      'data-stage-phase',
      'settled',
    );
    expect(screen.getByTestId('casino-roulette-winning-number')).toHaveTextContent('17');
    expect(screen.getByTestId('casino-roulette-mult')).toHaveTextContent('2.00×');
    expect(screen.getByTestId('casino-roulette-wheel-center')).toHaveTextContent('17');
  });

  it('a zero-multiplier settle is a calm loss — no live cash-out mid-round', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-won', 'false');
    expect(screen.getByTestId('casino-roulette-mult')).toHaveTextContent('0.00×');
    expect(screen.queryByTestId('casino-roulette-cashout')).not.toBeInTheDocument();
  });

  it('ignores a malformed RPC result instead of corrupting idle state', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(<RouletteStage ref={handle} bets={[]} onBetsChange={vi.fn()} />);
    await act(async () => {
      await handle.current?.playOutcome({ winningNumber: 99, totalMultiplier: 1 });
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.getByTestId('casino-roulette-stage')).not.toHaveAttribute('data-won');
  });

  it('reset() clears a settled round back to idle for the next bet', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'black', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    act(() => {
      handle.current?.reset();
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-stage-phase', 'idle');
    expect(screen.queryByTestId('casino-roulette-winning-number')).not.toBeInTheDocument();
  });

  it('wheel spin enters replaying before settle', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute(
      'data-stage-phase',
      'replaying',
    );
    await waitFor(() => {
      expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute(
        'data-stage-phase',
        'settled',
      );
    });
  });

  it('repeat last restores the previous bet map after a settled spin', async () => {
    const onBetsChange = vi.fn();
    const handle = createRef<CasinoStageHandle>();
    const bets = [{ type: 'straight' as const, value: 7, stakeWeight: 1 }];
    const { rerender } = wrap(
      <RouletteStage ref={handle} bets={bets} onBetsChange={onBetsChange} />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    // Clear board (parent would pass [] — simulate). Keep I18nProvider.
    rerender(
      <I18nProvider>
        <RouletteStage ref={handle} bets={[]} onBetsChange={onBetsChange} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByTestId('casino-roulette-repeat'));
    expect(onBetsChange).toHaveBeenCalledWith([{ type: 'straight', value: 7, stakeWeight: 1 }]);
  });
});

describe('RouletteStage quantified motion polish — punchy win / calm lose (phase1e-roulette)', () => {
  it('a win gets reveal-in, number-pop, and cashout-flash together', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const num = screen.getByTestId('casino-roulette-winning-number');
    expect(num).toHaveClass('ds-casino-reveal-in');
    expect(num).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-roulette-win-flash')).toBeInTheDocument();
    expect(screen.getByTestId('casino-roulette-mult')).toHaveClass('ds-casino-number-pop');
  });

  it('a loss gets only calm reveal-in — no pop, no glow', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    const num = screen.getByTestId('casino-roulette-winning-number');
    expect(num).toHaveClass('ds-casino-reveal-in');
    expect(num).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-roulette-win-flash')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct win but skips every animation class', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute('data-won', 'true');
    const num = screen.getByTestId('casino-roulette-winning-number');
    expect(num).toHaveTextContent('17');
    expect(num).not.toHaveClass('ds-casino-reveal-in');
    expect(num).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-roulette-win-flash')).not.toBeInTheDocument();
  });

  it('chip placement applies the chip-drop micro-motion class', () => {
    wrap(<RouletteStage bets={[]} onBetsChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('casino-roulette-pocket-17'));
    expect(screen.getByTestId('casino-roulette-pocket-17')).toHaveClass('ds-casino-chip-drop');
  });

  it('a second consecutive win remounts pop/glow elements fresh', async () => {
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );
    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    const firstNum = screen.getByTestId('casino-roulette-winning-number');
    const firstFlash = screen.getByTestId('casino-roulette-win-flash');

    await act(async () => {
      await handle.current?.playOutcome({ winningNumber: 7, totalMultiplier: 4.5 });
    });
    const secondNum = screen.getByTestId('casino-roulette-winning-number');
    const secondFlash = screen.getByTestId('casino-roulette-win-flash');

    expect(secondNum).not.toBe(firstNum);
    expect(secondFlash).not.toBe(firstFlash);
    expect(secondNum).toHaveTextContent('7');
  });
});

describe('RouletteStage perf check — wheel rAF leak + transform contract (phase1e-roulette)', () => {
  it('exposes the transform-opacity-only perf contract on the stage root', () => {
    wrap(<RouletteStage bets={[]} onBetsChange={vi.fn()} />);
    expect(screen.getByTestId('casino-roulette-stage')).toHaveAttribute(
      'data-perf-contract',
      'transform-opacity-only',
    );
  });

  it('a rapid second playOutcome cancels the previous pending spin rAF', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    act(() => {
      void handle.current?.playOutcome(LOSE_OUTCOME);
    });
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmounting mid-spin clears the pending rAF (no leaked frames past navigation)', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    cancelSpy.mockClear();

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('unmount mid-spin produces no console errors or warnings from a leaked tick setState', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    const { unmount } = wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );

    act(() => {
      void handle.current?.playOutcome(WIN_OUTCOME);
    });
    unmount();

    // rouletteSpinMs = 1100; mocked rAF steps 100ms — wait past a full spin.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('source ratchet: wheel disc/ball use transform; spin uses rAF + ease (no layout props)', () => {
    const src = readRepo('apps/web/src/product/surfaces/games/roulette-stage.tsx');
    expect(src).toContain('transform: `rotate(${wheelDeg}deg)`');
    expect(src).toContain('transform: `rotate(${ballDeg}deg)`');
    expect(src).toContain('requestAnimationFrame(tick)');
    expect(src).toContain('rouletteSpinEase');
    expect(src).toContain('useEffect(() => clearRaf, [clearRaf])');
    expect(src).not.toContain('style={{ width:');
    expect(src).not.toContain('style={{ height:');
  });

  it('renders no console errors across consecutive settled rounds (win, lose, win)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = createRef<CasinoStageHandle>();
    wrap(
      <RouletteStage
        ref={handle}
        bets={[{ type: 'red', value: null, stakeWeight: 1 }]}
        onBetsChange={vi.fn()}
      />,
    );

    await act(async () => {
      await handle.current?.playOutcome(WIN_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome(LOSE_OUTCOME);
    });
    await act(async () => {
      await handle.current?.playOutcome({ winningNumber: 32, totalMultiplier: 3.1 });
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
