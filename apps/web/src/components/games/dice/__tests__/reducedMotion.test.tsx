/**
 * Dice · prefers-reduced-motion — render-only smoke.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedDiceGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps(): ImportedGameSurfaceProps<"dice"> {
  return {
    gameCode: "dice",
    currency: "PHON",
    stake: "10",
    selection: { target: "50.00", direction: "over" },
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

describe("Dice · prefers-reduced-motion", () => {
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
    const { container } = render(<ImportedDiceGame {...makeProps()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
