/**
 * HiLo · Stage — props-only render smoke.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Stage } from "../Stage";

function baseProps(overrides: Partial<Parameters<typeof Stage>[0]> = {}) {
  return {
    gameCode: "hilo" as const,
    selection: { startCard: null, guesses: [] },
    bet: null,
    clientSeed: "deadbeef",
    commitment: null,
    verification: null,
    busy: false,
    onClientSeedChange: vi.fn(),
    onSelectionChange: vi.fn(),
    ...overrides,
  };
}

describe("HiLo · Stage", () => {
  it("renders the start-card picker when no startCard", () => {
    render(<Stage {...baseProps()} />);
    expect(screen.getByText("시작 카드를 선택하세요")).toBeInTheDocument();
  });

  it("emits onSelectionChange with startCard index when a rank is picked", () => {
    const props = baseProps();
    render(<Stage {...props} />);
    fireEvent.click(screen.getByText("A"));
    expect(props.onSelectionChange).toHaveBeenCalledWith({
      startCard: 0,
      guesses: [],
    });
  });

  it("renders Higher/Lower buttons once startCard is set", () => {
    render(<Stage {...baseProps({ selection: { startCard: 6, guesses: [] } })} />);
    expect(screen.getByText(/Higher/)).toBeInTheDocument();
    expect(screen.getByText(/Lower/)).toBeInTheDocument();
  });
});
