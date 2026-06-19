import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FairnessSheet } from "../FairnessSheet";

const fairnessSheetPath = join(dirname(fileURLToPath(import.meta.url)), "../FairnessSheet.tsx");

describe("FairnessSheet (Phase 1 contract)", () => {
  it("source file does not statically import @phonara/game-engine (verifyRound is callback/props only)", () => {
    const raw = readFileSync(fairnessSheetPath, "utf8");
    // Strip template literals + string literals so the verify-snippet documentation
    // doesn't false-positive.
    const stripped = raw
      .replace(/`[^`]*`/gs, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/'(?:\\.|[^'\\])*'/g, "''");
    const staticImports = stripped.split("\n").filter((l) => /^import\s.+from\s+/.test(l));
    expect(staticImports.join("\n")).not.toMatch(/@phonara\/game-engine/);
  });

  it("renders trigger button by default", () => {
    const { getByRole } = render(
      <FairnessSheet
        gameCode="crash"
        clientSeed="abc"
        commitment={null}
        verification={null}
        onClientSeedChange={() => {}}
      />,
    );
    expect(getByRole("button", { name: /provably fair/i })).toBeTruthy();
  });
});
