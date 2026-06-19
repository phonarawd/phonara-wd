import { describe, it, expect } from "vitest";
import {
  SEARCH_INDEX,
  normalize,
  CATEGORY_ORDER,
} from "../casino-search-index";

describe("casino-search-index", () => {
  it("contains all 12 games and ASCII-only aliasKeys", () => {
    expect(SEARCH_INDEX).toHaveLength(12);
    for (const e of SEARCH_INDEX) {
      for (const key of e.aliasKeys) {
        expect(key).toMatch(/^[\x20-\x7e]+$/);
      }
    }
  });

  it("matches via ASCII alias (krash → crash)", () => {
    const crash = SEARCH_INDEX.find((e) => e.id === "crash")!;
    const aliasBlob = crash.asciiAliases.join(" ").toLowerCase();
    expect(aliasBlob).toContain("krash");
    const hits = SEARCH_INDEX.filter((e) =>
      e.asciiAliases.some((a) => normalize(a).includes(normalize("krash"))),
    );
    expect(hits.map((h) => h.id)).toEqual(["crash"]);
  });

  it("category membership: crash ∈ {crash, hot, originals, high-rtp}", () => {
    const crash = SEARCH_INDEX.find((e) => e.id === "crash")!;
    expect(crash.categories).toEqual(
      expect.arrayContaining(["crash", "hot", "originals", "high-rtp"]),
    );
    expect(CATEGORY_ORDER[0]).toBe("all");
  });
});
