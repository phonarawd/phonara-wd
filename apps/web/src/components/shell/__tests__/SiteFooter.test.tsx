/**
 * Wave 5R — SiteFooter trust-link wire smoke.
 * Link is mocked to plain <a> so this stays router-free; e2e covers routing.
 * Order LOCKED: signup · about · terms · privacy · responsible-gaming · casino/fairness · support.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { SiteFooter } from "../SiteFooter";

describe("Wave 5R SiteFooter trust links", () => {
  it("renders 7 nav links in locked order with fairness + support appended at tail", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation");
    const links = nav.querySelectorAll("a");
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/signup",
      "/about",
      "/terms",
      "/privacy",
      "/responsible-gaming",
      "/casino/fairness",
      "/support",
    ]);
  });

  it("preserves existing 5 links (no regression)", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation");
    const hrefs = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    for (const href of [
      "/signup",
      "/about",
      "/terms",
      "/privacy",
      "/responsible-gaming",
    ]) {
      expect(hrefs).toContain(href);
    }
  });
});
