/**
 * P2.0c #T3 — pasteShellConfirm gate (dice parity with crash).
 * When true, dice surface must NOT mount its own BetConfirmDialog.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImportedDiceGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const baseProps = (
  overrides: Partial<ImportedGameSurfaceProps<"dice">> = {},
): ImportedGameSurfaceProps<"dice"> => ({
  gameCode: "dice",
  currency: "PHON",
  stake: "10",
  selection: { target: "50.00", direction: "over" },
  clientSeed: "abc",
  availableBalance: "1000",
  commitment: { round_id: "r", server_seed_hash: "h".repeat(64) },
  bet: null,
  verification: null,
  recentBets: [],
  busy: false,
  confirmOpen: true,
  onStakeChange: () => {},
  onCurrencyChange: () => {},
  onSelectionChange: () => {},
  onClientSeedChange: () => {},
  onPrepareRound: () => {},
  onOpenBetConfirm: () => {},
  onSubmitBet: () => {},
  onCancelBetConfirm: () => {},
  ...overrides,
});

describe("P2.0c · dice pasteShellConfirm", () => {
  it("default (no flag) → in-surface BetConfirmDialog mounts when confirmOpen", () => {
    render(<ImportedDiceGame {...baseProps()} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
  });

  it("pasteShellConfirm=true → in-surface BetConfirmDialog NOT mounted", () => {
    render(<ImportedDiceGame {...baseProps({ pasteShellConfirm: true })} />);
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
  });
});
