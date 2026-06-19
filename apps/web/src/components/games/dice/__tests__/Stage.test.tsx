/**
 * Dice · Stage — props-only render smoke (Phase 5 v1 RED LOCK v3.1).
 *
 * Engine truth: WIN/LOSE label sourced from `result.won` only.
 * Stage MUST NOT recompute `over ? roll > target : roll < target` — this
 * test pins that contract by asserting LOSE when won=false even though
 * the recomputation would yield WIN.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stage } from "../Stage";

const baseProps = {
  gameCode: "dice" as const,
  selection: { target: "50.00", direction: "over" as const },
  bet: null,
  clientSeed: "deadbeef",
  commitment: null,
  verification: null,
  onClientSeedChange: () => {},
  onSelectionChange: () => {},
};

describe("Dice · Stage", () => {
  it("mounts and shows the idle roll placeholder", () => {
    render(<Stage {...baseProps} />);
    expect(screen.getByText(/베팅 대기 중/)).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the OVER/UNDER toggle", () => {
    render(<Stage {...baseProps} />);
    expect(screen.getByRole("button", { name: /OVER/ })).toBeInTheDocument();
  });

  it("WIN label sourced from result.won (engine truth)", () => {
    render(
      <Stage
        {...baseProps}
        bet={{
          status: "won",
          result: { roll: 75, won: true },
          payout: "19.80",
          multiplier: "1.98",
        }}
      />,
    );
    expect(screen.getByText("WIN")).toBeInTheDocument();
  });

  it("LOSE label sourced from result.won even if roll>target (engine truth — no recomputation)", () => {
    // selection: target=50 over. roll=80 would compute WIN locally, but
    // engine says won:false → Stage must trust the engine and render LOSE.
    render(
      <Stage
        {...baseProps}
        bet={{
          status: "won",
          result: { roll: 80, won: false },
          payout: "0",
          multiplier: "0",
        }}
      />,
    );
    expect(screen.getByText("LOSE")).toBeInTheDocument();
  });
});
