/**
 * Plinko · prefers-reduced-motion — render-only smoke.
 * Asserts the surface mounts without throwing when Matter.Runner is
 * skipped under reduced motion.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedPlinkoGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps(): ImportedGameSurfaceProps<"plinko"> {
  return {
    gameCode: "plinko",
    currency: "PHON",
    stake: "10",
    selection: { rows: 8, risk: "low" },
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

describe("Plinko · prefers-reduced-motion", () => {
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
    const { container } = render(<ImportedPlinkoGame {...makeProps()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
