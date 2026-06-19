/**
 * Limbo · HUD — presence ghost + recent bets render smoke.
 * Phase 4 v1.3: `casino-presence-ghost` testid is asserted but excluded
 * from the 9-money set (non-money, optional E2E target).
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HUD } from "../HUD";

describe("Limbo · HUD", () => {
  it("renders the presence ghost strip on first paint", () => {
    render(<HUD recentBets={[]} />);
    expect(screen.getByTestId("casino-presence-ghost")).toBeInTheDocument();
  });

  it("renders with a recent bet alongside the ghost strip", () => {
    const { container } = render(
      <HUD
        recentBets={[
          {
            id: "r1",
            game: "limbo",
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
    expect(screen.getByTestId("casino-presence-ghost")).toBeInTheDocument();
  });
});
