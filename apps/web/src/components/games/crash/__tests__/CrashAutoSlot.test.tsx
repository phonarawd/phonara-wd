/**
 * Crash · CrashAutoSlot — typed AutoSlotProps<"crash"> contract.
 *
 * Verifies the slot renders the canonical testids, round-trips input
 * via `onAutoCashoutChange`, and applies the same `[^\d.]` / 8-char
 * slicing rule as the Manual-tab field.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrashAutoSlot } from "../CrashAutoSlot";

describe("Crash · CrashAutoSlot", () => {
  it("renders the slot wrapper + input testids", () => {
    render(<CrashAutoSlot autoCashout="2.00" onAutoCashoutChange={() => {}} />);
    expect(screen.getByTestId("casino-auto-slot-crash")).toBeInTheDocument();
    expect(screen.getByTestId("casino-auto-crash-target")).toHaveValue("2.00");
  });

  it("round-trips edits via onAutoCashoutChange (clean digits + dot only)", () => {
    const onChange = vi.fn();
    render(<CrashAutoSlot autoCashout="2.00" onAutoCashoutChange={onChange} />);
    const input = screen.getByTestId("casino-auto-crash-target");
    fireEvent.change(input, { target: { value: "3.50abc" } });
    expect(onChange).toHaveBeenLastCalledWith("3.50");
  });

  it("clamps to 8 characters", () => {
    const onChange = vi.fn();
    render(<CrashAutoSlot autoCashout="" onAutoCashoutChange={onChange} />);
    const input = screen.getByTestId("casino-auto-crash-target");
    fireEvent.change(input, { target: { value: "1234567890" } });
    expect(onChange).toHaveBeenLastCalledWith("12345678");
  });
});
