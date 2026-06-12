import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useT } from '../lib/i18n';
import { translateError } from '../lib/translate-error';
import { setRgLimit, setSelfExclusion } from '../domain/responsible-gaming';
import { Button, Card, ConfirmDialog, Input } from '@phonara/ui';

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
      <div className="shell flex min-h-dvh items-center justify-center text-muted text-sm">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="shell py-6" data-testid="responsible-gaming-page">
      <Card className="mx-auto max-w-lg space-y-6 p-5">
        <div>
          <h1 className="text-xl font-bold text-fg">{t('rg.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('rg.description')}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">{t('rg.limits.title')}</h2>
          <label className="block space-y-1">
            <span className="text-xs text-muted">{t('rg.limits.depositKrw')}</span>
            <Input
              value={depositLimit}
              onChange={(e) => setDepositLimit(e.target.value)}
              data-testid="rg-deposit-limit-input"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">{t('rg.limits.lossGameUsdt')}</span>
            <Input
              value={lossLimit}
              onChange={(e) => setLossLimit(e.target.value)}
              data-testid="rg-loss-limit-input"
            />
          </label>
          <Button
            variant="primary"
            full
            disabled={busy}
            data-testid="rg-save-limits"
            onClick={() => { void handleSaveLimits(); }}
          >
            {t('rg.limits.save')}
          </Button>
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-fg">{t('rg.selfExclusion.title')}</h2>
          <p className="text-xs text-muted">{t('rg.selfExclusion.description')}</p>
          <label className="block space-y-1">
            <span className="text-xs text-muted">{t('rg.selfExclusion.daysLabel')}</span>
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
            disabled={busy}
            data-testid="rg-self-exclusion-start"
            onClick={() => setConfirmOpen(true)}
          >
            {t('rg.selfExclusion.start')}
          </Button>
        </section>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={t('rg.selfExclusion.confirmTitle')}
        description={t('rg.selfExclusion.confirmDescription')}
        confirmLabel={t('rg.selfExclusion.confirmAction')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={busy}
        testId="rg-self-exclusion-confirm"
        onConfirm={() => { void handleSelfExclusion(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
