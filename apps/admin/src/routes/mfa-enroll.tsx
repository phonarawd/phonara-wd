import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Route as rootRoute } from './__root';
import { enrollTotpFactor, challengeMfaFactor, verifyMfaFactor, waitForAdminAal2 } from '../domain/admin-auth';
import { useT } from '../lib/i18n';
import { translateError } from '../lib/translate-error';
import { signOut } from '../lib/auth';
import { AdminAuthBrand, AdminAuthFrame } from '../components/admin-auth-frame';
import { Button, Input } from '@phonara/ui';
import type { MessageKey } from '@phonara/i18n';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mfa/enroll',
  component: MfaEnrollPage,
});

type EnrollState =
  | { kind: 'loading' }
  | { kind: 'ready'; factorId: string; qrCode: string; secret: string }
  | { kind: 'error'; messageKey: MessageKey };

function MfaEnrollPage() {
  const t = useT();
  const navigate = useNavigate();
  const [enrollState, setEnrollState] = useState<EnrollState>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    void enrollTotpFactor()
      .then((payload) => {
        if (!cancelled) setEnrollState({ kind: 'ready', ...payload });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEnrollState({ kind: 'error', messageKey: translateError(err, 'admin.mfa.enroll.setupError') });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (enrollState.kind !== 'ready' || submitting || !code.trim()) return;

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      const { challengeId } = await challengeMfaFactor(enrollState.factorId);
      await verifyMfaFactor({
        factorId: enrollState.factorId,
        challengeId,
        code,
      });
      await waitForAdminAal2();
      void navigate({ to: '/overview' });
    } catch (err: unknown) {
      setSubmitErrorKey(translateError(err, 'admin.mfa.enroll.verifyError'));
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthFrame testId="admin-mfa-enroll-page" size="md">
      <AdminAuthBrand />
      <div className="space-y-1 text-center">
        <h1 className="admin-auth-brand-title">{t('admin.mfa.enroll.title')}</h1>
        <p className="admin-auth-brand-description">{t('admin.mfa.enroll.description')}</p>
      </div>

      {enrollState.kind === 'loading' && (
        <p className="mt-6 text-center text-sm text-muted">{t('common.loading')}</p>
      )}

      {enrollState.kind === 'error' && (
        <div className="mt-6 space-y-4 text-center">
          <p className="text-sm text-down" role="alert">
            {t(enrollState.messageKey)}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => { void signOut(); }}>
            {t('nav.logout')}
          </Button>
        </div>
      )}

      {enrollState.kind === 'ready' && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-medium text-muted">{t('admin.mfa.enroll.qrLabel')}</p>
            <img
              src={enrollState.qrCode}
              alt={t('admin.mfa.enroll.qrAlt')}
              className="rounded-2xl border border-border bg-surface p-3"
              width={200}
              height={200}
            />
            <div className="w-full space-y-1">
              <p className="text-xs font-medium text-muted">{t('admin.mfa.enroll.secretLabel')}</p>
              <p className="rounded-2xl border border-border bg-surface-2/60 px-3 py-2 text-center text-sm font-mono text-fg">
                {enrollState.secret}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted" htmlFor="admin-mfa-enroll-code">
              {t('admin.mfa.enroll.codeLabel')}
            </label>
            <Input
              id="admin-mfa-enroll-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('admin.mfa.enroll.codePlaceholder')}
              data-testid="admin-mfa-enroll-code"
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
            data-testid="admin-mfa-enroll-submit"
          >
            {submitting ? t('admin.mfa.enroll.verifying') : t('admin.mfa.enroll.submit')}
          </Button>
        </form>
      )}
    </AdminAuthFrame>
  );
}
