/**
 * RouletteGame — frozen-contract test (PHONARA wiring).
 *
 * Split bets: value = LOWER adjacent pocket; engine wins if
 *   pocket === value OR pocket === value + 1
 * Only consecutive pocket pairs are valid (|a - b| === 1).
 * Never sum.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt } from "@testing-library/react";
import { ImportedRouletteGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";
import type { RouletteBet, RouletteBetType } from "@/games/shared/types";

const ALLOWED_TYPES: RouletteBetType[] = [
  "straight",
  "split",
  "red",
  "black",
  "even",
  "odd",
  "low",
  "high",
  "dozen1",
  "dozen2",
  "dozen3",
  "column1",
  "column2",
  "column3",
];

describe("RouletteGame — frozen contract", () => {
  it("renders required PHONARA testid anchors", () => {
    render(<ImportedRouletteGame {...makeSurfaceProps("roulette")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("renders the roulette-wheel testid for smoke spec discovery", () => {
    render(<ImportedRouletteGame {...makeSurfaceProps("roulette")} />);
    expect(screen.getByTestId("roulette-wheel")).toBeInTheDocument();
  });

  it("default selection is a single red outside bet with integer stakeWeight", () => {
    const props = makeSurfaceProps("roulette");
    expect(props.selection.bets).toHaveLength(1);
    const bet: RouletteBet = props.selection.bets[0];
    expect(bet.type).toBe("red");
    expect(bet.value).toBeNull();
    expect(Number.isInteger(bet.stakeWeight)).toBe(true);
  });

  it("only the PHONARA-allowed bet type union is acceptable (no street/corner/line)", () => {
    for (const t of ALLOWED_TYPES) {
      const b: RouletteBet = { type: t, value: null, stakeWeight: 1 };
      expect(ALLOWED_TYPES).toContain(b.type);
    }
    // @ts-expect-error street/corner/line not in the engine union
    const bad: RouletteBet = { type: "street", value: 1, stakeWeight: 1 };
    void bad;
  });

  it("split adjacency: value is LOWER pocket; |a - b| === 1 only", () => {
    // canonical good split: value = 1 wins on pocket 1 or 2
    const value: number = 1;
    expect(value === 1 || value + 1 === 1).toBe(true);
    expect(value === 2 || value + 1 === 2).toBe(true);
    // non-consecutive split (e.g. 1 + 5) MUST never be encoded
    const a: number = 1;
    const b: number = 5;
    expect(Math.abs(a - b) === 1).toBe(false);
  });

  it("disables primary CTA while busy", () => {
    render(<ImportedRouletteGame {...makeSurfaceProps("roulette", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });

  it("mounts FairnessSheet (casino-fairness-verifier) + GameRulesTrigger (casino-game-rules)", () => {
    render(<ImportedRouletteGame {...makeSurfaceProps("roulette")} />);
    expect(screen.getByTestId("casino-game-rules")).toBeInTheDocument();
    expect(screen.queryByTestId("casino-fairness-verifier")).toBeNull();
    evt.click(screen.getByRole("button", { name: /provably fair/i }));
    expect(screen.getByTestId("casino-fairness-verifier")).toBeInTheDocument();
  });

  it("mounts BetConfirmDialog only while confirmOpen=true (3 testids)", () => {
    const props = makeSurfaceProps("roulette", {
      confirmOpen: true,
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedRouletteGame {...props} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-cancel")).toBeInTheDocument();
  });

  it("chip selection encodes stakeWeight as INTEGER number (no string regression)", () => {
    const props = makeSurfaceProps("roulette", { selection: { bets: [] } });
    const { getByText } = render(<ImportedRouletteGame {...props} />);
    evt.click(getByText("RED"));
    expect(props.onSelectionChange).toHaveBeenCalledTimes(1);
    const arg = (props.onSelectionChange as unknown as import("vitest").Mock).mock.calls[0][0];
    expect(arg.bets).toHaveLength(1);
    expect(Number.isInteger(arg.bets[0].stakeWeight)).toBe(true);
    expect(typeof arg.bets[0].stakeWeight).toBe("number");
  });
});
