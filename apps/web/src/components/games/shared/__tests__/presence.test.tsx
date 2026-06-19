import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import * as presence from "../presence";

describe("C · presence", () => {
  it("exports useMockGhost", () => {
    expect(typeof presence.useMockGhost).toBe("function");
  });

  it("seeds ghost list", () => {
    const { result } = renderHook(() => presence.useMockGhost(3, 9999));
    expect(result.current).toHaveLength(3);
    expect(result.current[0]).toHaveProperty("alias");
  });
});
