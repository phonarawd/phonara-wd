// Wave 4.5 — WheelOfFortune onSpinEnd callback tests
// Math.random stub is scoped to this file only (allowed: testing the wheel's own randomness).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import { WheelOfFortune } from "@/components/fomo/WheelOfFortune";

// slices indexes: 0=100P, 1=300P, 2=miss, 3=500P, 4=1KP, 5=miss, 6=5KP, 7=200P
// Math.floor(Math.random() * 8) → pick slice idx by Math.random() = idx/8 + epsilon.
const randFor = (idx: number) => idx / 8 + 0.001;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Wave 4.5 WheelOfFortune onSpinEnd", () => {
  it("fires onSpinEnd with won=true on a winning slice", () => {
    vi.spyOn(Math, "random").mockReturnValue(randFor(0)); // 100P
    const onSpinEnd = vi.fn();
    render(<WheelOfFortune onSpinEnd={onSpinEnd} />);
    fireEvent.click(screen.getByRole("button", { name: /spin|돌리기/i }));
    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(onSpinEnd).toHaveBeenCalledTimes(1);
    expect(onSpinEnd).toHaveBeenCalledWith({ won: true, value: 100 });
  });

  it("fires onSpinEnd with won=false on a miss slice (parent won-only filter → 0 sheet opens)", () => {
    vi.spyOn(Math, "random").mockReturnValue(randFor(2)); // miss
    const onSpinEnd = vi.fn();
    let sheetOpens = 0;
    render(
      <WheelOfFortune
        onSpinEnd={(r) => {
          onSpinEnd(r);
          if (r.won) sheetOpens += 1;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /spin|돌리기/i }));
    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(onSpinEnd).toHaveBeenCalledTimes(1);
    expect(onSpinEnd).toHaveBeenCalledWith({ won: false, value: 0 });
    expect(sheetOpens).toBe(0);
  });

  it("disabled wheel → onSpinEnd never called", () => {
    vi.spyOn(Math, "random").mockReturnValue(randFor(0));
    const onSpinEnd = vi.fn();
    render(<WheelOfFortune disabled onSpinEnd={onSpinEnd} />);
    fireEvent.click(screen.getByRole("button", { name: /spin|돌리기/i }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onSpinEnd).not.toHaveBeenCalled();
  });
});
