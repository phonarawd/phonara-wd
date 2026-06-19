import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { toast } from "sonner";

import { VelocityBridgeSheet } from "@/components/earn/VelocityBridgeSheet";
import { DailyQuizMock } from "@/components/earn/micro/DailyQuizMock";

beforeEach(() => {
  window.localStorage.clear();
});

describe("Wave 4R VelocityBridgeSheet", () => {
  it("renders 3 recommendation cards with correct casino hrefs when open", async () => {
    render(
      <VelocityBridgeSheet open={true} onOpenChange={() => {}} source="watch" />,
    );
    await screen.findByTestId("velocity-bridge-sheet");
    const crash = screen.getByTestId("velocity-bridge-rec-crash") as HTMLAnchorElement;
    const plinko = screen.getByTestId("velocity-bridge-rec-plinko") as HTMLAnchorElement;
    const momentum = screen.getByTestId("velocity-bridge-rec-momentum") as HTMLAnchorElement;
    expect(crash.getAttribute("href")).toBe("/casino/crash");
    expect(plinko.getAttribute("href")).toBe("/casino/plinko");
    expect(momentum.getAttribute("href")).toBe("/casino/momentum");
  });

  it("calls onOpenChange(false) when 'Maybe later' is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <VelocityBridgeSheet open={true} onOpenChange={onOpenChange} source="quiz" />,
    );
    fireEvent.click(await screen.findByTestId("velocity-bridge-later"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("DailyQuizMock: wrong answer fires no success toast and does NOT open the sheet", () => {
    const toastSpy = vi.spyOn(toast, "success");
    render(<DailyQuizMock />);
    const buttons = screen.getAllByRole("button");
    // option index 0 = 'a' (wrong)
    fireEvent.click(buttons[0]);
    expect(toastSpy).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("earn.micro.quiz:v1")).toBeNull();
    expect(screen.queryByTestId("velocity-bridge-sheet")).toBeNull();
  });

  it("DailyQuizMock: correct answer fires success toast AND opens the sheet", async () => {
    const toastSpy = vi.spyOn(toast, "success");
    render(<DailyQuizMock />);
    const buttons = screen.getAllByRole("button");
    // option index 1 = 'b' (correct)
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    expect(toastSpy).toHaveBeenCalled();
    expect(window.localStorage.getItem("earn.micro.quiz:v1")).toBe("1");
    expect(await screen.findByTestId("velocity-bridge-sheet")).toBeTruthy();
  });
});
