/**
 * Shell bet-confirm adapter — E2E testid contract via @phonara/ui ConfirmDialog.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CasinoMoneyConfirm } from "../casino-money-confirm";

const commitment = {
  round_id: "round-1",
  server_seed_hash: "a".repeat(64),
};

const baseProps = () => ({
  open: true,
  busy: false,
  canConfirm: true,
  title: "Bet confirm",
  description: "Review before placing.",
  confirmLabel: "Place bet",
  cancelLabel: "Cancel",
  processingLabel: "Processing",
  gameLabel: "Game",
  gameValue: "Dice",
  stakeLabel: "Stake",
  stake: "10.000000",
  currency: "PHON" as const,
  clientSeedLabel: "Client seed",
  clientSeed: "deadbeefcafebabe",
  seedHashLabel: "Seed hash",
  commitment,
  waitingLabel: "Waiting",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
});

describe("CasinoMoneyConfirm — E2E testids", () => {
  it("open=false → confirm testids not attached", () => {
    render(<CasinoMoneyConfirm {...baseProps()} open={false} />);
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-cancel")).toBeNull();
  });

  it("open=true → shell exposes casino-bet-confirm-confirm and -cancel", () => {
    const props = baseProps();
    render(<CasinoMoneyConfirm {...props} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("casino-bet-confirm-confirm"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("casino-bet-confirm-cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
