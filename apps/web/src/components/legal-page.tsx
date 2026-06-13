import { Link } from '@tanstack/react-router';

import type { MessageKey } from '@phonara/i18n';

import { Button, buttonVariants } from '@phonara/ui';

import { useI18n, useT } from '../lib/i18n';



export interface LegalSection {

  id: string;

  title: MessageKey;

  body: MessageKey;

}



interface LegalPageProps {

  title: MessageKey;

  intro: MessageKey;

  effectiveDate: string;

  sections: LegalSection[];

  activeDoc: 'terms' | 'privacy';

}



/**

 * App-local readable document layout for legal pages (terms / privacy). Kept in

 * apps/web because it is tightly coupled to the `legal.*` product copy and the

 * app's route structure; it is not a generic design-system primitive.

 */

export function LegalPage({ title, intro, effectiveDate, sections, activeDoc }: LegalPageProps) {

  const t = useT();

  const { locale, setLocale } = useI18n();



  function toggleLocale() {

    setLocale(locale === 'ko' ? 'en' : 'ko');

  }



  return (

    <main className="auth-shell-root min-h-dvh text-fg" data-testid="legal-page" id="main-content" tabIndex={-1}>

      <div className="legal-frame pn-anim-rise mx-auto w-full max-w-3xl px-5 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">

        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">

          <Link

            to="/"

            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:underline"

          >

            <span className="app-shell-mark" aria-hidden="true">

              P

            </span>

            {t('legal.backHome')}

          </Link>



          <div className="flex flex-wrap items-center gap-2">

            <Button

              type="button"

              variant="ghost"

              size="sm"

              className="min-h-11 min-w-11"

              aria-label={locale === 'ko' ? t('appShell.switchToEnglish') : t('appShell.switchToKorean')}

              onClick={toggleLocale}

            >

              {locale === 'ko' ? 'EN' : 'KO'}

            </Button>

            <Link

              to="/login"

              className={buttonVariants({ variant: 'outline', size: 'sm' })}

            >

              {t('legal.back')}

            </Link>

          </div>

        </header>



        <nav

          className="legal-doc-nav mb-6 flex flex-wrap gap-2"

          aria-label={t('legal.nav.ariaLabel')}

        >

          <Link

            to="/terms"

            className={`legal-doc-nav-item${activeDoc === 'terms' ? ' is-active' : ''}`}

            aria-current={activeDoc === 'terms' ? 'page' : undefined}

          >

            {t('legal.nav.terms')}

          </Link>

          <Link

            to="/privacy"

            className={`legal-doc-nav-item${activeDoc === 'privacy' ? ' is-active' : ''}`}

            aria-current={activeDoc === 'privacy' ? 'page' : undefined}

          >

            {t('legal.nav.privacy')}

          </Link>

        </nav>



        <div className="auth-card rounded-2xl p-6 sm:p-8">

          <header className="border-b border-border pb-6">

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(title)}</h1>

            <p className="mt-2 text-sm text-muted">

              {t('legal.effectiveDate', { date: effectiveDate })}

            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted">{t(intro)}</p>

          </header>



          {sections.length > 1 && (

            <nav className="legal-toc mt-6 rounded-xl border border-border bg-surface-2/40 p-4" aria-label={t('legal.toc')}>

              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('legal.toc')}</p>

              <ol className="mt-3 flex flex-col gap-2">

                {sections.map((section, index) => (

                  <li key={section.id}>

                    <a href={`#${section.id}-title`} className="legal-toc-link">

                      {index + 1}. {t(section.title)}

                    </a>

                  </li>

                ))}

              </ol>

            </nav>

          )}



          <div className="legal-prose mt-8 flex flex-col gap-8">

            {sections.map((section, index) => (

              <section key={section.id} aria-labelledby={`${section.id}-title`}>

                <h2 id={`${section.id}-title`} className="text-lg font-semibold text-fg">

                  {index + 1}. {t(section.title)}

                </h2>

                <p className="mt-3 text-sm leading-relaxed text-muted">{t(section.body)}</p>

              </section>

            ))}

          </div>



          <footer className="legal-prose mt-12 border-t border-border pt-6 text-sm text-muted">

            {t('legal.contactBody')}

          </footer>

        </div>



        <footer className="auth-trust-strip mt-8" aria-label={t('auth.entry.trust.ariaLabel')}>

          <span className="auth-trust-item">

            <span className="auth-trust-lock" aria-hidden="true" />

            {t('auth.entry.trust.secured')}

          </span>

          <span className="auth-trust-item">{t('auth.entry.trust.wallet')}</span>

        </footer>

      </div>

    </main>

  );

}



LegalPage.displayName = 'LegalPage';


