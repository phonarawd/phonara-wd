/**
 * HiLo · HUD — render smoke.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HUD } from "../HUD";

describe("HiLo · HUD", () => {
  it("renders without throwing for empty recentBets", () => {
    const { container } = render(<HUD recentBets={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
