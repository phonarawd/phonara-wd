/**
 * Mint Reels · prefers-reduced-motion — render smoke only.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { ImportedMintReelsGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

const original = window.matchMedia;

describe("Mint Reels · prefers-reduced-motion", () => {
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

  it("renders without throwing under reduced motion", () => {
    const { container } = render(
      <ImportedMintReelsGame {...makeSurfaceProps("mint_reels")} />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
