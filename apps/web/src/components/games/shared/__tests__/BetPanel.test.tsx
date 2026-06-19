import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BetPanel } from "../BetPanel";

const noop = () => {};

function setup(overrides: Partial<React.ComponentProps<typeof BetPanel>> = {}) {
  const onPrimary = vi.fn();
  const utils = render(
    <BetPanel
      stake="1.00"
      currency="PHON"
      availableBalance="100"
      busy={false}
      ready={false}
      primaryLabel="베팅"
      secondaryLabel="라운드 준비"
      onStakeChange={noop}
      onCurrencyChange={noop}
      onPrimary={onPrimary}
      onSecondary={noop}
      {...overrides}
    />,
  );
  return { ...utils, onPrimary };
}

describe("BetPanel (Phase 1 export contract)", () => {
  it("renders canonical casino-* testids (no betpanel-*)", () => {
    const { getByTestId, container } = setup();
    expect(getByTestId("casino-stake-input")).toBeTruthy();
    expect(getByTestId("casino-place-bet")).toBeTruthy();
    expect(getByTestId("casino-prepare-hash")).toBeTruthy();
    // betpanel-* is forbidden
    expect(container.querySelector("[data-testid^='betpanel-']")).toBeNull();
  });

  it("renders casino-error when disabledReason set", () => {
    const { getByTestId } = setup({ disabledReason: "잔고 부족" });
    expect(getByTestId("casino-error").textContent).toContain("잔고");
  });

  it("calls onPrimary when primary CTA clicked", () => {
    const { getByTestId, onPrimary } = setup();
    fireEvent.click(getByTestId("casino-place-bet"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
