import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TradeModeShell } from "../TradeModeShell";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

vi.mock("@/features/trading/display-chart/exchange-live-chart", () => ({
  ExchangeLiveChart: () => <div data-testid="mock-exchange-chart" />,
}));

vi.mock("@/components/trade/terminal/staking/StakingDiscoverGrid", () => ({
  StakingDiscoverGrid: ({ readOnly }: { readOnly?: boolean }) => (
    <div data-testid="trade-panel-staking">
      {readOnly ? (
        <span data-testid="trade-staking-display-only-label">display-only</span>
      ) : null}
    </div>
  ),
}));

describe("L1-17 TradeModeShell", () => {
  beforeEach(() => {
    cleanup();
    try {
      window.localStorage.removeItem("phonara-trade-mode-v1");
    } catch {
      /* ignore */
    }
  });

  it("renders 3 mode segments", () => {
    const { container } = render(<TradeModeShell />);
    expect(container.querySelector('[data-testid="trade-mode-spot"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="trade-mode-futures"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="trade-mode-staking"]')).toBeTruthy();
  });

  it("defaults to futures and mounts the futures panel", () => {
    const { container } = render(<TradeModeShell />);
    const fut = container.querySelector('[data-testid="trade-mode-futures"]');
    expect(fut?.getAttribute("data-active")).toBe("true");
    expect(container.querySelector('[data-testid="trade-panel-futures"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="trade-panel-spot"]')).toBeNull();
    expect(container.querySelector('[data-testid="trade-panel-staking"]')).toBeNull();
  });

  it("renders the display-only synthetic label inside futures", () => {
    const { container } = render(<TradeModeShell />);
    expect(
      container.querySelector('[data-testid="trade-futures-display-only-label"]'),
    ).toBeTruthy();
  });

  it("swaps to spot panel on segment click", () => {
    const { container } = render(<TradeModeShell />);
    fireEvent.click(container.querySelector('[data-testid="trade-mode-spot"]')!);
    expect(container.querySelector('[data-testid="trade-panel-spot"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="trade-panel-futures"]')).toBeNull();
  });

  it("swaps to staking panel on segment click", () => {
    const { container } = render(<TradeModeShell />);
    fireEvent.click(container.querySelector('[data-testid="trade-mode-staking"]')!);
    expect(container.querySelector('[data-testid="trade-panel-staking"]')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="trade-staking-display-only-label"]'),
    ).toBeTruthy();
  });
});
