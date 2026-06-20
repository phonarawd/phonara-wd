import { useEffect, useMemo, useState } from "react";

export type SurvivalPhase = "before" | "open" | "closed";

export const SURVIVAL_WINDOW_DEFAULTS = {
  openHour: 7,
  openMinute: 0,
  closeHour: 9,
  closeMinute: 0,
  timeZone: "Asia/Seoul",
} as const;

export type SurvivalWindowConfig = {
  openHour?: number;
  openMinute?: number;
  closeHour?: number;
  closeMinute?: number;
  timeZone?: string;
};

export type SurvivalWindow = {
  phase: SurvivalPhase;
  countdownHours: number;
  countdownMinutes: number;
  endTimeLabel: string;
  statusKey: "earn.survival.window.before" | "earn.survival.window.open" | "earn.survival.window.closed";
};

function getKSTMinutesSinceMidnight(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function getNaturalPhase(
  minutesSinceMidnight: number,
  openMinutes: number,
  closeMinutes: number,
): SurvivalPhase {
  if (minutesSinceMidnight < openMinutes) return "before";
  if (minutesSinceMidnight < closeMinutes) return "open";
  return "closed";
}

function formatEndTime(hour: number, minute: number): string {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${h}:${m}`;
}

function computeCountdown(
  phase: SurvivalPhase,
  minutesSinceMidnight: number,
  openMinutes: number,
  closeMinutes: number,
): { hours: number; minutes: number } {
  if (phase === "before") {
    const remaining = openMinutes - minutesSinceMidnight;
    return { hours: Math.floor(remaining / 60), minutes: remaining % 60 };
  }
  if (phase === "open") {
    const remaining = closeMinutes - minutesSinceMidnight;
    return { hours: Math.floor(remaining / 60), minutes: remaining % 60 };
  }
  const untilMidnight = 24 * 60 - minutesSinceMidnight;
  const untilOpen = untilMidnight + openMinutes;
  return { hours: Math.floor(untilOpen / 60), minutes: untilOpen % 60 };
}

export function useSurvivalWindow(
  config: SurvivalWindowConfig = {},
  forcePhase?: SurvivalPhase,
): SurvivalWindow {
  const openHour = config.openHour ?? SURVIVAL_WINDOW_DEFAULTS.openHour;
  const openMinute = config.openMinute ?? SURVIVAL_WINDOW_DEFAULTS.openMinute;
  const closeHour = config.closeHour ?? SURVIVAL_WINDOW_DEFAULTS.closeHour;
  const closeMinute = config.closeMinute ?? SURVIVAL_WINDOW_DEFAULTS.closeMinute;
  const timeZone = config.timeZone ?? SURVIVAL_WINDOW_DEFAULTS.timeZone;

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  const endTimeLabel = formatEndTime(closeHour, closeMinute);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (forcePhase) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [forcePhase]);

  return useMemo(() => {
    const now = new Date();
    const mins = getKSTMinutesSinceMidnight(now, timeZone);
    const naturalPhase = getNaturalPhase(mins, openMinutes, closeMinutes);
    const phase = forcePhase ?? naturalPhase;
    const { hours, minutes } = computeCountdown(phase, mins, openMinutes, closeMinutes);

    const statusKey =
      phase === "before"
        ? "earn.survival.window.before"
        : phase === "open"
          ? "earn.survival.window.open"
          : "earn.survival.window.closed";

    return {
      phase,
      countdownHours: hours,
      countdownMinutes: minutes,
      endTimeLabel,
      statusKey,
    };
  }, [forcePhase, openMinutes, closeMinutes, endTimeLabel, timeZone, tick]);
}
