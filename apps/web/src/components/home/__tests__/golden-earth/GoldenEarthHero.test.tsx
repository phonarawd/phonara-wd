import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GoldenEarthHero } from "../../golden-earth/GoldenEarthHero";

vi.mock("@/shims/react-router-dom", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/hooks/useLiveCount", () => ({
  useLiveCount: (seed: number) => seed,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/confetti", () => ({
  celebrate: vi.fn(),
}));

vi.mock("@/components/games/shared/hooks/useReducedMotionGuard", () => ({
  useReducedMotionGuard: () => false,
}));

describe("GoldenEarthHero (L1-20 K1)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders mockNotice and golden-earth-hero", () => {
    render(<GoldenEarthHero mockEvery={5} />);
    expect(screen.getByTestId("golden-earth-hero")).toBeTruthy();
    expect(screen.getByText(/이벤트 연출|Event demo/)).toBeTruthy();
  });

  it("has exactly one data-primary-cta on tap button", () => {
    const { container } = render(<GoldenEarthHero mockEvery={5} />);
    expect(container.querySelectorAll("[data-primary-cta]").length).toBe(1);
    expect(container.querySelector('[data-primary-cta="home-golden-earth-tap"]')).toBeTruthy();
  });

  it("bumps counter on tap", () => {
    render(<GoldenEarthHero mockEvery={5} />);
    const before = screen.getByText(/9,872,34[0-9]|9,872,341/).textContent;
    fireEvent.click(screen.getByRole("button", { name: /황금 지구|golden earth/i }));
    const after = screen.getByText(/9,872,34[0-9]|9,872,342/).textContent;
    expect(before).not.toBe(after);
  });

  it("opens jackpot modal on mockEvery taps", () => {
    render(<GoldenEarthHero mockEvery={5} />);
    const tapBtn = screen.getByRole("button", { name: /황금 지구|golden earth/i });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(tapBtn);
    }
    expect(screen.getByTestId("golden-earth-jackpot-modal")).toBeTruthy();
  });

  it("dismisses jackpot modal", () => {
    render(<GoldenEarthHero mockEvery={5} />);
    const tapBtn = screen.getByRole("button", { name: /황금 지구|golden earth/i });
    for (let i = 0; i < 5; i++) {
      fireEvent.click(tapBtn);
    }
    fireEvent.click(screen.getByRole("button", { name: /확인|Got it/i }));
    expect(screen.queryByTestId("golden-earth-jackpot-modal")).toBeNull();
  });
});
