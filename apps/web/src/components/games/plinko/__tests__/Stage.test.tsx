/**
 * Plinko · Stage — props-only render smoke.
 * Matter.js is mounted under jsdom; we assert mount + multiplier strip
 * without driving the physics loop.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";

function baseProps(overrides: Partial<Parameters<typeof Stage>[0]> = {}) {
  return {
    gameCode: "plinko" as const,
    selection: { rows: 8 as const, risk: "low" as const },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    onClientSeedChange: vi.fn(),
    ...overrides,
  };
}

describe("Plinko · Stage", () => {
  it("renders the multiplier strip for low/8", () => {
    const { container } = render(<Stage {...baseProps()} />);
    // low/8 → 9 bins
    const bins = container.querySelectorAll("div.flex-1");
    expect(bins.length).toBe(9);
  });

  it("renders 13 bins for low/12", () => {
    const { container } = render(
      <Stage {...baseProps({ selection: { rows: 12, risk: "low" } })} />,
    );
    expect(container.querySelectorAll("div.flex-1").length).toBe(13);
  });
});
