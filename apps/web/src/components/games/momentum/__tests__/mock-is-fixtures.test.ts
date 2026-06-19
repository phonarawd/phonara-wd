/**
 * Momentum · mock-is-fixtures (LAW 1 proof).
 *
 * Reads fixtures.ts + useMomentumMock.ts as SOURCE TEXT and asserts
 * the mock contains no outcome computation: no Math.random, no
 * Math.floor/max/min, no arithmetic on result fields (comboMultiplier,
 * totalMultiplier, comboAfter, won, cashedOut).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURES_SRC = readFileSync(
  join(__dirname, "..", "fixtures.ts"),
  "utf8",
);
const HOOK_SRC = readFileSync(
  join(__dirname, "..", "useMomentumMock.ts"),
  "utf8",
);

const RESULT_FIELDS = ["comboMultiplier", "totalMultiplier", "comboAfter", "won", "cashedOut"];

// Strip block- and line-comments so prose never trips code-only regexes.
// Every assertion below runs against the STRIPPED source — no check is
// loosened; the input is just narrowed to executable code.
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const FIXTURES_CODE = stripComments(FIXTURES_SRC);
const HOOK_CODE = stripComments(HOOK_SRC);

describe("Momentum · mock-is-fixtures (LAW 1)", () => {
  it("fixtures.ts contains no Math.* and no arithmetic operators", () => {
    expect(FIXTURES_CODE).not.toMatch(/Math\./);
    // No + - * arithmetic outside of string content.
    expect(FIXTURES_CODE).not.toMatch(/[)\d]\s*[+\-*]\s*[( \d]/);
  });

  it("useMomentumMock.ts contains no Math.random / Math.floor / Math.max / Math.min", () => {
    expect(HOOK_CODE).not.toMatch(/Math\.random/);
    expect(HOOK_CODE).not.toMatch(/Math\.floor/);
    expect(HOOK_CODE).not.toMatch(/Math\.max/);
    expect(HOOK_CODE).not.toMatch(/Math\.min/);
  });

  it("useMomentumMock.ts performs no arithmetic on result fields", () => {
    for (const f of RESULT_FIELDS) {
      const arith = new RegExp(`result\\.${f}\\s*[+\\-*/]`);
      expect(HOOK_CODE).not.toMatch(arith);
      const rev = new RegExp(`[+\\-*/]\\s*result\\.${f}`);
      expect(HOOK_CODE).not.toMatch(rev);
    }
  });

  it("useMomentumMock.ts performs no comparison against result fields", () => {
    for (const f of RESULT_FIELDS) {
      const cmp = new RegExp(`result\\.${f}\\s*(===|!==|==|!=|>=|<=|>|<)`);
      expect(HOOK_CODE).not.toMatch(cmp);
    }
  });
});
