/**
 * Crash · prefers-reduced-motion — render-only smoke.
 *
 * Confirms ImportedCrashGame mounts when the user opts into reduced
 * motion. The canvas loop is short-circuited; the JSX still renders.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedCrashGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps(): ImportedGameSurfaceProps<"crash"> {
  return {
    gameCode: "crash",
    currency: "PHON",
    stake: "10",
    selection: { autoCashout: "2.00" },
    clientSeed: "deadbeef",
    availableBalance: "10000",
    commitment: null,
    bet: null,
    verification: null,
    recentBets: [],
    busy: false,
    confirmOpen: false,
    onStakeChange: () => {},
    onCurrencyChange: () => {},
    onSelectionChange: () => {},
    onClientSeedChange: () => {},
    onPrepareRound: () => {},
    onOpenBetConfirm: () => {},
    onSubmitBet: () => {},
    onCancelBetConfirm: () => {},
  };
}

describe("Crash · prefers-reduced-motion", () => {
  beforeAll(() => {
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
  });
  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders without throwing under reduced motion", () => {
    const { container } = render(<ImportedCrashGame {...makeProps()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
