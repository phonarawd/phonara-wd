import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useT } from '../lib/i18n';
import { translateError } from '../lib/translate-error';
import { setRgLimit, setSelfExclusion } from '../domain/responsible-gaming';
import { normalizeDecimalInput } from '../lib/money-input';
import { Button, Card, CardDivider, ConfirmDialog, Input } from '@phonara/ui';
import { AppShell } from '../components/app-shell';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/responsible-gaming',
  component: ResponsibleGamingPage,
});

function ResponsibleGamingPage() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [depositLimit, setDepositLimit] = useState('500000');
  const [lossLimit, setLossLimit] = useState('100');
  const [exclusionDays, setExclusionDays] = useState('7');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  async function handleSaveLimits() {
    if (!session) return;
    setBusy(true);
    try {
      await setRgLimit('deposit', '', 'KRW', depositLimit);
      await setRgLimit('loss', 'game', 'USDT', lossLimit);
      toast.success(t('rg.saveSuccess'));
    } catch (err: unknown) {
      toast.error(t(translateError(err, 'rg.saveError')));
    } finally {
      setBusy(false);
    }
  }

  async function handleSelfExclusion() {
    if (!session) return;
    setBusy(true);
    try {
      const days = Number.parseInt(exclusionDays, 10);
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await setSelfExclusion(until, t('rg.selfExclusion.defaultReason'));
      toast.success(t('rg.selfExclusion.success'));
      setConfirmOpen(false);
    } catch (err: unknown) {
      toast.error(t(translateError(err, 'rg.selfExclusion.error')));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !session) {
    return (
      <AppShell active="more">
        <div className="app-page flex min-h-[40vh] items-center justify-center text-sm text-muted">
          {t('common.loading')}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="more">
      <div className="app-page pn-anim-rise" data-testid="responsible-gaming-page">
        <section className="app-section" aria-labelledby="rg-hero-title">
          <Card elevation="raised" className="p-5">
            <h1 id="rg-hero-title" className="text-xl font-bold text-fg">
              {t('rg.title')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('rg.description')}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">{t('rg.hero.note')}</p>
          </Card>
        </section>

        <section className="app-section" aria-labelledby="rg-limits-title">
          <Card className="p-5">
            <h2 id="rg-limits-title" className="text-sm font-semibold text-fg">
              {t('rg.limits.title')}
            </h2>
            <p className="mt-1 text-xs text-muted">{t('rg.limits.help')}</p>

            <div className="mt-4 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">{t('rg.limits.depositKrw')}</span>
                <Input
                  inputMode="decimal"
                  value={depositLimit}
                  onChange={(e) => setDepositLimit(normalizeDecimalInput(e.target.value))}
                  data-testid="rg-deposit-limit-input"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">
                  {t('rg.limits.lossGameUsdt')}
                </span>
                <Input
                  inputMode="decimal"
                  value={lossLimit}
                  onChange={(e) => setLossLimit(normalizeDecimalInput(e.target.value))}
                  data-testid="rg-loss-limit-input"
                />
              </label>
              <Button
                variant="primary"
                full
                disabled={busy}
                data-testid="rg-save-limits"
                onClick={() => {
                  void handleSaveLimits();
                }}
              >
                {t('rg.limits.save')}
              </Button>
            </div>
          </Card>
        </section>

        <section className="app-section app-section-secondary" aria-labelledby="rg-exclusion-title">
          <Card className="border border-down/25 p-5">
            <h2 id="rg-exclusion-title" className="text-sm font-semibold text-fg">
              {t('rg.selfExclusion.title')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t('rg.selfExclusion.description')}
            </p>
            <p className="mt-2 text-xs font-medium text-down">{t('rg.selfExclusion.warning')}</p>

            <CardDivider className="my-4" />

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">
                {t('rg.selfExclusion.daysLabel')}
              </span>
              <Input
                type="number"
                min={1}
                value={exclusionDays}
                onChange={(e) => setExclusionDays(e.target.value)}
                data-testid="rg-exclusion-days-input"
              />
            </label>
            <Button
              variant="danger"
              full
              className="mt-4"
              disabled={busy}
              data-testid="rg-self-exclusion-start"
              onClick={() => setConfirmOpen(true)}
            >
              {t('rg.selfExclusion.start')}
            </Button>
          </Card>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('rg.selfExclusion.confirmTitle')}
        description={t('rg.selfExclusion.confirmDescription')}
        confirmLabel={t('rg.selfExclusion.confirmAction')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={busy}
        testId="rg-self-exclusion-confirm"
        onConfirm={() => {
          void handleSelfExclusion();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  );
}
