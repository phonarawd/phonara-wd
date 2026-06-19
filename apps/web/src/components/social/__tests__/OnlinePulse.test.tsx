import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnlinePulse } from "../OnlinePulse";

describe("OnlinePulse", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders when ON with data-synthetic", () => {
    render(<OnlinePulse />);
    const el = screen.getByTestId("social-pulse");
    expect(el.getAttribute("data-synthetic")).toBe("true");
  });

  it("DOM removed when OFF", () => {
    window.localStorage.setItem("phonara.prefs.socialProof", "off");
    render(<OnlinePulse />);
    expect(screen.queryByTestId("social-pulse")).toBeNull();
  });
});
