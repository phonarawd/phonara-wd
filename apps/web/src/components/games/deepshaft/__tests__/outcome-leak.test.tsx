/**
 * Deepshaft · outcome-leak — LAW 4 FULL + timer teardown.
 *
 * 5 cases (target → 630/630):
 *   1. idle: bet=null + neutral selection → all cells hidden, no
 *      gold/cavein in DOM, no settle banner.
 *   2. engine path: bet.result.levels[] present + revealIndex=0 →
 *      every cell still hidden (deeper floors quarantined), settle
 *      banner reads ONLY totalMultiplier/won/caveIn from bet.result.
 *   3. mock path: bet=null + commitment → mockLevels is decorative,
 *      no settle banner (mock cannot drive UI win/cavein).
 *   4. reduced motion + settled → cells render at opacity 1, hidden
 *      cells still neutral, no stagger timers scheduled (jump to end).
 *   5. timer teardown: unmount AND selection dep-change → all pending
 *      setTimeout cleared (zero orphan timers).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { Stage } from "../Stage";
import type {
  ImportedGameSurfaceProps,
  UiBetView,
} from "@/games/shared/types";

type StageProps = Pick<
  ImportedGameSurfaceProps<"deepshaft">,
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
    gameCode: "deepshaft",
    selection: { riskTier: "standard", targetDepth: 5 },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    busy: false,
    onClientSeedChange: () => {},
    ...over,
  };
}

function fakeBet(result: Record<string, unknown>): UiBetView {
  return {
    status: "won",
    payout: "0",
    result,
  } as unknown as UiBetView;
}

function assertNoOutcomeLeak(root: HTMLElement) {
  const cells = root.querySelectorAll<HTMLElement>(
    "[data-testid='deepshaft-cell'][data-state='hidden']",
  );
  cells.forEach((c) => {
    expect(c.dataset.state).toBe("hidden");
    expect(c.className).not.toMatch(/amber|gold|rose|cavein/i);
    // No leaked gold/cavein attrs on hidden cells anywhere.
    for (const attr of Array.from(c.attributes)) {
      const v = attr.value.toLowerCase();
      if (attr.name.startsWith("data-")) {
        expect(v).not.toContain("gold");
        expect(v).not.toContain("cavein");
      }
    }
  });
}

describe("Deepshaft · outcome-leak (LAW 4 FULL + timer)", () => {
  beforeEach(() => {
    window.matchMedia = (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("case 1 · idle: hidden cells carry zero gold/cavein leak; no settle banner", () => {
    const { container } = render(<Stage {...baseProps()} />);
    const cells = container.querySelectorAll("[data-testid='deepshaft-cell']");
    expect(cells.length).toBe(5);
    cells.forEach((c) => {
      expect((c as HTMLElement).dataset.state).toBe("hidden");
    });
    assertNoOutcomeLeak(container);
    expect(container.querySelector("[data-testid='deepshaft-banner-win']")).toBeNull();
    expect(container.querySelector("[data-testid='deepshaft-banner-cavein']")).toBeNull();
  });

  it("case 2 · engine path: bet.result.levels[] present + revealIndex=0 → deeper floors quarantined, settle banner reads totalMultiplier/won/caveIn only", () => {
    vi.useFakeTimers();
    const bet = fakeBet({
      levels: [
        { kind: "gold", levelMultiplier: "1.35" },
        { kind: "gold", levelMultiplier: "1.82" },
        { kind: "gold", levelMultiplier: "2.40" },
        { kind: "gold", levelMultiplier: "3.10" },
        { kind: "gold", levelMultiplier: "4.05" },
      ],
      reachedDepth: 5,
      caveIn: false,
      totalMultiplier: "4.05",
      won: true,
    });
    const { container } = render(<Stage {...baseProps({ bet })} />);
    // Pre-tick: revealIndex=0 → every floor still hidden (deeper floors
    // quarantined). LAW 4: hidden cells carry no gold/cavein token.
    const hidden = container.querySelectorAll(
      "[data-testid='deepshaft-cell'][data-state='hidden']",
    );
    expect(hidden.length).toBe(5);
    assertNoOutcomeLeak(container);

    // Settle banner is driven by bet.result scalars ONLY.
    const winBanner = container.querySelector(
      "[data-testid='deepshaft-banner-win']",
    );
    expect(winBanner).not.toBeNull();
    expect(winBanner!.textContent).toContain("4.05");
    expect(container.querySelector("[data-testid='deepshaft-banner-cavein']")).toBeNull();
  });

  it("case 3 · mock path: bet=null + commitment → replayLevels decorative, no settle banner", () => {
    const { container } = render(
      <Stage
        {...baseProps({
          commitment: {
            round_id: "round-1",
            server_seed_hash: "abc123",
          },
        })}
      />,
    );
    // No bet → settled=false → every cell hidden regardless of mock levels.
    assertNoOutcomeLeak(container);
    expect(container.querySelector("[data-testid='deepshaft-banner-win']")).toBeNull();
    expect(container.querySelector("[data-testid='deepshaft-banner-cavein']")).toBeNull();
  });

  it("case 4 · reduced motion + settled: cells reveal at final state, no orphan stagger timers", () => {
    window.matchMedia = (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    vi.useFakeTimers();
    const bet = fakeBet({
      levels: [
        { kind: "gold", levelMultiplier: "1.35" },
        { kind: "cavein" },
      ],
      reachedDepth: 1,
      caveIn: true,
      totalMultiplier: "0",
      won: false,
    });
    const { container } = render(
      <Stage {...baseProps({ bet, selection: { riskTier: "standard", targetDepth: 2 } })} />,
    );
    // Reduced motion → jump to final revealIndex without scheduling per-cell stagger.
    const revealed = container.querySelectorAll(
      "[data-testid='deepshaft-cell']:not([data-state='hidden'])",
    );
    expect(revealed.length).toBe(2);
    // No pending stagger timers scheduled when reduced motion is on.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("case 5 · timer teardown: unmount AND dep-change clear all pending setTimeout (zero orphans)", () => {
    vi.useFakeTimers();
    const bet = fakeBet({
      levels: Array.from({ length: 5 }, () => ({ kind: "gold" as const, levelMultiplier: "1.20" })),
      reachedDepth: 5,
      caveIn: false,
      totalMultiplier: "1.20",
      won: true,
    });

    const { rerender, unmount } = render(
      <Stage {...baseProps({ bet, selection: { riskTier: "standard", targetDepth: 5 } })} />,
    );
    // Pending stagger timers exist before dep change.
    const before = vi.getTimerCount();
    expect(before).toBeGreaterThan(0);

    // Dep change BEFORE timers fire → effect cleanup must drop the prior batch
    // and start a fresh one (same magnitude, no accumulation).
    rerender(
      <Stage {...baseProps({ bet, selection: { riskTier: "deep", targetDepth: 5 } })} />,
    );
    expect(vi.getTimerCount()).toBe(before);

    // Unmount → cleanup clears every pending timer (zero orphans).
    act(() => {
      unmount();
    });
    expect(vi.getTimerCount()).toBe(0);

    // Advancing time after teardown MUST NOT throw (no orphan handler).
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });
});
