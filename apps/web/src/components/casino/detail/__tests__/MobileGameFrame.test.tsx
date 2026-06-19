import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MobileGameFrame } from "../MobileGameFrame";

vi.mock("@/components/casino/RTPChip", () => ({
  RTPChip: () => <span data-testid="rtp" />,
}));
vi.mock("@/components/casino/ProvablyFairBadge", () => ({
  ProvablyFairBadge: () => <span data-testid="fair" />,
}));
vi.mock("../MobileSideStack", () => ({
  MobileSideStack: () => <div data-testid="side-stack" />,
}));

describe("MobileGameFrame · L1-16g toggles", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders both bet-collapse and fullscreen buttons", () => {
    const { getByTestId } = render(
      <MobileGameFrame gameId="crash">
        <div data-game-id="crash-panel-mobile">bet</div>
      </MobileGameFrame>,
    );
    expect(getByTestId("mobile-bet-toggle")).toBeTruthy();
    expect(getByTestId("mobile-fs-toggle")).toBeTruthy();
  });

  it("toggles data-bet on bet button click and persists", () => {
    const { container, getByTestId } = render(
      <MobileGameFrame gameId="crash">
        <div data-game-id="crash-panel-mobile">bet</div>
      </MobileGameFrame>,
    );
    const root = container.querySelector('[data-skin="mobile-crush"]')!;
    expect(root.getAttribute("data-bet")).toBe("expanded");
    fireEvent.click(getByTestId("mobile-bet-toggle"));
    expect(root.getAttribute("data-bet")).toBe("collapsed");
    expect(localStorage.getItem("phonara.mobile.bet.collapsed")).toBe("1");
  });

  it("invokes requestFullscreen on fs button click", () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    // jsdom: stub Element.requestFullscreen
    (HTMLElement.prototype as unknown as { requestFullscreen: () => Promise<void> })
      .requestFullscreen = spy;
    const { getByTestId } = render(
      <MobileGameFrame gameId="crash">
        <div data-game-id="crash-panel-mobile">bet</div>
      </MobileGameFrame>,
    );
    fireEvent.click(getByTestId("mobile-fs-toggle"));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
