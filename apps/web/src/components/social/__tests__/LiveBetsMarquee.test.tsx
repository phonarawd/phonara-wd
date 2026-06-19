import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveBetsMarquee } from "../LiveBetsMarquee";

describe("LiveBetsMarquee", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders synthetic-tagged nodes when ON", () => {
    render(<LiveBetsMarquee />);
    const el = screen.getByTestId("social-marquee");
    expect(el).toBeTruthy();
    expect(el.getAttribute("data-synthetic")).toBe("true");
  });

  it("DOM removed when preference OFF", () => {
    window.localStorage.setItem("phonara.prefs.socialProof", "off");
    render(<LiveBetsMarquee />);
    expect(screen.queryByTestId("social-marquee")).toBeNull();
  });
});
