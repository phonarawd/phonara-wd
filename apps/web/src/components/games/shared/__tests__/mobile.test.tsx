import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as mobile from "../mobile";

describe("G · mobile", () => {
  it("exports LongPressStepper / OneHandSheet / thumbZoneClass", () => {
    expect(typeof mobile.LongPressStepper).toBe("function");
    expect(typeof mobile.OneHandSheet).toBe("function");
    expect(mobile.thumbZoneClass()).toMatch(/fixed/);
  });

  it("LongPressStepper +/- calls onChange", () => {
    const calls: number[] = [];
    const { getByLabelText } = render(
      <mobile.LongPressStepper value={5} step={2} onChange={(n) => calls.push(n)} />,
    );
    fireEvent.pointerDown(getByLabelText("증가"));
    fireEvent.pointerUp(getByLabelText("증가"));
    expect(calls[0]).toBe(7);
  });
});
