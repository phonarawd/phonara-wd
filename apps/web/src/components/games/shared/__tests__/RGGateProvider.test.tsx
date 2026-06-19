/**
 * C-2 · RGGateProvider — policy true/false branching.
 *
 * policy returns null  → gate() resolves true, no dialog opened.
 * policy returns reason → gate() resolves false, dialog visible.
 */
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { RGGateProvider, useRGGate } from "../RGGateProvider";

function Harness({ onResult }: { onResult: (ok: boolean) => void }) {
  const { gate } = useRGGate();
  return (
    <button
      data-testid="trigger"
      onClick={async () => {
        const ok = await gate("place_bet");
        onResult(ok);
      }}
    >
      gate
    </button>
  );
}

describe("C-2 · RGGateProvider", () => {
  it("policy null → gate resolves true, dialog stays closed", async () => {
    const onResult = vi.fn();
    render(
      <RGGateProvider policy={async () => null}>
        <Harness onResult={onResult} />
      </RGGateProvider>,
    );
    await act(async () => {
      screen.getByTestId("trigger").click();
    });
    expect(onResult).toHaveBeenCalledWith(true);
    // No reason copy visible.
    expect(screen.queryByText(/손실 한도/)).toBeNull();
  });

  it("policy reason → gate resolves false and dialog opens", async () => {
    const onResult = vi.fn();
    render(
      <RGGateProvider policy={async () => "daily_loss_limit"}>
        <Harness onResult={onResult} />
      </RGGateProvider>,
    );
    await act(async () => {
      screen.getByTestId("trigger").click();
    });
    expect(onResult).toHaveBeenCalledWith(false);
    expect(screen.getByText(/손실 한도/)).toBeInTheDocument();
  });
});
