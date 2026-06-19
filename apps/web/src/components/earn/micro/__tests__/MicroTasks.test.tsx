import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toaster, toast } from "sonner";

import { WatchAdMock } from "@/components/earn/micro/WatchAdMock";
import { SurveyMock } from "@/components/earn/micro/SurveyMock";
import { DailyQuizMock } from "@/components/earn/micro/DailyQuizMock";
import { ReferralQuickCard } from "@/components/earn/ReferralQuickCard";
import {
  MissionChecklist,
  type MissionItem,
} from "@/components/earn/MissionChecklist";

// Wave 3R — MicroTasks smoke + MissionChecklist regression
beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("Wave 3R MicroTasks", () => {
  it("WatchAdMock: 5s countdown completes and persists flag", () => {
    vi.useFakeTimers();
    const toastSpy = vi.spyOn(toast, "success");
    render(<WatchAdMock />);
    fireEvent.click(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(toastSpy).toHaveBeenCalled();
    expect(window.localStorage.getItem("earn.micro.watch:v1")).toBe("1");
    vi.useRealTimers();
  });

  it("SurveyMock: submit after answering all 3 questions fires toast", () => {
    const toastSpy = vi.spyOn(toast, "success");
    render(<SurveyMock />);
    const radios = screen.getAllByRole("radio");
    // pick first option of each of the 3 questions
    fireEvent.click(radios[0]);
    fireEvent.click(radios[2]);
    fireEvent.click(radios[4]);
    fireEvent.click(screen.getByRole("button"));
    expect(toastSpy).toHaveBeenCalled();
    expect(window.localStorage.getItem("earn.micro.survey:v1")).toBe("1");
  });

  it("DailyQuizMock: correct answer fires toast and persists flag", () => {
    const toastSpy = vi.spyOn(toast, "success");
    render(<DailyQuizMock />);
    const buttons = screen.getAllByRole("button");
    // 3 option buttons; correct = index 1 ("b")
    fireEvent.click(buttons[1]);
    expect(toastSpy).toHaveBeenCalled();
    expect(window.localStorage.getItem("earn.micro.quiz:v1")).toBe("1");
  });

  it("ReferralQuickCard: kakao label and disclosure visible", () => {
    render(
      <ReferralQuickCard
        code="PHN1234"
        inviteUrl="https://phonara.example/i/PHN1234"
        progressLabel="Friends 0/5 invited"
        rewardLabel="+10,000P / friend"
      />,
    );
    expect(screen.getByText(/카카오로 공유/)).toBeTruthy();
    expect(screen.getByText(/카카오톡 SDK 미연동/)).toBeTruthy();
  });

  it("MissionChecklist regression: legacy row claim path unchanged", () => {
    const onClaim = vi.fn();
    const items: MissionItem[] = [
      {
        id: "daily-todaySpin",
        titleKey: "mission.daily.todaySpin",
        rewardLabel: "+200P",
        progressLabel: "0 / 1",
        status: "claimable",
        lane: "daily",
      },
    ];
    render(
      <>
        <Toaster />
        <MissionChecklist items={items} onClaim={onClaim} />
      </>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).toHaveBeenCalledWith("daily-todaySpin");
  });
});
