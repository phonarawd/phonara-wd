/**
 * Roulette · celebrate — engine truth regression gate.
 *
 * PHONARA `packages/game-engine/src/games/roulette.ts` 정본:
 *   { winningNumber: number /* [0,36] *\/, totalMultiplier: number }
 *
 * UI 진실: `Number(result.totalMultiplier) > 0`. UI에서 bets[] × winningNumber
 * 재계산 금지 — 만약 그렇게 하면 `{winningNumber:17, totalMultiplier:0}` +
 * straight/17 베팅이 WIN으로 깨짐 (engine truth = LOSE).
 *
 * Adapter normalize: SQL NUMERIC → JSON number지만 paste 시 string로 전달될
 * 수 있으므로 string "0"도 LOSE로 처리되어야 함 (회귀 가드).
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";

interface RouletteBetMock {
  result: { winningNumber?: number; totalMultiplier?: number | string };
  multiplier?: string;
}

function routeRoulette(bet: RouletteBetMock | null) {
  const settled = bet !== null;
  const r = bet?.result;
  const winning = r?.winningNumber;
  const rawMult = r?.totalMultiplier;
  const settleMult = rawMult != null ? Number(rawMult) : 0;
  const won = rawMult != null ? settleMult > 0 : null;
  const isIdle = !settled || winning === undefined;
  const isWin = !isIdle && won === true && settleMult >= 1.01;
  const isLoss = !isIdle && won === false;
  const tier = isWin ? celebrate.celebrationTier(settleMult) : "none";
  return { winning, won, settleMult, isIdle, isWin, isLoss, tier };
}

describe("Roulette · celebrate feel 2지 (engine truth)", () => {
  it("ENGINE TRUTH — { winningNumber:17, totalMultiplier:0 } + straight/17 → LOSE (재계산이면 WIN으로 깨짐)", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    // mock 의도: 베팅은 17 straight지만 totalMultiplier=0 이면 LOSE.
    const r = routeRoulette({
      result: { winningNumber: 17, totalMultiplier: 0 },
      multiplier: "0",
    });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("ADAPTER NORMALIZE — { winningNumber:17, totalMultiplier:\"0\" } → LOSE (string 회귀 가드)", () => {
    const r = routeRoulette({
      result: { winningNumber: 17, totalMultiplier: "0" },
      multiplier: "0",
    });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.settleMult).toBe(0);
  });

  it("WIN jackpot — { winningNumber:0, totalMultiplier:36 } + straight/0 full weight → tier='huge'", () => {
    const r = routeRoulette({
      result: { winningNumber: 0, totalMultiplier: 36 },
      multiplier: "36",
    });
    expect(r.isWin).toBe(true);
    expect(r.won).toBe(true);
    expect(r.settleMult).toBe(36);
    // 36 → huge tier per celebrationTier table (<50 ⇒ huge).
    expect(r.tier).toBe("huge");
  });

  it("WIN small — totalMultiplier=1.5 → tier='small'", () => {
    const r = routeRoulette({
      result: { winningNumber: 7, totalMultiplier: 1.5 },
      multiplier: "1.50",
    });
    expect(r.isWin).toBe(true);
    expect(r.tier).toBe("small");
  });

  it("ADAPTER NORMALIZE WIN — totalMultiplier string \"2.00\" → WIN (number/string parity)", () => {
    const r = routeRoulette({
      result: { winningNumber: 7, totalMultiplier: "2.00" },
      multiplier: "2.00",
    });
    expect(r.isWin).toBe(true);
    expect(r.settleMult).toBe(2);
  });

  it("idle { bet:null } → tier='none'", () => {
    const r = routeRoulette(null);
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });

  it("idle { winningNumber:undefined } → tier='none'", () => {
    const r = routeRoulette({ result: {} });
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });
});
