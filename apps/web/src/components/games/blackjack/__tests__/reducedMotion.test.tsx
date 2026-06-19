/**
 * Blackjack · prefers-reduced-motion — render smoke only.
 * Card flip animation must be no-op under reduced motion.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedBlackjackGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

const original = window.matchMedia;

describe("Blackjack · prefers-reduced-motion", () => {
  beforeAll(() => {
    window.matchMedia = (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  });
  afterAll(() => {
    window.matchMedia = original;
  });

  it("renders without throwing under reduced motion + bjFlip animation disabled", () => {
    const { container } = render(
      <ImportedBlackjackGame {...makeSurfaceProps("blackjack")} />,
    );
    expect(container.firstChild).toBeTruthy();
    // bjFlip animation should not be inlined as a style on any card under reduced motion.
    const cards = container.querySelectorAll("[data-bj-card]");
    cards.forEach((c) => {
      const style = (c as HTMLElement).getAttribute("style") ?? "";
      expect(style).not.toMatch(/bjFlip/);
    });
  });
});
