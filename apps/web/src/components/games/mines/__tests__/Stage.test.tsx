/**
 * Mines · Stage — props-only render smoke + revealedCells accumulator.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Stage } from "../Stage";

function baseProps(overrides: Partial<Parameters<typeof Stage>[0]> = {}) {
  return {
    gameCode: "mines" as const,
    selection: { mineCount: 3, revealedCells: [] as number[] },
    bet: null,
    busy: false,
    clientSeed: "deadbeef",
    commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    verification: null,
    onClientSeedChange: vi.fn(),
    onSelectionChange: vi.fn(),
    ...overrides,
  };
}

describe("Mines · Stage", () => {
  it("renders the 5×5 tile grid", () => {
    render(<Stage {...baseProps()} />);
    for (let i = 1; i <= 25; i++) {
      expect(screen.getByLabelText(`tile ${i}`)).toBeInTheDocument();
    }
  });

  it("appends a tile index to revealedCells on click (one-shot accumulator)", () => {
    const props = baseProps();
    render(<Stage {...props} />);
    fireEvent.click(screen.getByLabelText("tile 1"));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ mineCount: 3, revealedCells: [0] }),
    );
  });

  it("removes a tile on second click (toggle)", () => {
    const props = baseProps({ selection: { mineCount: 3, revealedCells: [4] } });
    render(<Stage {...props} />);
    fireEvent.click(screen.getByLabelText("tile 5"));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ revealedCells: [] }),
    );
  });
});
