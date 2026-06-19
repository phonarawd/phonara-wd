/**
 * Blackjack · celebrate — engine truth regression gate.
 *
 * PHONARA `packages/game-engine/src/games/blackjack.ts` 정본:
 *   { totalMultiplier: number }   (SQL NUMERIC → string on wire)
 *
 * UI 진실: `Number(result.totalMultiplier)` 3-state
 *   - >= 1.01 → WIN (juice + tier)
 *   - === 1   → PUSH (neutral · no juice / no shake)
 *   - <  1    → LOSE (shake)
 *
 * 카드 합으로 WIN/LOSE 재계산 금지 — 만약 그렇게 하면 push(1.00)와 natural(2.50)이 깨짐.
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";

interface BlackjackBetMock {
  result: { totalMultiplier?: number | string };
  multiplier?: string;
}

function routeBlackjack(bet: BlackjackBetMock | null) {
  const settled = bet !== null;
  const raw = bet?.result?.totalMultiplier;
  const settleMult = raw != null ? Number(raw) : 0;
  const isIdle = !settled || raw === undefined;
  const isWin = !isIdle && settleMult >= 1.01;
  const isPush = !isIdle && settleMult === 1;
  const isLoss = !isIdle && settleMult < 1;
  const tier = isWin ? celebrate.celebrationTier(settleMult) : "none";
  return { settleMult, isIdle, isWin, isPush, isLoss, tier };
}

describe("Blackjack · celebrate feel 3-state (engine truth)", () => {
  it("LOSE — totalMultiplier '0.00' → tier='none', no juice", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeBlackjack({ result: { totalMultiplier: "0.00" } });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.isPush).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("PUSH — totalMultiplier '1.00' (push) → neutral, NOT WIN, NOT LOSE", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeBlackjack({ result: { totalMultiplier: "1.00" } });
    expect(r.isPush).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.isLoss).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("WIN huge — totalMultiplier '2.00' → tier='nice', juice", () => {
    const r = routeBlackjack({ result: { totalMultiplier: "2.00" } });
    expect(r.isWin).toBe(true);
    expect(r.settleMult).toBe(2);
    // 2.0 → nice (per celebrationTier: <5 → nice; <2 → small).
    expect(r.tier).toBe("nice");
  });

  it("NATURAL — totalMultiplier '2.500000' (cap) → WIN, tier='nice'", () => {
    const r = routeBlackjack({ result: { totalMultiplier: "2.500000" } });
    expect(r.isWin).toBe(true);
    expect(r.settleMult >= 1.01).toBe(true);
    expect(r.settleMult).toBe(2.5);
    expect(r.tier).toBe("nice");
  });

  it("ADAPTER NORMALIZE — totalMultiplier number 2 → WIN (number/string parity)", () => {
    const r = routeBlackjack({ result: { totalMultiplier: 2 } });
    expect(r.isWin).toBe(true);
    expect(r.settleMult).toBe(2);
  });

  it("idle { bet:null } → tier='none'", () => {
    const r = routeBlackjack(null);
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });
});
