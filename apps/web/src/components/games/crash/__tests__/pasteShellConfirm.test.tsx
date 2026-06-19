/**
 * P2.0c #T3 — pasteShellConfirm gate.
 * When true, crash/index.tsx must NOT mount its own BetConfirmDialog.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImportedCrashGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

const baseProps = (overrides: Partial<ImportedGameSurfaceProps<"crash">> = {}): ImportedGameSurfaceProps<"crash"> => ({
  gameCode: "crash",
  currency: "PHON",
  stake: "10",
  selection: { autoCashout: "2.00" },
  clientSeed: "abc",
  availableBalance: "1000",
  commitment: { round_id: "r", server_seed_hash: "h" },
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

describe("P2.0c · crash pasteShellConfirm", () => {
  it("default (no flag) → in-surface BetConfirmDialog mounts when confirmOpen", () => {
    render(<ImportedCrashGame {...baseProps()} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
  });

  it("pasteShellConfirm=true → in-surface BetConfirmDialog NOT mounted", () => {
    render(<ImportedCrashGame {...baseProps({ pasteShellConfirm: true })} />);
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
  });
});
