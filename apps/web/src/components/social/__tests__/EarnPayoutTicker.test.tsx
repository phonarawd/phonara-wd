import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EarnPayoutTicker } from "../EarnPayoutTicker";

describe("EarnPayoutTicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders synthetic ticker when ON", () => {
    render(<EarnPayoutTicker />);
    const el = screen.getByTestId("earn-ticker");
    expect(el.getAttribute("data-synthetic")).toBe("true");
  });

  it("OFF → renders non-empty static fallback (no empty footer)", () => {
    window.localStorage.setItem("phonara.prefs.socialProof", "off");
    render(<EarnPayoutTicker />);
    const el = screen.getByTestId("earn-ticker-off");
    expect(el).toBeTruthy();
    expect(el.textContent && el.textContent.length).toBeGreaterThan(0);
  });
});
