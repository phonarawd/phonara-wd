import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeAttendancePageControllerView } from '@/features/earn/use-home-attendance-page-controller';
import { I18nProvider } from '@/product/i18n';
import { HomeAttendancePage } from '@/product/surfaces/home/home-attendance-page';

const useHomeAttendancePageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-home-attendance-page-controller', () => ({
  useHomeAttendancePageController: useHomeAttendancePageControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<HomeAttendancePageControllerView> = {},
): HomeAttendancePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    attendance: {
      used: 0,
      max: 1,
      remaining: 1,
      cycleDay: 2,
      todayRewardPhon: '1000.000000',
      resetsAt: null,
    },
    streak: {
      currentStreak: 2,
      longestStreak: 5,
      totalPhonEarned: '3000.000000',
      lastClaimedDate: '2026-07-04',
    },
    cycleDays: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      rewardLabel: '+1,000P',
      state: index === 1 ? 'current' : index < 1 ? 'completed' : 'upcoming',
    })),
    routineSteps: [
      {
        id: 'attendance',
        labelKey: 'earn.routine.step.attendance',
        route: '/home/attendance',
        durationKey: 'earn.routine.duration.attendance',
        done: false,
        current: true,
      },
    ],
    todayRewardLabel: '+1,000P',
    nextRewardLabel: '+1,000P',
    totalEarnedLabel: '+3,000P',
    claimState: 'reward_pending',
    claiming: false,
    showStreakMilestone: false,
    claimAttendance: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: HomeAttendancePageControllerView = makeEngine()) {
  useHomeAttendancePageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <HomeAttendancePage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useHomeAttendancePageControllerMock.mockReset();
});

describe('HomeAttendancePage', () => {
  it('renders attendance hub with streak cycle and claim CTA', () => {
    renderPage();
    expect(screen.getByTestId('home-attendance-page')).toBeInTheDocument();
    expect(screen.getByText('earn.attendance.title')).toBeInTheDocument();
    expect(screen.getByTestId('home-attendance-cycle')).toBeInTheDocument();
    expect(screen.getByTestId('home-attendance-claim')).toBeInTheDocument();
    expect(screen.getByTestId('routine-card')).toBeInTheDocument();
  });

  it('shows loading skeleton while controller loads', () => {
    renderPage(makeEngine({ loading: true }));
    expect(screen.getByTestId('home-attendance-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('home-attendance-page')).not.toBeInTheDocument();
  });

  it('wires claim button to controller claimAttendance', () => {
    const claimAttendance = vi.fn();
    renderPage(makeEngine({ claimAttendance }));
    fireEvent.click(screen.getByTestId('home-attendance-claim'));
    expect(claimAttendance).toHaveBeenCalledTimes(1);
  });

  it('hides claim CTA when attendance already completed today', () => {
    renderPage(
      makeEngine({
        claimState: 'completed',
        attendance: {
          used: 1,
          max: 1,
          remaining: 0,
          cycleDay: 2,
          todayRewardPhon: '1000.000000',
          resetsAt: null,
        },
      }),
    );
    expect(screen.queryByTestId('home-attendance-claim')).not.toBeInTheDocument();
  });
});
