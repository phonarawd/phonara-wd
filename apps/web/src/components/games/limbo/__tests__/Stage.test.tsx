/**
 * Limbo · Stage — props-only render smoke + 3구간 feel sanity.
 *
 * Phase 4 v1.3: schema is { resultMultiplier: number; won: boolean }.
 * Visual assertions remain minimal — feel routing has its own
 * `celebrate.test.tsx`.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Stage } from "../Stage";
import type { BetResult } from "@/games/shared/types";

function baseProps(overrides: Partial<Parameters<typeof Stage>[0]> = {}) {
  return {
    gameCode: "limbo" as const,
    selection: { target: "2.00" },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    onClientSeedChange: vi.fn(),
    onSelectionChange: vi.fn(),
    ...overrides,
  };
}

function makeBet(resultMultiplier: number, won: boolean): BetResult {
  return {
    status: "won",
    payout: won ? "20" : "0",
    multiplier: String(resultMultiplier),
    result: { resultMultiplier, won } as unknown as Record<string, unknown>,
  };
}


describe("Limbo · Stage", () => {
  it("renders the multiplier display + target input", () => {
    render(<Stage {...baseProps()} />);
    expect(screen.getByPlaceholderText("2.00")).toBeInTheDocument();
  });

  it("emits onSelectionChange with sanitized string on target edit", () => {
    const props = baseProps();
    render(<Stage {...props} />);
    fireEvent.change(screen.getByPlaceholderText("2.00"), { target: { value: "abc3.50" } });
    expect(props.onSelectionChange).toHaveBeenCalledWith({ target: "3.50" });
  });

  it("renders win color (color-up) for { resultMultiplier: 5, won: true }", () => {
    const { container } = render(<Stage {...baseProps({ bet: makeBet(5, true) })} />);
    expect(container.querySelector(".text-\\(--color-up\\)")).toBeTruthy();
  });

  it("renders loss color (color-down) for realistic miss { resultMultiplier: 2.5, won: false }", () => {
    const { container } = render(<Stage {...baseProps({ bet: makeBet(2.5, false) })} />);
    expect(container.querySelector(".text-\\(--color-down\\)")).toBeTruthy();
  });
});
