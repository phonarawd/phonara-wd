import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { t, setLocale, getLocale, type Locale } from "@/i18n";
import { SEARCH_INDEX } from "../casino-search-index";

/**
 * Ensures every ASCII aliasKey in the search index resolves to a non-empty
 * Hangul (or fallback) string under ko locale. This is the contract that
 * keeps Hangul aliases out of the index file while still being matchable.
 */
describe("casino-search-index · i18n alias contract", () => {
  let prev: Locale;
  beforeAll(() => {
    prev = getLocale();
    setLocale("ko");
  });
  afterAll(() => {
    setLocale(prev);
  });

  it("ko locale: crash plane alias resolves to Hangul", () => {
    const v = t("casino.search.alias.crash.plane");
    expect(v).not.toBe("casino.search.alias.crash.plane");
    // Must contain at least one Hangul syllable.
    expect(v).toMatch(/[\uAC00-\uD7A3]/);
  });

  it("every aliasKey resolves to a non-empty string under ko", () => {
    for (const e of SEARCH_INDEX) {
      for (const key of e.aliasKeys) {
        const v = t(key);
        expect(v).not.toBe(key);
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });
});
