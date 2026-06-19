/**
 * Limbo · prefers-reduced-motion — render-only smoke.
 * Reduced motion 모드에서 surface가 throw 없이 마운트되는지 확인.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedLimboGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps(): ImportedGameSurfaceProps<"limbo"> {
  return {
    gameCode: "limbo",
    currency: "PHON",
    stake: "10",
    selection: { target: "2.00" },
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

describe("Limbo · prefers-reduced-motion", () => {
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
    const { container } = render(<ImportedLimboGame {...makeProps()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
