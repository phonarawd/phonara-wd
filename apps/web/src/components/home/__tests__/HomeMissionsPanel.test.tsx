import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HomeMissionsPanel } from "../panels/HomeMissionsPanel";

vi.mock("@/shims/react-router-dom", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/hooks/useLiveCount", () => ({
  useLiveCount: (seed: number) => seed,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/games/shared/hooks/useReducedMotionGuard", () => ({
  useReducedMotionGuard: () => false,
}));

describe("HomeMissionsPanel (L1-21 K3)", () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("renders SurvivalCheckinCard on default checkin subtab", () => {
    render(<HomeMissionsPanel />);
    expect(screen.getByTestId("survival-checkin-card")).toBeTruthy();
  });

  it("does not render survival card on wheel subtab", () => {
    render(<HomeMissionsPanel />);
    const wheelTab = screen.getByRole("tab", { name: /휠|wheel/i });
    fireEvent.click(wheelTab);
    expect(screen.queryByTestId("survival-checkin-card")).toBeNull();
  });

  it("does not render survival card on season subtab", () => {
    render(<HomeMissionsPanel />);
    const seasonTab = screen.getByRole("tab", { name: /시즌|season/i });
    fireEvent.click(seasonTab);
    expect(screen.queryByTestId("survival-checkin-card")).toBeNull();
  });
});
