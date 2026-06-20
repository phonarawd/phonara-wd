import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { GoldenEarthGlobe } from "../../golden-earth/GoldenEarthGlobe";

vi.mock("@/components/games/shared/hooks/useReducedMotionGuard", () => ({
  useReducedMotionGuard: () => true,
}));

describe("GoldenEarthGlobe reduced-motion", () => {
  it("does not apply spin when reduced motion is active", () => {
    const { container } = render(<GoldenEarthGlobe />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class") ?? "").not.toMatch(/spin/);
  });
});
