/**
 * Momentum · outcome-leak (LAW 4 + timer teardown · 5 cases).
 *
 * Engine UI contract — roll-reveal ≤900ms on play path; cashOut reveals
 * immediately with totalMultiplier banner only. Pre-reveal DOM MUST
 * carry zero outcome tokens: no win/loss banner, no comboAfter delta,
 * no totalMultiplier, no final roll digits, no threshold pass/fail.
 *
 *   1. bet === null              → no banners, no roll digits.
 *   2. pending (commitment only) → quarantine identical to case 1.
 *   3. play loss → pre-reveal clean; advance past 900ms → bust banner.
 *   4. play win  → pre-reveal clean; advance → comboMultiplier visible;
 *                  totalMultiplier banner ABSENT.
 *   5. cashOut   → totalMultiplier banner present immediately; roll
 *                  digits absent (no play roll panel).
 *
 *   bonus: timer teardown — unmount + dep-change drop pending timers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { Stage } from "../Stage";
import type {
  MomentumResult,
  MomentumSurfaceProps,
} from "../types";
import type { UiBetView } from "@/games/shared/types";

type StageProps = Pick<
  MomentumSurfaceProps,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "busy"
  | "onClientSeedChange"
>;

function baseProps(over: Partial<StageProps> = {}): StageProps {
  return {
    gameCode: "momentum",
    selection: { comboBefore: 0, cashOut: false },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    busy: false,
    onClientSeedChange: () => {},
    ...over,
  };
}

function fakeBet(result: MomentumResult): UiBetView {
  return {
    status: result.won ? "won" : "lost",
    payout: "0",
    result: result as unknown as Record<string, unknown>,
  } as unknown as UiBetView;
}

function assertNoPlayBanners(root: HTMLElement) {
  expect(root.querySelector('[data-testid="momentum-banner-win"]')).toBeNull();
  expect(root.querySelector('[data-testid="momentum-banner-bust"]')).toBeNull();
  expect(root.querySelector('[data-testid="momentum-banner-cashout"]')).toBeNull();
  expect(root.querySelector('[data-testid="momentum-banner-cashout-total"]')).toBeNull();
  expect(root.querySelector('[data-testid="momentum-step-mult"]')).toBeNull();
}

describe("Momentum · outcome-leak (LAW 4 + timer)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("case 1 · bet=null → no outcome tokens, no roll digits", () => {
    const { container } = render(<Stage {...baseProps()} />);
    assertNoPlayBanners(container);
    expect(
      container.querySelector('[data-testid="momentum-roll-reveal"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-roll-digits"]'),
    ).toBeNull();
  });

  it("case 2 · pending (commitment only, bet=null) → quarantine identical to idle", () => {
    const { container } = render(
      <Stage
        {...baseProps({
          commitment: { round_id: "r1", server_seed_hash: "abc" },
        })}
      />,
    );
    assertNoPlayBanners(container);
    expect(
      container.querySelector('[data-testid="momentum-roll-reveal"]'),
    ).toBeNull();
  });

  it("case 3 · play loss → pre-reveal clean; after 900ms → bust banner appears, no win/cashout banners", () => {
    const bet = fakeBet({
      comboAfter: 0,
      comboMultiplier: "1.00",
      won: false,
      cashedOut: false,
      roll: 31.08,
    });
    const { container } = render(<Stage {...baseProps({ bet })} />);

    // Pre-reveal: roll panel mounted (placeholder) but final number
    // and outcome banners are quarantined.
    const panel = container.querySelector(
      '[data-testid="momentum-roll-reveal"]',
    ) as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute("data-revealed")).toBe("false");
    expect(panel!.textContent ?? "").not.toContain("31.08");
    assertNoPlayBanners(container);

    act(() => {
      vi.advanceTimersByTime(950);
    });

    // Post-reveal: bust banner visible, final roll digits visible,
    // win + cashout banners absent.
    expect(
      container.querySelector('[data-testid="momentum-banner-bust"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-banner-win"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-banner-cashout-total"]'),
    ).toBeNull();
    const digits = container.querySelector(
      '[data-testid="momentum-roll-digits"]',
    );
    expect(digits?.textContent).toContain("31.08");
  });

  it("case 4 · play win → pre-reveal clean; after 900ms → comboMultiplier shown, totalMultiplier banner ABSENT", () => {
    const bet = fakeBet({
      comboAfter: 5,
      comboMultiplier: "7.59",
      won: true,
      cashedOut: false,
      roll: 76.24,
    });
    const { container } = render(<Stage {...baseProps({ bet })} />);

    // Pre-reveal quarantine.
    assertNoPlayBanners(container);
    expect(container.textContent ?? "").not.toContain("76.24");
    expect(container.textContent ?? "").not.toContain("7.59");

    act(() => {
      vi.advanceTimersByTime(950);
    });

    // Post-reveal: win + step-mult banners present; cashout banner ABSENT.
    expect(
      container.querySelector('[data-testid="momentum-banner-win"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-step-mult"]')?.textContent,
    ).toContain("7.59");
    expect(
      container.querySelector('[data-testid="momentum-banner-cashout"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-banner-cashout-total"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-roll-digits"]')?.textContent,
    ).toContain("76.24");
  });

  it("case 5 · cashOut → totalMultiplier banner immediate; no roll panel, no play-win burst", () => {
    const bet = fakeBet({
      comboAfter: 0,
      comboMultiplier: "7.59",
      totalMultiplier: "7.59",
      won: true,
      cashedOut: true,
      roll: 0,
    });
    const { container } = render(
      <Stage {...baseProps({ bet, selection: { comboBefore: 5, cashOut: true } })} />,
    );

    // CashOut path: totalMultiplier banner present, roll panel absent,
    // play-win burst absent (engine truth: totalMultiplier only).
    const banner = container.querySelector(
      '[data-testid="momentum-banner-cashout-total"]',
    );
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("7.59");
    expect(
      container.querySelector('[data-testid="momentum-banner-win"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-banner-bust"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-roll-reveal"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="momentum-roll-digits"]'),
    ).toBeNull();
  });

  it("bonus · timer teardown: unmount + bet dep-change drop pending reveal timers (zero orphans)", () => {
    const bet1 = fakeBet({
      comboAfter: 1,
      comboMultiplier: "1.50",
      won: true,
      cashedOut: false,
      roll: 67.42,
    });
    const bet2 = fakeBet({
      comboAfter: 0,
      comboMultiplier: "1.00",
      won: false,
      cashedOut: false,
      roll: 31.08,
    });

    const { rerender, unmount } = render(<Stage {...baseProps({ bet: bet1 })} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    // Dep change BEFORE reveal fires → cleanup drops prior timer, starts fresh.
    rerender(<Stage {...baseProps({ bet: bet2 })} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    // Unmount → cleanup clears every pending timer.
    act(() => {
      unmount();
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });
});
