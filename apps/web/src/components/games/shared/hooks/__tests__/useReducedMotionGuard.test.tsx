import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotionGuard } from "../useReducedMotionGuard";

function mockMatchMedia(matches: boolean) {
  let handler: ((e: MediaQueryListEvent) => void) | null = null;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: (_: string, h: (e: MediaQueryListEvent) => void) => {
        handler = h;
      },
      removeEventListener: () => {
        handler = null;
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return {
    set: (next: boolean) => handler && handler({ matches: next } as MediaQueryListEvent),
  };
}

describe("useReducedMotionGuard (Zenith §1)", () => {
  it("returns false by default when prefers-reduced-motion not set", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotionGuard());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotionGuard());
    expect(result.current).toBe(true);
  });

  it("reacts to media query changes", () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotionGuard());
    expect(result.current).toBe(false);
    act(() => mm.set(true));
    expect(result.current).toBe(true);
  });
});
