import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HomeSideNav } from "../HomeSideNav";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useRouterState: () => "/home",
}));

describe("HomeSideNav (L1-16c)", () => {
  beforeEach(() => cleanup());

  it("renders 6 nav items + search input (Wave 6bR: /earn tail-appended)", () => {
    const { container } = render(<HomeSideNav />);
    expect(container.querySelectorAll("[data-side-nav-item]").length).toBe(6);
    expect(container.querySelector('[data-testid="home-side-search"]')).toBeTruthy();
  });

  it("places /earn at tail position (index 5) without disturbing prior 5", () => {
    const { container } = render(<HomeSideNav />);
    const tos = Array.from(container.querySelectorAll("[data-side-nav-item]"))
      .map((el) => el.getAttribute("data-side-nav-item"));
    expect(tos).toEqual(["/home", "/casino", "/sports", "/trade", "/wallet", "/earn"]);
  });

  it("contains zero labels overlapping HomeTabShell (missions/rank/invite)", () => {
    const { container } = render(<HomeSideNav />);
    const tos = Array.from(container.querySelectorAll("[data-side-nav-item]"))
      .map((el) => el.getAttribute("data-side-nav-item"));
    expect(tos).not.toContain("/earn/missions");
    expect(tos).not.toContain("/leaderboard");
    expect(tos).not.toContain("/referral");
  });

  it("marks /home as active by default", () => {
    const { container } = render(<HomeSideNav />);
    const home = container.querySelector('[data-side-nav-item="/home"]');
    expect(home?.getAttribute("data-active")).toBe("true");
  });

  it("shows close button only in drawer mode", () => {
    const a = render(<HomeSideNav />);
    expect(a.container.querySelector('button[aria-label]')).toBeNull();
    cleanup();
    const b = render(<HomeSideNav drawer onClose={() => {}} />);
    expect(b.container.querySelector('button[aria-label]')).toBeTruthy();
  });
});
