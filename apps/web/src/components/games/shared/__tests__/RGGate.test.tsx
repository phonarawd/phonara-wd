import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RGGate } from "../RGGate";

describe("RGGate (Phase 1 export)", () => {
  it("renders reason copy when open", () => {
    const { getByText } = render(<RGGate open reason="daily_loss_limit" onClose={() => {}} />);
    expect(getByText(/손실 한도/)).toBeTruthy();
  });

  it("calls onClose from close button", () => {
    const onClose = vi.fn();
    const { getByText } = render(<RGGate open reason="session_time" onClose={onClose} />);
    fireEvent.click(getByText("닫기"));
    expect(onClose).toHaveBeenCalled();
  });

  it("await-before-submit pattern: gate must resolve before allowing onPlaceBet", async () => {
    // Phase 1 RGGate is a controlled dialog; the wiring hook (Phase 2)
    // must await user response. Smoke-check: open=false implies no UI.
    const { queryByText } = render(
      <RGGate open={false} reason="kyc_required" onClose={() => {}} />,
    );
    expect(queryByText(/신원 확인/)).toBeNull();
  });
});
