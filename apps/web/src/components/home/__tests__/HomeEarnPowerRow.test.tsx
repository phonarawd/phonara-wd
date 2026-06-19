import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HomeEarnPowerRow } from "../HomeEarnPowerRow";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("HomeEarnPowerRow (L1-16c)", () => {
  beforeEach(() => cleanup());

  it("renders 5 earn cards with snap-x scrolling", () => {
    const { container } = render(<HomeEarnPowerRow />);
    expect(container.querySelectorAll('[data-testid="home-earn-card"]').length).toBe(5);
    expect(container.querySelector(".snap-x")).toBeTruthy();
  });

  it("each card carries a stable data-earn-id", () => {
    const { container } = render(<HomeEarnPowerRow />);
    const ids = Array.from(container.querySelectorAll("[data-earn-id]")).map((el) =>
      el.getAttribute("data-earn-id"),
    );
    expect(ids).toEqual(["checkin", "mission", "wheel", "drop", "invite"]);
  });
});
