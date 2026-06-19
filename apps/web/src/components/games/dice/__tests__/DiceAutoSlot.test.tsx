/**
 * DiceAutoSlot — props-mirror unit tests. Engine 0-touch.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiceAutoSlot } from "../DiceAutoSlot";

function setup(over: boolean = true) {
  const onTargetChange = vi.fn();
  const onDirectionChange = vi.fn();
  const utils = render(
    <DiceAutoSlot
      target="50.00"
      direction={over ? "over" : "under"}
      onTargetChange={onTargetChange}
      onDirectionChange={onDirectionChange}
    />,
  );
  return { onTargetChange, onDirectionChange, ...utils };
}

describe("DiceAutoSlot", () => {
  it("mounts a single wrapper", () => {
    setup();
    expect(screen.getAllByTestId("casino-auto-slot-dice")).toHaveLength(1);
  });

  it("target input round-trips via onTargetChange", () => {
    const { onTargetChange } = setup();
    const input = screen.getByTestId("casino-auto-dice-target") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "42.50" } });
    expect(onTargetChange).toHaveBeenCalledWith("42.50");
  });

  it("strips non-numeric and clamps to 5 chars", () => {
    const { onTargetChange } = setup();
    const input = screen.getByTestId("casino-auto-dice-target") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "9a8.7654321" } });
    expect(onTargetChange).toHaveBeenCalledWith("98.76");
  });

  it("over↔under toggle calls onDirectionChange", () => {
    const { onDirectionChange } = setup(true);
    fireEvent.click(screen.getByTestId("casino-auto-dice-under"));
    expect(onDirectionChange).toHaveBeenCalledWith("under");
    fireEvent.click(screen.getByTestId("casino-auto-dice-over"));
    expect(onDirectionChange).toHaveBeenCalledWith("over");
  });

  it("aria-pressed reflects direction", () => {
    const { rerender } = setup(true);
    expect(screen.getByTestId("casino-auto-dice-over")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("casino-auto-dice-under")).toHaveAttribute("aria-pressed", "false");
    rerender(
      <DiceAutoSlot
        target="50.00"
        direction="under"
        onTargetChange={() => {}}
        onDirectionChange={() => {}}
      />,
    );
    expect(screen.getByTestId("casino-auto-dice-under")).toHaveAttribute("aria-pressed", "true");
  });
});
