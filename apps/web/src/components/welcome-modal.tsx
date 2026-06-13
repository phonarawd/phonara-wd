import { useEffect, useState } from 'react';
import {
  formatMoney,
  Button,
  Modal,
  Input,
  Badge,
  Money,
  CardDivider,
} from '@phonara/ui';
import { useWelcomeBonus, useReferral } from '../hooks/use-retention';
import { isPositiveAmount } from '../lib/money-display';
import { ensureOnboardingConsents } from '../lib/onboarding-consent';
import { WELCOME_BASE_PHON, WELCOME_REFERRAL_BONUS_PHON } from '../lib/reward-amounts';
import { useT } from '../lib/i18n';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const t = useT();
  const { claimWelcomeBonus, checkClaimed, result, loading } = useWelcomeBonus();
  const { registerReferral, loading: refLoading, error: refError, success: refSuccess } =
    useReferral();
  const [step, setStep] = useState<'referral' | 'claiming' | 'done'>('referral');
  const [refCode, setRefCode] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    checkClaimed().then((alreadyClaimed) => {
      if (alreadyClaimed) {
        setClaimed(true);
        setStep('done');
      }
    });
  }, [checkClaimed]);

  const handleSkipReferral = async () => {
    setStep('claiming');
    try {
      await ensureOnboardingConsents();
      const r = await claimWelcomeBonus();
      if (r) setStep('done');
      else setStep('referral');
    } catch {
      setStep('referral');
    }
  };

  const handleSubmitReferral = async () => {
    if (refCode.trim()) {
      await registerReferral(refCode);
    }
    setStep('claiming');
    try {
      await ensureOnboardingConsents();
      const r = await claimWelcomeBonus();
      if (r) setStep('done');
      else setStep('referral');
    } catch {
      setStep('referral');
    }
  };

  return (
    <Modal
      open
      onClose={onDismiss}
      dismissible={step !== 'claiming'}
      labelledBy="welcome-modal-title"
      className="max-w-[420px]"
    >
      {step === 'referral' && (
        <div className="flex flex-col gap-4 text-center">
          <Badge tone="trust" className="mx-auto">
            {t('welcome.badge')}
          </Badge>
          <h2 id="welcome-modal-title" className="text-xl font-bold text-fg">
            {t('welcome.title')}
          </h2>
          <p className="text-sm leading-relaxed text-muted">{t('welcome.subtitle')}</p>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
            <Money
              amount={WELCOME_BASE_PHON}
              currency="PHON"
              emphasis="hero"
              tone="neutral"
              showCurrency
              className="text-primary"
            />
            <p className="mt-1 text-xs text-muted">{t('welcome.valueBadge')}</p>
          </div>
          <p className="text-sm text-muted">{t('welcome.refPrompt')}</p>
          <Input
            placeholder={t('welcome.refPlaceholder')}
            value={refCode}
            onChange={(e) => setRefCode(e.target.value)}
            className="text-center tracking-widest"
          />
          {refError && (
            <p className="text-sm text-down" role="alert">
              {t(refError)}
            </p>
          )}
          {refSuccess && (
            <p className="text-sm text-up" role="status">
              {t('welcome.refSuccess')}
            </p>
          )}
          <div className="rounded-xl border border-border bg-surface-2 p-3 text-left text-sm">
            <div className="flex items-center justify-between gap-3 text-muted">
              <span>{t('welcome.bonusBase')}</span>
              <Money amount={WELCOME_BASE_PHON} currency="PHON" showCurrency className="font-semibold text-fg" />
            </div>
            <CardDivider className="my-2" />
            <div className="flex items-center justify-between gap-3 text-muted">
              <span>{t('welcome.bonusReferral')}</span>
              <Money
                amount={WELCOME_REFERRAL_BONUS_PHON}
                currency="PHON"
                signed
                showCurrency
                className="font-semibold text-warning"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              full
              data-testid="welcome-claim"
              onClick={handleSubmitReferral}
              disabled={refLoading || loading}
            >
              {refCode.trim() ? t('welcome.claimWithRef') : t('welcome.claim')}
            </Button>
            {refCode.trim() && (
              <Button variant="ghost" data-testid="welcome-skip-ref" onClick={handleSkipReferral}>
                {t('welcome.skipRef')}
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'claiming' && (
        <div className="py-10 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-primary/20" aria-hidden="true" />
          <p className="text-sm text-muted">{t('welcome.claiming')}</p>
        </div>
      )}

      {step === 'done' && result && !claimed && (
        <div data-testid="welcome-done" className="flex flex-col gap-4 text-center">
          <h2 id="welcome-modal-title" className="text-xl font-bold text-fg">
            {t('welcome.doneTitle')}
          </h2>
          <div className="rounded-2xl border border-up/30 bg-up/10 px-4 py-5">
            <Money
              amount={result.phon_awarded}
              currency="PHON"
              signed
              emphasis="hero"
              tone="positive"
              showCurrency
              className="text-up"
            />
            <p className="mt-2 text-xs text-muted">
              {t('welcome.earnedPhon', { amount: formatMoney(result.phon_awarded, 'PHON') })}
            </p>
          </div>
          {isPositiveAmount(String(result.referral_bonus)) && (
            <p className="text-sm text-warning">
              {t('welcome.referralIncluded', {
                amount: formatMoney(result.referral_bonus, 'PHON'),
              })}
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted">
            {t('welcome.cta')}
            <br />
            <span className="text-xs">{t('welcome.ctaSmall')}</span>
          </p>
          <Button variant="primary" full data-testid="welcome-start" onClick={onDismiss}>
            {t('welcome.start')}
          </Button>
        </div>
      )}

      {step === 'done' && claimed && (
        <div data-testid="welcome-done" className="flex flex-col gap-4 text-center">
          <h2 id="welcome-modal-title" className="text-xl font-bold text-fg">
            {t('welcome.returningTitle')}
          </h2>
          <Button variant="primary" full data-testid="welcome-start" onClick={onDismiss}>
            {t('welcome.goDashboard')}
          </Button>
        </div>
      )}
    </Modal>
  );
}
