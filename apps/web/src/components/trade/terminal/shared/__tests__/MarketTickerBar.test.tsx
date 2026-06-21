import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, cleanup, screen, within } from "@testing-library/react";
import { MarketTickerBar } from "../MarketTickerBar";

const defaultProps = {
  baseLabel: "BTC",
  pairLabel: "BTC / USDT Perp",
  markets: [{ symbol: "BTCUSDT", display_name: "BTC/USDT" }],
  selectedSymbol: "BTCUSDT",
  onMarketChange: vi.fn(),
  lastPriceDisplay: "64,200.5",
  lastPriceToneClass: "text-(--color-up)",
  markPriceDisplay: "64,198.0",
  fundingDisplay: "0.0125%",
  fundingToneClass: "text-(--color-up)",
  openInterestDisplay: "2.41B",
};

describe("MarketTickerBar · hybrid pilot", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders Last price hero in primary row", () => {
    render(<MarketTickerBar {...defaultProps} />);
    expect(screen.getByText("실시간 시세")).toBeTruthy();
    expect(screen.getByText("64,200.5")).toBeTruthy();
  });

  it("keeps Mark and funding hidden when Advanced is collapsed", () => {
    render(<MarketTickerBar {...defaultProps} />);
    const panel = screen.getByTestId("trade-ticker-advanced-panel");
    expect(panel.hasAttribute("hidden")).toBe(true);
    expect(panel).not.toBeVisible();
    expect(screen.getByTestId("trade-ticker-advanced-toggle").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("reveals Mark and funding when Advanced is expanded", () => {
    render(<MarketTickerBar {...defaultProps} />);
    fireEvent.click(screen.getByTestId("trade-ticker-advanced-toggle"));
    expect(screen.getByText("정산 기준가")).toBeTruthy();
    expect(screen.getByText("64,198.0")).toBeTruthy();
    expect(screen.getByText("0.0125%")).toBeTruthy();
    expect(screen.getByTestId("trade-ticker-advanced-toggle").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("preserves markPriceUnavailable muted styling", () => {
    render(
      <MarketTickerBar
        {...defaultProps}
        markPriceDisplay="—"
        markPriceUnavailable
      />,
    );
    fireEvent.click(screen.getByTestId("trade-ticker-advanced-toggle"));
    const panel = screen.getByTestId("trade-ticker-advanced-panel");
    const markLabel = within(panel).getByText("정산 기준가");
    const markValue = markLabel.nextElementSibling as HTMLElement | null;
    expect(markValue?.className).toContain("text-muted-foreground");
    expect(markValue?.className).toContain("opacity-70");
  });

  it("exposes a11y attributes on market select and advanced toggle", () => {
    render(<MarketTickerBar {...defaultProps} />);
    expect(document.getElementById("trade-terminal-market")).toBeTruthy();
    const toggle = screen.getByTestId("trade-ticker-advanced-toggle");
    expect(toggle.getAttribute("aria-controls")).toBe("trade-ticker-advanced-panel");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses reduced-motion-safe chevron classes", () => {
    render(<MarketTickerBar {...defaultProps} />);
    const toggle = screen.getByTestId("trade-ticker-advanced-toggle");
    const chevron = toggle.querySelector("svg");
    expect(chevron?.className.baseVal ?? chevron?.getAttribute("class")).toMatch(
      /motion-reduce:transition-none/,
    );
  });
});
