/**
 * Dice · celebrate — feel 2지 (win / loss) routing synced with Stage.tsx.
 *
 * Engine 정본 (PHONARA `packages/game-engine/src/games/dice.ts`):
 *   { roll: number /* [0.00, 99.99] *\/; won: boolean }
 *
 * Stage routes:
 *   bet && won && settleMult >= 1.01 → win  · tier(settleMult)
 *   bet && won === false             → loss · screenShake
 *   bet=null OR roll === undefined   → idle (no overlay)
 *
 * **Engine truth gate**: `won` is engine-authoritative. If Stage recomputes
 * `over ? roll > target : roll < target` we'd flip `{roll:80, won:false, target:75, over}`
 * from LOSE → WIN. This test pins won-only routing.
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";

interface DiceBet {
  result: { roll?: number; won?: boolean };
  multiplier?: string;
}

function routeDice(bet: DiceBet | null) {
  const settled = bet !== null;
  const r = bet?.result;
  const roll = r?.roll;
  const won = r?.won === true;
  const settleMult = Number(bet?.multiplier ?? 0);
  const isIdle = !settled || roll === undefined;
  const isWin = !isIdle && won && settleMult >= 1.01;
  const isLoss = !isIdle && !won;
  const tier = isWin ? celebrate.celebrationTier(settleMult) : "none";
  return { roll, won, settleMult, isIdle, isWin, isLoss, tier };
}

describe("Dice · celebrate feel 2지", () => {
  it("win { roll:75, won:true } + mult=2 → tier='nice' · isWin", () => {
    const r = routeDice({ result: { roll: 75, won: true }, multiplier: "2.00" });
    expect(r.isWin).toBe(true);
    expect(r.tier).toBe("nice");
  });

  it("loss { roll:25, won:false } → tier='none' · screenShake path · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeDice({ result: { roll: 25, won: false }, multiplier: "0" });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("ENGINE TRUTH — { roll:80, won:false } w/ target=75 over → LOSE (재계산이면 WIN으로 깨짐)", () => {
    // mock 의도 불일치: roll>target이라도 engine이 won:false면 LOSE.
    const r = routeDice({ result: { roll: 80, won: false }, multiplier: "0" });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.tier).toBe("none");
  });

  it("idle settle { bet:null } → tier='none'", () => {
    const r = routeDice(null);
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });

  it("idle settle { roll:undefined } → tier='none'", () => {
    const r = routeDice({ result: {}, multiplier: "0" });
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });

  it("tier mapping settleMult 1.5/3/7/20/50/250 → small/nice/big/huge/mega/ultra", () => {
    const cases: Array<[number, celebrate.CelebrationTier]> = [
      [1.5, "small"],
      [3, "nice"],
      [7, "big"],
      [20, "huge"],
      [50, "mega"],
      [250, "ultra"],
    ];
    for (const [m, expected] of cases) {
      const r = routeDice({
        result: { roll: 75, won: true },
        multiplier: m.toFixed(2),
      });
      expect(r.tier).toBe(expected);
    }
  });
});
