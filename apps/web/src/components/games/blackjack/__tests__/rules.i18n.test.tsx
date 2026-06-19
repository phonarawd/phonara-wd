/**
 * Blackjack · rules.i18n — §8-A GREEN catalog parity.
 *
 * Required keys (11): title · summary · payout · fairnessLink · step1..step5 · tip1..tip2.
 * step3 must carry the S17 (Stand-on-17) phrasing.
 */
import { describe, it, expect } from "vitest";
import { ko as koCatalog } from "@/i18n/ko";
import { en as enCatalog } from "@/i18n/en";

const REQUIRED = [
  "title",
  "summary",
  "payout",
  "fairnessLink",
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "tip1",
  "tip2",
];

describe("Blackjack · casino.rules.blackjack i18n (11 keys)", () => {
  for (const lang of [
    { name: "ko", cat: koCatalog as Record<string, string> },
    { name: "en", cat: enCatalog as Record<string, string> },
  ]) {
    for (const k of REQUIRED) {
      it(`[${lang.name}] casino.rules.blackjack.${k} exists`, () => {
        const v = lang.cat[`casino.rules.blackjack.${k}`];
        expect(typeof v).toBe("string");
        expect((v ?? "").length).toBeGreaterThan(0);
      });
    }
  }

  it("[ko] step3 carries S17 phrasing (17 + 멈춤/안 뽑)", () => {
    const s = (koCatalog as Record<string, string>)["casino.rules.blackjack.step3"];
    expect(s).toMatch(/17/);
    expect(/안 뽑|멈춤|더 이상/.test(s)).toBe(true);
  });

  it("[en] step3 carries S17 phrasing (17 + stop/stand)", () => {
    const s = (enCatalog as Record<string, string>)["casino.rules.blackjack.step3"];
    expect(s).toMatch(/17/);
    expect(/stop|stand/i.test(s)).toBe(true);
  });
});
