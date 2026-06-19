import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as theme from "../theme";

describe("E · theme", () => {
  it("exports Neon / Noir / ThemeProvider", () => {
    expect(theme.Neon.name).toBe("neon");
    expect(theme.Noir.name).toBe("noir");
    expect(typeof theme.ThemeProvider).toBe("function");
  });

  it("ThemeProvider renders children", () => {
    const { getByText } = render(
      <theme.ThemeProvider name="noir">
        <span>hello</span>
      </theme.ThemeProvider>,
    );
    expect(getByText("hello")).toBeTruthy();
  });
});
