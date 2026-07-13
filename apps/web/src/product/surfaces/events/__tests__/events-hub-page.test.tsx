import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EventsHubPageControllerView } from '@/features/earn/use-events-hub-page-controller';
import { I18nProvider } from '@/product/i18n';
import { EventsHubPage } from '@/product/surfaces/events/events-hub-page';

const useEventsHubPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-events-hub-page-controller', () => ({
  useEventsHubPageController: useEventsHubPageControllerMock,
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
  overrides: Partial<EventsHubPageControllerView> = {},
): EventsHubPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    status: {
      authenticated: true,
      globalTotal: 1000,
      globalUntilJackpot: 10,
      tapCount: 1,
      dailyCap: 10,
      remaining: 9,
      earnedPhonToday: '1.000000',
      maxPhonTodayEstimate: '9.000000',
      goldenHourActive: false,
      goldenHourMinutesLeft: null,
      tier: 'bronze',
      systemHalted: false,
    },
    seasonCards: [
      {
        id: 'roulette',
        titleKey: 'events.card.roulette.title',
        bodyKey: 'events.card.roulette.body',
        route: '/earn/play',
      },
    ],
    tapBlocked: false,
    tapping: false,
    remainingLabel: '1/10',
    earnedTodayLabel: '+1P',
    globalTotalLabel: '1000',
    tapGoldenEarth: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: EventsHubPageControllerView = makeEngine()) {
  useEventsHubPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <EventsHubPage />
    </I18nProvider>,
  );
}

describe('EventsHubPage', () => {
  beforeEach(() => {
    useEventsHubPageControllerMock.mockReset();
  });

  it('renders golden earth tap and season cards', () => {
    const tapGoldenEarth = vi.fn();
    renderPage(makeEngine({ tapGoldenEarth }));
    expect(screen.getByTestId('events-hub-page')).toBeTruthy();
    expect(screen.getByTestId('events-golden-earth-tap')).toBeTruthy();
    expect(screen.getByTestId('events-season-card-roulette')).toHaveAttribute('href', '/earn/play');
    fireEvent.click(screen.getByTestId('events-golden-earth-tap'));
    expect(tapGoldenEarth).toHaveBeenCalledTimes(1);
  });
});
