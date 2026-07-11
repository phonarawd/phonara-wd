import axe from 'axe-core';
import { type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messages, translate } from '@phonara/i18n';

import type { EarnHomePageControllerView } from '@/features/earn/use-earn-home-page-controller';
import {
  P13_SOFT_LAUNCH_LOCALES,
  P13_SOFT_LAUNCH_VIEWPORT_WIDTHS,
} from '@/domain/p13-soft-launch-display-contract';
import { I18nProvider } from '@/product/i18n';
import { EarnHomePage } from '@/product/surfaces/home/earn-home-page';
import { InstallPage } from '@/product/surfaces/install/install-page';

const useEarnHomePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());
const useInstallPromptMock = vi.hoisted(() =>
  vi.fn(() => ({
    canPrompt: false,
    isInstalled: false,
    promptInstall: vi.fn(async () => 'dismissed' as const),
  })),
);

vi.mock('@/features/earn/use-earn-home-page-controller', () => ({
  useEarnHomePageController: useEarnHomePageControllerMock,
}));

vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
}));

vi.mock('@/features/pwa/install-prompt-context', () => ({
  useInstallPrompt: useInstallPromptMock,
}));

vi.mock('@/product/surfaces/landing/live-activity-ticker', () => ({
  LiveActivityTicker: () => <div data-testid="landing-activity-ticker-mock" />,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<EarnHomePageControllerView> = {},
): EarnHomePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    tierProgress: {
      tier: 'silver',
      xp: 12000,
      nextTier: 'gold',
      nextTierXp: 25000,
      progressPercent: 35,
      atMaxTier: false,
    },
    catalogRewardsLabel: '+12,500P',
    wallet: { phonBalanceLabel: '+2,500P', discountTickets: 0, freeTradeTickets: 0 },
    season: { id: 1, percent: 62, daysLeft: 9 },
    launchSlots: { filled: 12, total: 1000 },
    cooldown: { active: false, reasonKey: null },
    missionsInProgress: 2,
    attendanceRewardLabel: '+1,000P',
    rouletteRemaining: 2,
    rouletteMax: 2,
    goldenEarthRemaining: 5,
    nextAction: {
      kind: 'attendance',
      titleKey: 'earn.home.todayOpportunity.attendance',
      bodyKey: 'earn.attendance.head.desc',
      ctaKey: 'earn.attendance.cta',
      route: '/home/attendance',
    },
    missionPreviews: [],
    entryCards: [],
    useAmbientTicker: false,
    rewardTicketsIssuanceNoteKey: null,
    ...overrides,
  };
}

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  useEarnHomePageControllerMock.mockReset();
  useEarnFiatHintMock.mockReset();
  useEarnHomePageControllerMock.mockReturnValue(makeEngine());
  useEarnFiatHintMock.mockReturnValue({
    targetFiat: 'OFF' as const,
    showDisclaimer: false,
    hintFor: () => ({
      displayOnly: true as const,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON',
    }),
  });
});

describe('p13-soft-launch-qa · viewport · axe · ko/en (#233)', () => {
  it.each(P13_SOFT_LAUNCH_VIEWPORT_WIDTHS)(
    'renders EarnHomePage at %ipx without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<EarnHomePage />);
      expect(screen.getByTestId('earn-home-page')).toBeInTheDocument();
    },
  );

  it.each(P13_SOFT_LAUNCH_VIEWPORT_WIDTHS)(
    'renders InstallPage at %ipx without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<InstallPage />);
      expect(screen.getByTestId('install-page')).toBeInTheDocument();
    },
  );

  it('EarnHomePage has axe critical 0', async () => {
    const { container } = wrap(<EarnHomePage />);
    await expectAxeCriticalZero(container);
  });

  it('InstallPage has axe critical 0', async () => {
    const { container } = wrap(<InstallPage />);
    await expectAxeCriticalZero(container);
  });

  it.each(P13_SOFT_LAUNCH_LOCALES)(
    'locale %s Soft Launch anchors resolve without cross-locale Hangul leak in en',
    (locale) => {
      const catalog = messages[locale] as Record<string, string>;
      expect(catalog['admin.nav.queues']).toBeTruthy();
      expect(catalog['admin.nav.ops']).toBeTruthy();
      expect(translate(locale, 'admin.nav.queues')).toBeTruthy();
      if (locale === 'en') {
        expect(catalog['admin.nav.queues']).not.toMatch(/[\uAC00-\uD7A3]/);
        expect(catalog['admin.nav.ops']).not.toMatch(/[\uAC00-\uD7A3]/);
      }
      if (locale === 'ko') {
        expect(catalog['admin.nav.queues']).toMatch(/[\uAC00-\uD7A3]/);
      }
    },
  );
});
