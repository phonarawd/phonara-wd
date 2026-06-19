import { Link } from '@tanstack/react-router';
import { PresentationRoot } from '../presentation-root';
import { ImportedSignupPage } from '../pages/signup-page';
import { useSignupPageController } from '../../features/auth/use-signup-page-controller';

export function SignupLovableSurface() {
  const controller = useSignupPageController();

  if (controller.loading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  if (controller.verifySent) {
    return (
      <PresentationRoot>
        <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-12">
          <section
            className="grid w-full max-w-md gap-4 rounded-2xl border border-border bg-(--color-surface-elev) p-6"
            style={{ boxShadow: 'var(--shadow-elev-2)' }}
          >
            <h2 className="text-lg font-semibold text-foreground">
              {controller.t('auth.entry.signup.verifySentTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {controller.t('auth.entry.signup.verifySentBody')}
            </p>
            <Link
              to="/login"
              className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-(--color-surface-elev)"
            >
              {controller.t('auth.entry.signup.toLogin')}
            </Link>
          </section>
        </main>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedSignupPage engine={controller} />
    </PresentationRoot>
  );
}
