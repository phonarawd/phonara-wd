/**
 * Wave 6R — BuyOrderSheet smoke.
 * open=false → no sheet content; open=true → sheet primitive mounts (vaul title).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BuyOrderSheet } from "../BuyOrderSheet";

const baseProps = {
  side: "long" as const,
  onSideChange: () => {},
  symbol: "BTCUSDT",
  lastPriceDisplay: "65,000",
  priceInput: "65000",
  onPriceInput: () => {},
  amountInput: "",
  onAmountInput: () => {},
  availableBalanceDisplay: "1,000 USDT",
  estFeeDisplay: "0.05 USDT",
  estLiqPriceDisplay: "—",
  leverage: 10,
  onLeverageChange: () => {},
  orderType: "limit" as const,
  onOrderTypeChange: () => {},
};

describe("Wave 6R BuyOrderSheet", () => {
  it("does not render sheet content when open=false", () => {
    cleanup();
    render(
      <BuyOrderSheet {...baseProps} open={false} onOpenChange={() => {}} />,
    );
    // vaul Drawer primitive uses role="dialog" via DrawerPrimitive.Title context;
    // when closed, no dialog should be in the DOM.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mounts sheet content when open=true (long entry title visible)", () => {
    cleanup();
    render(
      <BuyOrderSheet {...baseProps} open={true} onOpenChange={() => {}} />,
    );
    // vaul portals into document.body; title from DrawerPrimitive.Title.
    expect(screen.getByText("롱 진입")).toBeTruthy();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    cleanup();
    const onOpenChange = vi.fn();
    render(
      <BuyOrderSheet {...baseProps} open={true} onOpenChange={onOpenChange} />,
    );
    const closeBtn = screen.getByLabelText("닫기");
    closeBtn.click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
