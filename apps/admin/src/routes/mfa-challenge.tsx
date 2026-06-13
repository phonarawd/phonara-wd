import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Route as rootRoute } from './__root';
import {
  challengeMfaFactor,
  listMfaFactors,
  getVerifiedTotpFactor,
  verifyMfaFactor,
} from '../domain/admin-auth';
import { useT } from '../lib/i18n';
import { translateError } from '../lib/translate-error';
import { signOut } from '../lib/auth';
import { AdminAuthBrand, AdminAuthFrame } from '../components/admin-auth-frame';
import { Button, Input } from '@phonara/ui';
import type { MessageKey } from '@phonara/i18n';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mfa/challenge',
  component: MfaChallengePage,
});

type ChallengeState =
  | { kind: 'loading' }
  | { kind: 'ready'; factorId: string }
  | { kind: 'error'; messageKey: MessageKey };

function MfaChallengePage() {
  const t = useT();
  const navigate = useNavigate();
  const [challengeState, setChallengeState] = useState<ChallengeState>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listMfaFactors()
      .then((factors) => {
        const verified = getVerifiedTotpFactor(factors);
        if (!verified) {
          if (!cancelled) {
            setChallengeState({
              kind: 'error',
              messageKey: 'admin.mfa.challenge.missingFactor',
            });
          }
          return;
        }
        if (!cancelled) setChallengeState({ kind: 'ready', factorId: verified.id });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setChallengeState({
            kind: 'error',
            messageKey: translateError(err, 'admin.mfa.challenge.setupError'),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (challengeState.kind !== 'ready' || submitting || !code.trim()) return;

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      const { challengeId } = await challengeMfaFactor(challengeState.factorId);
      await verifyMfaFactor({
        factorId: challengeState.factorId,
        challengeId,
        code,
      });
      void navigate({ to: '/overview' });
    } catch (err: unknown) {
      setSubmitErrorKey(translateError(err, 'admin.mfa.challenge.verifyError'));
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthFrame testId="admin-mfa-challenge-page">
      <AdminAuthBrand />
      <div className="space-y-1 text-center">
        <h1 className="admin-auth-brand-title">{t('admin.mfa.challenge.title')}</h1>
        <p className="admin-auth-brand-description">{t('admin.mfa.challenge.description')}</p>
      </div>

      {challengeState.kind === 'loading' && (
        <p className="mt-6 text-center text-sm text-muted">{t('common.loading')}</p>
      )}

      {challengeState.kind === 'error' && (
        <div className="mt-6 space-y-4 text-center">
          <p className="text-sm text-down" role="alert">
            {t(challengeState.messageKey)}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => { void signOut(); }}>
            {t('nav.logout')}
          </Button>
        </div>
      )}

      {challengeState.kind === 'ready' && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted" htmlFor="admin-mfa-challenge-code">
              {t('admin.mfa.challenge.codeLabel')}
            </label>
            <Input
              id="admin-mfa-challenge-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('admin.mfa.challenge.codePlaceholder')}
              data-testid="admin-mfa-challenge-code"
            />
          </div>

          {submitErrorKey && (
            <p className="text-sm text-down" role="alert">
              {t(submitErrorKey)}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            full
            disabled={submitting || !code.trim()}
            data-testid="admin-mfa-challenge-submit"
          >
            {submitting ? t('admin.mfa.challenge.verifying') : t('admin.mfa.challenge.submit')}
          </Button>
        </form>
      )}
    </AdminAuthFrame>
  );
}
