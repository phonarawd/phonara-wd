import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SurvivalCheckinCard } from "../../survival/SurvivalCheckinCard";

vi.mock("@/shims/react-router-dom", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/hooks/useLiveCount", () => ({
  useLiveCount: (seed: number) => seed,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/games/shared/hooks/useReducedMotionGuard", () => ({
  useReducedMotionGuard: () => false,
}));

describe("SurvivalCheckinCard (L1-21 K3)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders mockNotice and survival-checkin-card", () => {
    render(<SurvivalCheckinCard forcePhase="open" />);
    expect(screen.getByTestId("survival-checkin-card")).toBeTruthy();
    expect(screen.getByText(/순위·친구·참여자는 연출|Ranks, friends, and counts are demo/)).toBeTruthy();
  });

  it("does NOT add data-primary-cta", () => {
    const { container } = render(<SurvivalCheckinCard forcePhase="open" />);
    expect(container.querySelectorAll("[data-primary-cta]").length).toBe(0);
  });

  it("disables CTA in before phase", () => {
    render(<SurvivalCheckinCard forcePhase="before" />);
    const btn = screen.getByTestId("survival-checkin-cta");
    expect(btn.getAttribute("disabled")).not.toBeNull();
  });

  it("enables CTA in open phase and shows rank on tap", () => {
    render(<SurvivalCheckinCard forcePhase="open" />);
    const btn = screen.getByTestId("survival-checkin-cta");
    expect(btn.getAttribute("disabled")).toBeNull();
    fireEvent.click(btn);
    expect(screen.getByTestId("survival-rank-reveal")).toBeTruthy();
  });

  it("shows friend ranking with demo disclaimer", () => {
    render(<SurvivalCheckinCard forcePhase="open" />);
    expect(screen.getByTestId("survival-friend-ranking")).toBeTruthy();
    expect(screen.getByText(/데모 친구|Demo friends/)).toBeTruthy();
  });

  it("shows tier table with launch reward disclaimer", () => {
    render(<SurvivalCheckinCard forcePhase="open" />);
    const tierTable = screen.getByTestId("survival-tier-table");
    expect(tierTable.textContent).toMatch(/오픈 기념 보상|Launch reward · paid on official open/);
  });

  it("disables CTA in closed phase", () => {
    render(<SurvivalCheckinCard forcePhase="closed" />);
    const btn = screen.getByTestId("survival-checkin-cta");
    expect(btn.getAttribute("disabled")).not.toBeNull();
  });
});
