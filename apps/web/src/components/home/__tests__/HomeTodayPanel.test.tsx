import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HomeTodayPanel } from "../panels/HomeTodayPanel";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/features/home/use-home-wallet-display", () => ({
  useHomeWalletDisplay: () => ({
    isLoggedIn: false,
    balanceDisplay: "₩1,284,500",
    todayEarnDisplay: "+12,400P",
    streakNow: 5,
    streakGoal: 7,
  }),
}));

describe("HomeTodayPanel (L1-16c stake-lobby)", () => {
  beforeEach(() => cleanup());

  it("renders the compact wallet strip", () => {
    const { container } = render(<HomeTodayPanel />);
    expect(container.querySelector('[data-testid="home-wallet-strip"]')).toBeTruthy();
  });

  it("renders the earn power row with 5 cards", () => {
    const { container } = render(<HomeTodayPanel />);
    expect(container.querySelector('[data-testid="home-earn-power"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="home-earn-card"]').length).toBe(5);
  });

  it("renders 3 stake-style category rows (casino/games/trade)", () => {
    const { container } = render(<HomeTodayPanel />);
    expect(container.querySelector('[data-testid="home-row-casino"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="home-row-games"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="home-row-trade"]')).toBeTruthy();
  });

  it("has exactly one data-primary-cta in fold0", () => {
    const { container } = render(<HomeTodayPanel />);
    expect(container.querySelectorAll("[data-primary-cta]").length).toBe(1);
  });

  it("does NOT render the full TierProgressPanel (chip only)", () => {
    const { container } = render(<HomeTodayPanel />);
    expect(container.querySelector('[data-testid="fomo-tier-panel"]')).toBeNull();
    expect(container.querySelector('[data-testid="home-tier-chip"]')).toBeTruthy();
  });
});
