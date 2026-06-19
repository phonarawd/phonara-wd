/**
 * C-2 · BetConfirmDialog — 3 testid attach/detach by `open`.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BetConfirmDialog } from "../BetConfirmDialog";

const noop = () => {};

describe("C-2 · BetConfirmDialog", () => {
  it("open=false → 3 testid NOT attached", () => {
    render(
      <BetConfirmDialog
        open={false}
        stake="10"
        currency="PHON"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-cancel")).toBeNull();
  });

  it("open=true → 3 testid attached + confirm/cancel fire", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <BetConfirmDialog
        open
        stake="10"
        currency="PHON"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("casino-bet-confirm-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("casino-bet-confirm-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
