import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, beforeEach } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { HelpTip } from '@/product/primitives/help-tip';
import { HowItWorks } from '@/product/primitives/how-it-works';
import { howItWorksStepKeys } from '@/product/primitives/lib/how-it-works-keys';
import { statusBadgeVariants } from '@/product/primitives/status-badge';

const EARN_MISSION_STEPS = howItWorksStepKeys('earn.mission');

function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('howItWorksStepKeys', () => {
  it('builds domain step keys for i18n catalog', () => {
    expect(howItWorksStepKeys('wallet.deposit')).toEqual([
      'wallet.deposit.howItWorks.step1',
      'wallet.deposit.howItWorks.step2',
      'wallet.deposit.howItWorks.step3',
    ]);
  });
});

describe('statusBadgeVariants', () => {
  it('maps settled state to success tokens', () => {
    const classes = statusBadgeVariants({ state: 'settled' });
    expect(classes).toContain('bg-success/15');
    expect(classes).toContain('text-success');
  });

  it('maps failed state to danger tokens', () => {
    const classes = statusBadgeVariants({ state: 'failed' });
    expect(classes).toContain('bg-danger/15');
    expect(classes).toContain('text-danger');
  });
});

describe('ToastZone grammar', () => {
  it('keeps warm longer than strict for zone tone contract', async () => {
    const { TOAST_ZONE_DURATION_MS } = await import('@/product/primitives/toast-zone');
    expect(TOAST_ZONE_DURATION_MS.warm).toBeGreaterThan(TOAST_ZONE_DURATION_MS.strict);
    expect(TOAST_ZONE_DURATION_MS.warm).toBe(4500);
    expect(TOAST_ZONE_DURATION_MS.strict).toBe(3500);
  });
});

describe('HowItWorks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('expands on first visit and shows three steps', async () => {
    renderWithI18n(<HowItWorks persistenceId="test-earn-mission" stepKeys={EARN_MISSION_STEPS} />);

    expect(screen.getByText('어떻게 진행되나요?')).toBeInTheDocument();
    expect(screen.getByText('미션 카드에서 참여할 미션을 고르세요')).toBeInTheDocument();
    expect(screen.getByText('조건을 완료하면 보상이 대기 상태로 쌓여요')).toBeInTheDocument();
    expect(screen.getByText('지급 시점에 PHON 지갑으로 들어와요')).toBeInTheDocument();
  });

  it('starts collapsed on revisit', () => {
    window.localStorage.setItem('phonara.howItWorks.test-revisit', 'visited');

    renderWithI18n(<HowItWorks persistenceId="test-revisit" stepKeys={EARN_MISSION_STEPS} />);

    expect(screen.getByText('어떻게 진행되나요?')).toBeInTheDocument();
    expect(screen.queryByText('미션 카드에서 참여할 미션을 고르세요')).not.toBeInTheDocument();
  });

  it('toggles step visibility', () => {
    renderWithI18n(<HowItWorks persistenceId="test-toggle" stepKeys={EARN_MISSION_STEPS} />);

    const toggle = screen.getByRole('button', { name: '어떻게 진행되나요?' });
    fireEvent.click(toggle);
    expect(screen.queryByText('미션 카드에서 참여할 미션을 고르세요')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText('미션 카드에서 참여할 미션을 고르세요')).toBeInTheDocument();
  });
});

describe('HelpTip', () => {
  it('opens a bottom sheet with the help body', () => {
    renderWithI18n(
      <HelpTip
        label="레버리지"
        bodyKey="help.leverage"
        action={{ labelKey: 'common.cta.confirm', href: '/trade' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '레버리지 설명 보기' }));
    expect(
      screen.getByText(
        '빌린 돈으로 더 크게 거래해요. 수익과 손실이 함께 커져요. 레버리지는 신중하게 설정하세요.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '확인' })).toHaveAttribute('href', '/trade');
  });
});
