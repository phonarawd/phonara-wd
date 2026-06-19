/**
 * HiLo · prefers-reduced-motion — render smoke.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedHiloGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps(): ImportedGameSurfaceProps<"hilo"> {
  return {
    gameCode: "hilo",
    currency: "PHON",
    stake: "10",
    selection: { startCard: null, guesses: [] },
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

describe("HiLo · prefers-reduced-motion", () => {
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
    const { container } = render(<ImportedHiloGame {...makeProps()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
