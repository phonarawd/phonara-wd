import { Link } from '@/shims/react-router-dom';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/shell/AppShell';
import { SiteFooter } from '@/components/shell/SiteFooter';
import { t } from '@/i18n';

/** Display-only — scripted share preview; no Supabase / RPC. */
export function ImportedShareRoundPage() {
  return (
    <AppShell bare>
      <article className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> {t('legal.common.back')}
        </Link>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-(--color-primary)/30 bg-(--color-primary)/10 px-3 py-1 text-xs text-(--color-primary)">
          <Share2 className="size-3.5" aria-hidden /> {t('share.badge.preview')}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('share.title')}</h1>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">{t('share.subtitle')}</p>

        <div className="mt-8 rounded-2xl border border-border bg-(--color-surface) p-6">
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <Cell label={t('share.label.player')} value={t('share.demo.player')} />
            <Cell label={t('share.label.round')} value={t('share.demo.round')} />
            <Cell label={t('share.label.result')} value={t('share.demo.result')} accent />
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-(--color-primary) px-5 text-sm font-semibold text-(--color-primary-foreground) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            <Sparkles className="size-4" aria-hidden /> {t('share.cta.try')}
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-xl border border-border px-5 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('share.cta.home')}
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">{t('share.footer.note')}</p>
      </article>
      <SiteFooter />
    </AppShell>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={
          'mt-1 text-base font-semibold tabular-nums ' +
          (accent ? 'text-(--color-up)' : 'text-foreground')
        }
      >
        {value}
      </dd>
    </div>
  );
}
