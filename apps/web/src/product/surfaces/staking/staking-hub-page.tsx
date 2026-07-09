import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Crown, Lock } from 'lucide-react';

import {
  formatStakingAprDisplay,
  resolveStakingTermLabelKey,
  STAKING_WIZARD_STEP_LABEL_KEYS,
  STAKING_WIZARD_STEPS,
  type StakingStakeCurrency,
  type StakingWizardStep,
} from '@/domain/staking-display-contract';
import { resolveStakingPositionClaimBlockedReason } from '@/domain/trade-submit-display-contract';
import { TIER_BENEFITS_ROUTE } from '@/domain/tier-benefits-display-contract';
import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useStakingPageController } from '@/features/earn/use-staking-page-controller';
import { TradeHowItWorksPanel } from '@/features/trading/trade-beginner-help/trade-how-it-works-panel';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { TradeConfirmSettingsLink } from '@/product/surfaces/trade/trade-confirm-settings-link';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { ConfirmDialog } from '@/product/primitives/confirm-dialog';
import { Input } from '@/product/primitives/input';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { SpendCurrencySelector } from '@/product/primitives/spend-currency-selector';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { isPositiveAmount } from '@/lib/money-display';
import type { Currency } from '@phonara/shared-types';

function StakingBalanceAmount({
  amount,
  currency,
  size,
  className,
  showCurrency,
}: {
  amount: string | null;
  currency: Currency;
  size?: 'default' | 'hero';
  className?: string;
  showCurrency?: boolean;
}) {
  if (amount === null) {
    return (
      <span className={cn('text-foreground-muted tabular-nums', className)} data-money-unavailable>
        —
      </span>
    );
  }

  return (
    <MoneyDisplay
      amount={amount}
      currency={currency}
      size={size}
      showCurrency={showCurrency}
      className={className}
    />
  );
}

function StakingLoadingShell() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"
      data-testid="staking-hub-loading"
    >
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function formatUnlockAt(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatLockDays(
  lockDays: number,
  t: ReturnType<typeof useStakingPageController>['t'],
): string {
  if (lockDays <= 0) return t('staking.term.flexible');
  return `${lockDays}`;
}

/** Canonical `/staking` hub — majors + PHON pools · tier APY bonus (partial) · stake/unstake/claim (T3). */
export function StakingHubPage() {
  const engine = useStakingPageController();
  const {
    t,
    loading,
    poolsError,
    positionsError,
    tierError,
    walletError,
    stakingBlocked,
    usdtAvailableDisplay,
    phonAvailableDisplay,
    availableDisplay,
    stakeCurrency,
    currentTier,
    tierApyBonusKey,
    referenceAssets,
    selectedReferenceAsset,
    poolCards,
    selectedPoolId,
    stakeAmount,
    canStake,
    stakeBusy,
    actionBusy,
    activePositions,
    confirmOpen,
    wizardStep,
    submitDisabledReason,
    claimBlockedReason,
    positionActionsDisabled,
    isPositionClaimDisabled,
    insufficientAvail,
    selectReferenceAsset,
    setStakeCurrency,
    selectPool,
    setStakeAmount,
    openStakeConfirm,
    closeStakeConfirm,
    goToWizardStep,
    wizardNext,
    wizardBack,
    confirmStake,
    unstakePosition,
    claimReward,
    refresh,
    selectedPool,
  } = engine;

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';
  const tierColorVar = resolveTierCssVar(currentTier);

  useEffect(() => {
    document.title = t('seo.staking.title');
  }, [t]);

  if (loading) {
    return <StakingLoadingShell />;
  }

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 md:py-6"
      data-testid="staking-hub-page"
    >
      <header className="flex flex-col gap-2">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('staking.network.label')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('staking.network.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('staking.network.subtitle')}
        </p>
        <p className="text-foreground-muted m-0 text-xs leading-relaxed">
          {t('staking.disclaimer')}
        </p>
      </header>

      <TradeHowItWorksPanel slotId="staking-hub" />

      <Card data-testid="staking-balance-card">
        <CardBody className="flex flex-col gap-4">
          {walletError ? (
            <div
              className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
              data-testid="staking-wallet-error"
            >
              <p className="text-foreground m-0 text-sm">{t('wallet.loadError')}</p>
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                {t('common.retry')}
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-foreground-muted m-0 text-xs font-medium">
                {t('staking.availableFor', { currency: stakeCurrency })}
              </p>
              <StakingBalanceAmount
                amount={availableDisplay}
                currency={stakeCurrency}
                size="hero"
              />
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {tierError ? null : (
                <>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                      color: `var(${tierColorVar})`,
                    }}
                    data-testid="staking-tier-badge"
                  >
                    <Crown className="size-4" aria-hidden />
                    {t(`earn.tier.${currentTier}`)}
                  </span>
                  <p className="text-foreground-muted m-0 text-xs">
                    {t('staking.tierApyBonus.label')}:{' '}
                    <span className="text-accent font-semibold tabular-nums">
                      {t(tierApyBonusKey)}
                    </span>
                  </p>
                </>
              )}
              <Link
                to={TIER_BENEFITS_ROUTE}
                className="text-accent text-xs font-medium underline-offset-4 hover:underline"
              >
                {t('tier.benefits.head.title')}
              </Link>
            </div>
          </div>
          <div
            className="border-line grid gap-2 rounded-(--ds-radius-md) border px-2 py-2 sm:grid-cols-2"
            data-testid="staking-wallet-balances"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground-muted text-xs">USDT</span>
              <StakingBalanceAmount
                amount={usdtAvailableDisplay}
                currency="USDT"
                showCurrency
                className="text-sm font-medium"
              />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground-muted text-xs">PHON</span>
              <StakingBalanceAmount
                amount={phonAvailableDisplay}
                currency="PHON"
                showCurrency
                className="text-sm font-medium"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {tierError ? (
        <div
          className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
          data-testid="staking-tier-error"
        >
          <p className="text-foreground m-0 text-sm">{t('staking.tier.loadErrorRetry')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {stakingBlocked ? (
        <div
          className="border-line bg-surface rounded-(--ds-radius-lg) border p-4"
          data-testid="staking-gate-paused"
        >
          <p className="text-foreground m-0 text-sm">{t('staking.gate.paused')}</p>
        </div>
      ) : null}

      {poolsError ? (
        <div
          className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
          data-testid="staking-pools-error"
        >
          <p className="text-foreground m-0 text-sm">{t('staking.loadError')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {referenceAssets.length === 0 && !stakingBlocked ? (
        <section aria-labelledby="staking-products-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="staking-products-heading" className="text-foreground m-0 text-lg font-semibold">
              {t('staking.products')}
            </h2>
            <TradeHelpTip termId="staking_lock" className="text-xs" />
          </div>
          <Card data-testid="staking-empty-pools">
            <CardBody>
              <p className="text-foreground-muted m-0 text-sm">{t('staking.emptyPools')}</p>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {!stakingBlocked && referenceAssets.length > 0 ? (
        <Card data-testid="staking-stake-wizard">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('staking.stakeBtn')}</CardTitle>
            <ol
              className="mt-3 grid grid-cols-3 gap-2"
              data-testid="staking-wizard-steps"
              aria-label={t('staking.wizard.progressLabel')}
            >
              {STAKING_WIZARD_STEPS.map((step: StakingWizardStep, index) => {
                const active = wizardStep === step;
                const complete = STAKING_WIZARD_STEPS.indexOf(wizardStep) > index;
                return (
                  <li key={step} className="flex flex-col gap-1">
                    <button
                      type="button"
                      data-testid={`staking-wizard-step-${step}`}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'border-line rounded-(--ds-radius-md) border px-2 py-2 text-left text-xs transition-colors',
                        active && 'border-accent bg-accent/10',
                        complete && !active && 'border-market-up/40',
                      )}
                      onClick={() => {
                        if (complete || active) goToWizardStep(step);
                      }}
                    >
                      <span className="text-foreground-muted tabular-nums">{index + 1}</span>
                      <span className="text-foreground block font-medium">
                        {t(STAKING_WIZARD_STEP_LABEL_KEYS[step])}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {wizardStep === 'pool' ? (
              <div className="flex flex-col gap-4" data-testid="staking-wizard-panel-pool">
                {referenceAssets.length > 0 ? (
                  <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    data-testid="staking-reference-assets"
                    role="tablist"
                    aria-label={t('staking.referenceAsset.label')}
                  >
                    {referenceAssets.map((asset) => {
                      const selected = selectedReferenceAsset === asset;
                      return (
                        <Button
                          key={asset}
                          type="button"
                          size="sm"
                          variant={selected ? 'primary' : 'outline'}
                          data-testid={`staking-reference-${asset}`}
                          role="tab"
                          aria-selected={selected}
                          onClick={() => selectReferenceAsset(asset)}
                          className="shrink-0"
                        >
                          {asset}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}

                <SpendCurrencySelector
                  value={stakeCurrency}
                  onChange={(currency) => setStakeCurrency(currency as StakingStakeCurrency)}
                  testId="staking-stake-currency-selector"
                  currencyTestIdPrefix="staking-stake-currency"
                  ariaLabel="common.spendCurrency"
                  className="max-w-xs"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  {poolCards.length === 0 ? (
                    <p
                      className="text-foreground-muted m-0 text-sm"
                      data-testid="staking-pools-filter-empty"
                    >
                      {t('staking.emptyPools')}
                    </p>
                  ) : (
                    poolCards.map((pool) => {
                      const selected = selectedPoolId === pool.id;
                      return (
                        <div
                          key={pool.id}
                          role="button"
                          tabIndex={0}
                          data-testid={`staking-pool-${pool.id}`}
                          onClick={() => selectPool(pool.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              selectPool(pool.id);
                            }
                          }}
                          className={cn(
                            'border-line bg-surface rounded-(--ds-radius-lg) flex cursor-pointer flex-col gap-3 border p-4 text-left transition-colors',
                            selected && 'border-accent ring-accent/30 ring-2',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-foreground m-0 text-base font-semibold">
                                {t(pool.termLabelKey)}
                              </p>
                              <p className="text-foreground-muted m-0 text-xs">
                                {pool.referenceAsset} · {pool.stakeCurrency}
                              </p>
                              <p className="text-foreground-muted m-0 text-xs tabular-nums">
                                {formatLockDays(pool.lockDays, t)}
                              </p>
                            </div>
                            {pool.lockDays > 0 ? (
                              <Lock className="text-foreground-muted size-4 shrink-0" aria-hidden />
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                              <p className="text-foreground-muted m-0 flex items-center gap-1 text-xs">
                                {t('trade.staking.apr')}
                                <span
                                  className="inline-flex"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                >
                                  <TradeHelpTip termId="staking_apr" className="text-xs" />
                                </span>
                              </p>
                              <p className="text-foreground m-0 text-xl font-semibold tabular-nums">
                                {pool.baseAprDisplay}
                              </p>
                            </div>
                            <p className="text-accent m-0 text-xs font-medium tabular-nums">
                              {tierError ? null : (
                                <>
                                  {t('staking.tierApyBonus.label')} {t(pool.tierApyBonusKey)}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            {wizardStep === 'amount' ? (
              <div className="flex flex-col gap-4" data-testid="staking-wizard-panel-amount">
                {selectedPool ? (
                  <p className="text-foreground-muted m-0 text-sm">
                    {selectedPool.reference_asset} · {selectedPool.stake_currency} ·{' '}
                    {t(resolveStakingTermLabelKey(selectedPool.term))}
                  </p>
                ) : null}
                <label className="flex flex-col gap-1">
                  <span className="text-foreground-muted flex items-center gap-1 text-xs">
                    {t('staking.amountLabel')}
                    <TradeHelpTip termId="stake_currency" className="text-xs" />
                  </span>
                  <Input
                    inputMode="decimal"
                    value={stakeAmount}
                    onChange={(event) => setStakeAmount(event.target.value)}
                    aria-label={t('staking.amountLabel')}
                    data-testid="staking-amount-input"
                  />
                </label>
                <p className="text-foreground-muted m-0 text-xs">
                  {t('staking.availableFor', { currency: stakeCurrency })}:{' '}
                  <StakingBalanceAmount
                    amount={availableDisplay}
                    currency={stakeCurrency}
                    showCurrency
                    className="inline"
                  />
                </p>
                <p className="text-foreground-muted m-0 text-xs">
                  {tierError ? null : t('staking.tierApyBonus.hint')}
                </p>
              </div>
            ) : null}

            {wizardStep === 'confirm' ? (
              <div className="flex flex-col gap-3" data-testid="staking-wizard-panel-confirm">
                {selectedPool ? (
                  <dl className="m-0 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-foreground-muted">{t('staking.products')}</dt>
                      <dd className="text-foreground m-0">
                        {selectedPool.reference_asset} · {selectedPool.stake_currency}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-foreground-muted">{t('trade.staking.apr')}</dt>
                      <dd className="text-foreground m-0 tabular-nums">
                        {formatStakingAprDisplay(selectedPool.estimated_apr)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-foreground-muted">{t('staking.amountLabel')}</dt>
                      <dd className="text-foreground m-0">
                        <MoneyDisplay amount={stakeAmount} currency={stakeCurrency} showCurrency />
                      </dd>
                    </div>
                  </dl>
                ) : null}
                <TradeConfirmSettingsLink />
              </div>
            ) : null}

            {insufficientAvail ? (
              <p className="text-market-down m-0 text-sm">{t('error.INSUFFICIENT_BALANCE')}</p>
            ) : null}

            {submitDisabledReason && !insufficientAvail && wizardStep !== 'pool' ? (
              <p className="text-warning m-0 text-sm" data-testid="staking-submit-blocked-reason">
                {t(submitDisabledReason)}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {wizardStep !== 'pool' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={wizardBack}
                  data-testid="staking-wizard-back"
                >
                  {t('common.cta.back')}
                </Button>
              ) : null}
              {wizardStep === 'confirm' ? (
                <Button
                  type="button"
                  disabled={!canStake}
                  loading={stakeBusy}
                  onClick={openStakeConfirm}
                  data-testid="staking-stake-cta"
                >
                  {t('staking.stakeBtn')}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={
                    wizardStep === 'pool' ? !selectedPoolId : !isPositiveAmount(stakeAmount)
                  }
                  onClick={wizardNext}
                  data-testid="staking-wizard-next"
                >
                  {t('common.cta.next')}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <section aria-labelledby="staking-positions-heading" className="flex flex-col gap-3">
        <h2 id="staking-positions-heading" className="text-foreground m-0 text-lg font-semibold">
          {t('staking.myStaking')}
        </h2>

        {positionsError ? (
          <div
            className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
            data-testid="staking-positions-error"
          >
            <p className="text-foreground m-0 text-sm">{t('staking.loadError')}</p>
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              {t('common.retry')}
            </Button>
          </div>
        ) : activePositions.length === 0 ? (
          <Card data-testid="staking-empty-positions">
            <CardBody>
              <p className="text-foreground-muted m-0 text-sm">{t('staking.noneActive')}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {claimBlockedReason ? (
              <p className="text-warning m-0 text-sm" data-testid="staking-claim-blocked-reason">
                {t(claimBlockedReason)}
              </p>
            ) : null}
            {activePositions.map((row) => (
              <Card key={row.id} data-testid={`staking-position-${row.id}`}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground m-0 text-sm font-semibold">{row.poolLabel}</p>
                      <span className="bg-surface-raised text-foreground-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {t(row.termLabelKey)}
                      </span>
                      <span className="bg-surface-raised text-foreground-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {t(row.statusKey)}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-foreground-muted m-0 text-xs">
                          {t('staking.principal')}
                        </p>
                        <MoneyDisplay amount={row.principalDisplay} currency={row.stakeCurrency} />
                      </div>
                      <div>
                        <p className="text-foreground-muted m-0 text-xs">
                          {t('staking.rewardReceived')}
                        </p>
                        <MoneyDisplay
                          amount={row.rewardClaimedDisplay}
                          currency={row.stakeCurrency}
                        />
                      </div>
                      <div>
                        <p className="text-foreground-muted m-0 text-xs">
                          {t('trade.staking.apr')}
                        </p>
                        <p className="text-foreground m-0 tabular-nums">{row.aprSnapshotDisplay}</p>
                      </div>
                    </div>
                    {row.unlockAt ? (
                      <p className="text-foreground-muted m-0 text-xs">
                        {t('staking.unlockAt')}: {formatUnlockAt(row.unlockAt, locale)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const rowClaimBlockedReason = resolveStakingPositionClaimBlockedReason({
                        tierError,
                        pendingRewardDisplay: row.pendingRewardDisplay,
                      });
                      return rowClaimBlockedReason && !claimBlockedReason ? (
                        <p
                          className="text-warning m-0 w-full text-xs"
                          data-testid={`staking-claim-blocked-reason-${row.id}`}
                        >
                          {t(rowClaimBlockedReason)}
                        </p>
                      ) : null;
                    })()}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={actionBusy}
                      disabled={isPositionClaimDisabled(row)}
                      onClick={() => void claimReward(row.id)}
                      data-testid={`staking-claim-${row.id}`}
                    >
                      {t('staking.claimReward')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={actionBusy}
                      disabled={row.locked || positionActionsDisabled}
                      onClick={() => void unstakePosition(row.id)}
                      data-testid={`staking-unstake-${row.id}`}
                    >
                      {t('staking.unstake')}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) closeStakeConfirm();
        }}
        title={t('confirm.stake.title')}
        description={t('confirm.stake.bodyCurrency', { currency: stakeCurrency })}
        summary={
          selectedPool ? (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-foreground m-0">
                {selectedPool.reference_asset} · {stakeCurrency} ·{' '}
                {t(resolveStakingTermLabelKey(selectedPool.term))} ·{' '}
                {formatStakingAprDisplay(selectedPool.estimated_apr)}
              </p>
              <MoneyDisplay amount={stakeAmount} currency={stakeCurrency} />
            </div>
          ) : null
        }
        confirmLabel={t('confirm.proceed')}
        onConfirm={() => void confirmStake()}
        loading={stakeBusy}
      />
    </div>
  );
}
