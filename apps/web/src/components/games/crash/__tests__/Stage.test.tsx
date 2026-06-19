/**
 * Crash · Stage — props-only render smoke.
 *
 * Verifies the extracted Stage mounts without error and exposes the
 * round-status label. Canvas drawing is mocked via vitest.setup.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stage } from "../Stage";

const baseProps = {
  gameCode: "crash" as const,
  selection: { autoCashout: "2.00" },
  bet: null,
  clientSeed: "deadbeef",
  commitment: null,
  verification: null,
  onClientSeedChange: () => {},
};

describe("Crash · Stage", () => {
  it("mounts and renders the idle multiplier label", () => {
    render(<Stage {...baseProps} />);
    expect(screen.getByText(/베팅 후 자동 캐시아웃/)).toBeInTheDocument();
    expect(screen.getByText(/1\.00×/)).toBeInTheDocument();
  });
});
