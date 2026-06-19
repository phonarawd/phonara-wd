/**
 * Crash · auto-bet countdown UI smoke.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CrashAutoCountdown } from "../CrashAutoCountdown";

describe("CrashAutoCountdown", () => {
  it("renders the seconds value with one decimal", () => {
    render(<CrashAutoCountdown seconds={4.7} />);
    const el = screen.getByTestId("casino-autobet-countdown");
    expect(el.textContent).toMatch(/4\.7/);
  });

  it("has aria-live=polite for screen readers", () => {
    render(<CrashAutoCountdown seconds={1.0} />);
    expect(screen.getByTestId("casino-autobet-countdown")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
