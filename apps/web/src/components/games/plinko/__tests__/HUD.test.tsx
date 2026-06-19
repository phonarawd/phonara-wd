/**
 * Plinko · HUD — props-only render smoke.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HUD } from "../HUD";

describe("Plinko · HUD", () => {
  it("renders with no bets", () => {
    const { container } = render(<HUD recentBets={[]} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with a recent bet", () => {
    const { container } = render(
      <HUD
        recentBets={[
          {
            id: "r1",
            game: "plinko",
            currency: "PHON",
            stake: "10",
            payout: "20",
            multiplier: "2.00",
            at: Date.now(),
            win: true,
          },
        ]}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
