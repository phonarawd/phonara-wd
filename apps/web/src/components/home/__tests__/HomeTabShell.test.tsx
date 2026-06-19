import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HomeTabShell } from "../HomeTabShell";

// Mock TanStack Router Link to avoid router context requirement
import { vi } from "vitest";
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

describe("HomeTabShell", () => {
  beforeEach(() => cleanup());

  it("renders 5 primary tabs and defaults to today", () => {
    render(<HomeTabShell />);
    const tabs = screen.getAllByRole("tab").filter((el) =>
      el.getAttribute("data-tab-id"),
    );
    expect(tabs).toHaveLength(5);
    const today = tabs.find((t) => t.getAttribute("data-tab-id") === "today");
    expect(today?.getAttribute("aria-selected")).toBe("true");
  });

  it("renders exactly one data-primary-cta in the default (today) fold", () => {
    const { container } = render(<HomeTabShell />);
    const ctas = container.querySelectorAll("[data-primary-cta]");
    expect(ctas.length).toBe(1);
  });

  it("switches panel when a different primary tab is clicked", () => {
    render(<HomeTabShell />);
    const invite = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("data-tab-id") === "invite")!;
    fireEvent.click(invite);
    expect(invite.getAttribute("aria-selected")).toBe("true");
    expect(
      document.querySelector('[data-hub-id="home-invite"]'),
    ).toBeTruthy();
  });

  it("tab targets meet ≥48px touch (min-h-12 class)", () => {
    render(<HomeTabShell />);
    const tabs = screen
      .getAllByRole("tab")
      .filter((el) => el.getAttribute("data-tab-id"));
    for (const t of tabs) {
      expect(t.className).toMatch(/min-h-12/);
    }
  });
});
