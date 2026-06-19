/**
 * GameBackLink — testid · href · aria-label · min thumb target.
 *
 * Link rendering is mocked to a plain anchor so this unit test stays
 * router-free; routing wire-up is covered by the e2e back-smoke
 * (`tests/e2e/games/limbo.spec.ts` §0-0b GameBackLink smoke).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { GameBackLink } from "../GameBackLink";

describe("GameBackLink", () => {
  it("renders with casino-game-back testid pointing to /casino", () => {
    render(<GameBackLink />);
    const link = screen.getByTestId("casino-game-back") as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/casino");
  });

  it("exposes a non-empty aria-label for screen readers", () => {
    render(<GameBackLink />);
    const link = screen.getByTestId("casino-game-back");
    expect(link).toHaveAttribute("aria-label");
    expect(link.getAttribute("aria-label")?.length ?? 0).toBeGreaterThan(0);
  });

  it("declares a minimum thumb-target height (≥ 44px) via min-h utility", () => {
    render(<GameBackLink />);
    const link = screen.getByTestId("casino-game-back");
    expect(link.className).toMatch(/min-h-\[44px\]/);
  });
});
