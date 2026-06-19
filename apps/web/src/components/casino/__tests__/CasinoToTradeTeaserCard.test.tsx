import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CasinoToTradeTeaserCard } from "../CasinoToTradeTeaserCard";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} data-to={to} {...props}>
      {children}
    </a>
  ),
}));

describe("CasinoToTradeTeaserCard (Wave 6.5)", () => {
  beforeEach(() => cleanup());

  it("renders with hub-id and links to /trade", () => {
    const { container } = render(<CasinoToTradeTeaserCard />);
    const root = container.querySelector('[data-hub-id="casino-trade"]');
    expect(root).toBeTruthy();
    const link = container.querySelector('a[data-to="/trade"]');
    expect(link).toBeTruthy();
  });

  it("renders title, desc, and cta copy", () => {
    const { container } = render(<CasinoToTradeTeaserCard />);
    const text = container.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(container.querySelectorAll("p").length).toBeGreaterThanOrEqual(2);
  });
});
