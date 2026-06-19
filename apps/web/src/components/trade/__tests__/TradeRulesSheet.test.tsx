/**
 * Wave 6R — TradeRulesSheet smoke.
 * Trigger renders + closed sheet doesn't render content + open prop mounts content.
 * No interaction with vaul portal animations; assertions stay on render-only DOM.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TradeRulesSheet, TradeRulesTrigger } from "../TradeRulesSheet";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("Wave 6R TradeRulesSheet", () => {
  it("TradeRulesTrigger renders with stable testid + aria-label", () => {
    cleanup();
    const onClick = vi.fn();
    render(<TradeRulesTrigger onClick={onClick} />);
    const trigger = screen.getByTestId("trade-rules");
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-label")).toBeTruthy();
  });

  it("sheet content is absent when closed", () => {
    cleanup();
    render(<TradeRulesSheet open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId("trade-rules-sheet")).toBeNull();
  });

  it("sheet content mounts when open=true", () => {
    cleanup();
    render(<TradeRulesSheet open={true} onOpenChange={() => {}} />);
    expect(screen.getByTestId("trade-rules-sheet")).toBeTruthy();
  });
});
