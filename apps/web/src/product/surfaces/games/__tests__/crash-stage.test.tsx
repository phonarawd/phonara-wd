/**
 * Crash — Phase 1B functional QA + quantified motion polish (phase1b-crash).
 * Covers what casino-games-batch-a-stages.test.tsx does not: live mid-flight
 * cash-out gating (dead-control fix) and the win-only flash/number-pop reveal.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { CrashStage } from '@/product/surfaces/games/crash-stage';
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

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  usePrefersReducedMotion.mockReturnValue(false);
});

describe('CrashStage live mid-flight cash-out — dead-control fix (phase1b-crash)', () => {
  it('hides the cash-out control when the round is flying but the user has no active bet', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive={false}
        liveRoundStatus="flying"
        liveMultiplier="1.80"
        onLiveCashout={() => undefined}
      />,
    );
    expect(screen.queryByTestId('casino-crash-live-cashout')).not.toBeInTheDocument();
  });

  it('shows the cash-out control only while flying AND the user has an active bet', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive
        liveRoundStatus="flying"
        liveMultiplier="1.42"
        onLiveCashout={() => undefined}
      />,
    );
    expect(screen.getByTestId('casino-crash-live-cashout')).toBeInTheDocument();
  });

  it('hides the cash-out control once the round is no longer flying, even with an active bet', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive
        liveRoundStatus="betting"
        onLiveCashout={() => undefined}
      />,
    );
    expect(screen.queryByTestId('casino-crash-live-cashout')).not.toBeInTheDocument();
  });

  it('clicking cash-out invokes the callback — control responds, not a silent no-op', () => {
    const onLiveCashout = vi.fn();
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive
        liveRoundStatus="flying"
        liveMultiplier="1.42"
        onLiveCashout={onLiveCashout}
      />,
    );
    fireEvent.click(screen.getByTestId('casino-crash-live-cashout'));
    expect(onLiveCashout).toHaveBeenCalledTimes(1);
  });

  it('disables (but keeps visible) the cash-out control while a cash-out request is in flight', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive
        liveRoundStatus="flying"
        liveMultiplier="1.42"
        liveCashoutBusy
        onLiveCashout={() => undefined}
      />,
    );
    expect(screen.getByTestId('casino-crash-live-cashout')).toBeDisabled();
  });
});

describe('CrashStage live cash-out flash + number pop (phase1b-crash)', () => {
  it('freezes on the RPC-confirmed cash-out multiplier (not the still-climbing round multiplier), success-tinted, with a confirmation label', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive={false}
        liveRoundStatus="flying"
        liveMultiplier="4.50"
        liveCashoutFlash={{ id: 'bet-1', multiplier: '2.50' }}
        onLiveCashout={() => undefined}
      />,
    );
    const multiplierEl = screen.getByTestId('casino-crash-multiplier');
    expect(multiplierEl).toHaveTextContent('2.50×');
    expect(multiplierEl).toHaveClass('text-success');
    expect(multiplierEl).toHaveClass('ds-casino-number-pop');
    expect(screen.getByTestId('casino-crash-cashout-flash')).toBeInTheDocument();
    expect(screen.getByTestId('casino-crash-live-cashout-label')).toHaveTextContent('2.50×');
    expect(screen.getByTestId('casino-crash-stage')).toHaveAttribute('data-cashed-out', 'true');
  });

  it('does not re-trigger the flash for the same bet id on an unrelated re-render', () => {
    const props = {
      autoCashout: '2.00',
      liveMode: true,
      liveSessionActive: false,
      liveRoundStatus: 'crashed',
      liveCashoutFlash: { id: 'bet-1', multiplier: '2.50' },
      onLiveCashout: () => undefined,
    };
    const { rerender } = render(
      <I18nProvider>
        <CrashStage {...props} />
      </I18nProvider>,
    );
    const before = screen.getByTestId('casino-crash-cashout-flash');

    rerender(
      <I18nProvider>
        <CrashStage {...props} />
      </I18nProvider>,
    );
    const after = screen.getByTestId('casino-crash-cashout-flash');
    expect(after).toBe(before); // same DOM node — no remount, no replay
  });

  it('a new bet id (fresh cash-out) retriggers the flash with a fresh element', () => {
    const { rerender } = render(
      <I18nProvider>
        <CrashStage
          autoCashout="2.00"
          liveMode
          liveSessionActive={false}
          liveCashoutFlash={{ id: 'bet-1', multiplier: '2.50' }}
          onLiveCashout={() => undefined}
        />
      </I18nProvider>,
    );
    const before = screen.getByTestId('casino-crash-cashout-flash');

    rerender(
      <I18nProvider>
        <CrashStage
          autoCashout="2.00"
          liveMode
          liveSessionActive={false}
          liveCashoutFlash={{ id: 'bet-2', multiplier: '3.10' }}
          onLiveCashout={() => undefined}
        />
      </I18nProvider>,
    );
    const after = screen.getByTestId('casino-crash-cashout-flash');
    expect(after).not.toBe(before);
    expect(screen.getByTestId('casino-crash-multiplier')).toHaveTextContent('3.10×');
  });

  it('falls back to the live ticking multiplier once a new bet starts (liveSessionActive true again)', () => {
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive
        liveRoundStatus="flying"
        liveMultiplier="1.10"
        liveCashoutFlash={{ id: 'bet-1', multiplier: '2.50' }}
        onLiveCashout={() => undefined}
      />,
    );
    // Stale flash from a previous round must not shadow the new live bet's ticker.
    expect(screen.getByTestId('casino-crash-multiplier')).toHaveTextContent('1.10×');
    expect(screen.queryByTestId('casino-crash-live-cashout-label')).not.toBeInTheDocument();
  });

  it('reduced motion still shows the correct frozen value + label, but skips the pop/flash classes', () => {
    usePrefersReducedMotion.mockReturnValue(true);
    wrap(
      <CrashStage
        autoCashout="2.00"
        liveMode
        liveSessionActive={false}
        liveCashoutFlash={{ id: 'bet-1', multiplier: '2.50' }}
        onLiveCashout={() => undefined}
      />,
    );
    const multiplierEl = screen.getByTestId('casino-crash-multiplier');
    expect(multiplierEl).toHaveTextContent('2.50×');
    expect(multiplierEl).toHaveClass('text-success');
    expect(screen.getByTestId('casino-crash-live-cashout-label')).toBeInTheDocument();
    expect(multiplierEl).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-crash-cashout-flash')).not.toBeInTheDocument();
  });
});

describe('CrashStage oneshot settle — reduced-motion gate + outcome truth (phase1b-crash)', () => {
  // Real-duration replay drives requestAnimationFrame end-to-end (1.5-4s) — this
  // jsdom unit environment does not fire rAF reliably (confirmed: hangs to the
  // vitest timeout), which is exactly why the existing repo convention
  // (casino-games-batch-a-stages.test.tsx) always exercises playOutcome under
  // reduced-motion (the duration===0 instant branch), never the animated one.
  // The flash/pop rendering itself (classes, dedup-by-id, reduced-motion
  // suppression) is fully covered above via the live cash-out path, which drives
  // the identical flashPulse mechanism from a plain prop effect with no rAF.
  it('a cashed-out win settles correctly but never pops/flashes under reduced motion', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<CrashStage ref={handle} autoCashout="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({
        crashMultiplier: 5,
        cashedOut: true,
        cashoutMultiplier: 2,
      });
    });
    expect(screen.getByTestId('casino-crash-stage')).toHaveAttribute('data-cashed-out', 'true');
    expect(screen.getByTestId('casino-crash-outcome-label')).toHaveTextContent('2.00×');
    expect(screen.getByTestId('casino-crash-multiplier')).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-crash-cashout-flash')).not.toBeInTheDocument();
  });

  it('a crash loss settles calmly — danger tone, no flash (CASINO_UX_CANON: lose is respectful)', async () => {
    usePrefersReducedMotion.mockReturnValue(true);
    const handle = createRef<CasinoStageHandle>();
    wrap(<CrashStage ref={handle} autoCashout="2.00" />);
    await act(async () => {
      await handle.current?.playOutcome({
        crashMultiplier: 3,
        cashedOut: false,
        cashoutMultiplier: 0,
      });
    });
    expect(screen.getByTestId('casino-crash-stage')).toHaveAttribute('data-cashed-out', 'false');
    expect(screen.getByTestId('casino-crash-outcome-label')).toHaveTextContent('3.00×');
    expect(screen.getByTestId('casino-crash-multiplier')).not.toHaveClass('ds-casino-number-pop');
    expect(screen.queryByTestId('casino-crash-cashout-flash')).not.toBeInTheDocument();
  });
});
