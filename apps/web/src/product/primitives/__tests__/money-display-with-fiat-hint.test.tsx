import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  LOCALE_FIAT_OFF,
  P4_FIAT_MONEY_DISPLAY_HINT_PREREQUISITE_TODO,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { I18nProvider } from '@/product/i18n';
import { formatFiatHintAsOfTime } from '@/product/primitives/lib/fiat-hint-display';
import {
  FiatHintDisclaimer,
  MoneyDisplayWithFiatHint,
  MoneyDisplayWithFiatHintSlot,
} from '@/product/primitives/money-display-with-fiat-hint';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
} as const;

function renderWithI18n(ui: ReactElement, locale: 'ko' | 'en' = 'ko') {
  window.localStorage.setItem('phonara.locale', locale);
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('formatFiatHintAsOfTime', () => {
  it('formats capturedAt for ko and en locales', () => {
    const capturedAt = '2026-07-06T10:00:00.000Z';
    expect(formatFiatHintAsOfTime(capturedAt, 'ko-KR')).toMatch(/7/);
    expect(formatFiatHintAsOfTime(capturedAt, 'en-US')).toMatch(/Jul|AM|PM|\d/);
    expect(formatFiatHintAsOfTime('', 'ko')).toBeNull();
    expect(formatFiatHintAsOfTime('invalid', 'ko')).toBeNull();
  });
});

describe('money-display-with-fiat-hint §13.1.4 Fiat#5', () => {
  it('registers Fiat#5 todo with Fiat#4 prerequisite', () => {
    expect(P4_FIAT_MONEY_DISPLAY_HINT_TODO).toBe('p4-fiat-money-display-hint');
    expect(P4_FIAT_MONEY_DISPLAY_HINT_PREREQUISITE_TODO).toBe('p4-fiat-hint-display-contract');
  });

  it('renders primary MoneyDisplay and secondary fiat hint', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', SAMPLE_SNAPSHOT);

    const { container } = renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
    );

    expect(container.querySelector('[data-money-display]')).not.toBeNull();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('≈ ₩14,500')).toBeInTheDocument();
    const hintNode =
      container.querySelector('[data-fiat-hint]') ?? container.querySelector('[aria-label]');
    expect(hintNode).toHaveAttribute('data-display-only', 'true');
  });

  it('hides secondary line when fiat hint is disabled (locale OFF)', () => {
    const fiatHint = toFiatHint('10', 'USDT', LOCALE_FIAT_OFF, SAMPLE_SNAPSHOT);

    const { container } = renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
    );

    expect(container.querySelector('[data-fiat-hint]')).toBeNull();
    expect(container.querySelector('[data-fiat-hint-stale]')).toBeNull();
  });

  it('shows stale badge when rate snapshot is stale', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', { ...SAMPLE_SNAPSHOT, stale: true });

    renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
    );

    expect(screen.getByText('환율 갱신 중')).toBeInTheDocument();
  });

  it('shows unavailable copy when rate is missing', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', null);

    renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
    );

    expect(screen.getByText('환율 확인 불가')).toBeInTheDocument();
    expect(screen.queryByText('≈ ₩14,500')).not.toBeInTheDocument();
  });

  it('anchors trade.fiatHint.asOf on hint trigger aria-label', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', SAMPLE_SNAPSHOT);

    renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
    );

    const trigger = screen.getByRole('button', { name: /기준 시각/ });
    expect(trigger.getAttribute('aria-label')).toMatch(/기준 시각/);
    expect(trigger.getAttribute('aria-label')).toMatch(/7월|PM|AM|\d/);
  });

  it('renders en unavailable and disclaimer copy from i18n catalog', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', null);

    renderWithI18n(
      <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />,
      'en',
    );

    expect(screen.getByText('Rate unavailable')).toBeInTheDocument();

    renderWithI18n(<FiatHintDisclaimer />, 'en');
    expect(
      screen.getByText('Fiat amounts are for reference only. Settlement uses PHON/USDT.'),
    ).toBeInTheDocument();
  });

  it('renders FiatHintDisclaimer once via slot wrapper', () => {
    const fiatHint = toFiatHint('10', 'USDT', 'KRW', SAMPLE_SNAPSHOT);

    const { container } = renderWithI18n(
      <MoneyDisplayWithFiatHintSlot disclaimerSlot={<FiatHintDisclaimer />}>
        <MoneyDisplayWithFiatHint amount="10.000000" currency="USDT" fiatHint={fiatHint} />
      </MoneyDisplayWithFiatHintSlot>,
    );

    expect(container.querySelector('[data-fiat-hint-slot]')).not.toBeNull();
    expect(container.querySelectorAll('[data-fiat-hint-disclaimer]')).toHaveLength(1);
    expect(
      screen.getByText('원화 표시는 참고용이며, 거래·정산은 PHON/USDT 기준으로 처리됩니다.'),
    ).toBeInTheDocument();
  });
});
