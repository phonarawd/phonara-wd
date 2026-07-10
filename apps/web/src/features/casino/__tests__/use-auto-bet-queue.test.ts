import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  canStartAutoBet,
  createAutoBetSession,
  markAutoBetStopRequested,
  stepAutoBetSession,
  useAutoBetQueue,
  type AutoBetConfig,
} from '../use-auto-bet-queue';

const baseConfig = (overrides: Partial<AutoBetConfig> = {}): AutoBetConfig => ({
  count: 2,
  stopOnProfit: '',
  stopOnLoss: '',
  onWinMode: 'reset',
  onLossMode: 'reset',
  onWinIncreasePercent: '0',
  onLossIncreasePercent: '0',
  baseStake: '10',
  ...overrides,
});

describe('stepAutoBetSession (pir-p0-autobet-session · pure reducer)', () => {
  it('count=2 stops after exactly 2 fires', () => {
    const session = createAutoBetSession(baseConfig({ count: 2 }));
    expect(session).not.toBeNull();
    if (!session) return;

    const first = stepAutoBetSession(session, { profitDelta: '1', won: true });
    expect(first.decision).toBe('continue');
    expect(first.state.firesPlaced).toBe(1);
    expect(first.state.remaining).toBe(1);
    expect(first.state.status).toBe('running');

    const second = stepAutoBetSession(first.state, { profitDelta: '-10', won: false });
    expect(second.decision).toBe('stop');
    expect(second.state.firesPlaced).toBe(2);
    expect(second.state.remaining).toBe(0);
    expect(second.state.status).toBe('idle');
  });

  it('accumulates stopOnLoss across fires (not single-fire only)', () => {
    const session = createAutoBetSession(
      baseConfig({ count: 0, stopOnLoss: '20', baseStake: '10' }),
    );
    expect(session).not.toBeNull();
    if (!session) return;

    const first = stepAutoBetSession(session, { profitDelta: '-12', won: false });
    expect(first.decision).toBe('continue');
    expect(first.state.cumulativeProfit).toBe('-12');

    const second = stepAutoBetSession(first.state, { profitDelta: '-10', won: false });
    expect(second.decision).toBe('stop');
    expect(second.state.cumulativeProfit).toBe('-22');
    expect(second.state.status).toBe('idle');
  });

  it('applies martingale increase on loss then resets on win', () => {
    const session = createAutoBetSession(
      baseConfig({
        count: 3,
        onLossMode: 'increase',
        onLossIncreasePercent: '100',
        onWinMode: 'reset',
      }),
    );
    expect(session).not.toBeNull();
    if (!session) return;

    const loss = stepAutoBetSession(session, { profitDelta: '-10', won: false });
    expect(loss.decision).toBe('continue');
    expect(loss.state.nextStake).toBe('20');

    const win = stepAutoBetSession(loss.state, { profitDelta: '20', won: true });
    expect(win.decision).toBe('continue');
    expect(win.state.nextStake).toBe('10');
  });

  it('honors stopRequested after the current fire', () => {
    const session = createAutoBetSession(baseConfig({ count: 10 }));
    expect(session).not.toBeNull();
    if (!session) return;

    const stopping = markAutoBetStopRequested(session);
    expect(stopping.status).toBe('stopping');

    const stepped = stepAutoBetSession(stopping, { profitDelta: '1', won: true });
    expect(stepped.decision).toBe('stop');
    expect(stepped.state.firesPlaced).toBe(1);
    expect(stepped.state.status).toBe('idle');
  });
});

describe('useAutoBetQueue (pir-p0-autobet-session)', () => {
  it('refuses start without count or stopOnLoss', () => {
    expect(canStartAutoBet(baseConfig({ count: 0, stopOnLoss: '' }))).toBe(false);
  });

  it('rejects double Start while session is active', () => {
    const { result } = renderHook(() => useAutoBetQueue('10'));

    act(() => {
      expect(result.current.start(baseConfig({ count: 5 }))).toBe(true);
    });
    expect(result.current.status).toBe('running');
    expect(result.current.sessionActive()).toBe(true);

    act(() => {
      expect(result.current.start(baseConfig({ count: 3 }))).toBe(false);
    });
    expect(result.current.remaining).toBe(5);
    expect(result.current.firesPlaced).toBe(0);
  });

  it('tracks remaining · profit · next stake from RPC display deltas only', () => {
    const { result } = renderHook(() => useAutoBetQueue('10'));

    act(() => {
      expect(
        result.current.start(
          baseConfig({
            count: 2,
            onWinMode: 'increase',
            onWinIncreasePercent: '50',
          }),
        ),
      ).toBe(true);
    });

    expect(result.current.status).toBe('running');
    expect(result.current.remaining).toBe(2);

    act(() => {
      expect(result.current.recordFire({ profitDelta: '5', won: true })).toBe('continue');
    });
    expect(result.current.firesPlaced).toBe(1);
    expect(result.current.remaining).toBe(1);
    expect(result.current.cumulativeProfit).toBe('5');
    expect(result.current.nextStake).toBe('15');

    act(() => {
      expect(result.current.recordFire({ profitDelta: '-10', won: false })).toBe('stop');
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.firesPlaced).toBe(2);
    expect(result.current.sessionActive()).toBe(false);
  });

  it('stops when cumulative stopOnLoss is reached via recordFire', () => {
    const { result } = renderHook(() => useAutoBetQueue('10'));

    act(() => {
      result.current.start(baseConfig({ count: 0, stopOnLoss: '20' }));
    });

    act(() => {
      expect(result.current.recordFire({ profitDelta: '-12', won: false })).toBe('continue');
    });
    act(() => {
      expect(result.current.recordFire({ profitDelta: '-10', won: false })).toBe('stop');
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.cumulativeProfit).toBe('-22');
  });

  it('allows Start again after reset clears sessionActiveRef', () => {
    const { result } = renderHook(() => useAutoBetQueue('10'));

    act(() => {
      expect(result.current.start(baseConfig({ count: 2 }))).toBe(true);
    });
    act(() => {
      result.current.reset('10');
    });
    act(() => {
      expect(result.current.start(baseConfig({ count: 1 }))).toBe(true);
    });
    expect(result.current.remaining).toBe(1);
  });
});
