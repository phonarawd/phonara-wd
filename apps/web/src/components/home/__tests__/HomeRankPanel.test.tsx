import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HomeRankPanel } from "../panels/HomeRankPanel";
import { HomeTabContext, type HomeRankSub } from "../HomeTabContext";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

function Harness() {
  const [rankSub, setRankSub] = useState<HomeRankSub>("weekly");
  return (
    <HomeTabContext.Provider value={{ setActive: () => {}, setRankSub, rankSub }}>
      <HomeRankPanel />
    </HomeTabContext.Provider>
  );
}

describe("HomeRankPanel (L1-16b relocation)", () => {
  beforeEach(() => cleanup());

  it("renders full TierProgressPanel when VIP subtab is active", () => {
    const { container } = render(<Harness />);
    const vip = screen
      .getAllByRole("tab")
      .find((t) => t.getAttribute("data-subtab-id") === "vip")!;
    fireEvent.click(vip);
    expect(container.querySelector('[data-testid="fomo-tier-panel"]')).toBeTruthy();
  });
});
