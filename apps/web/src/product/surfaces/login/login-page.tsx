import { useEffect, useState, type FormEvent } from 'react';

import { useLoginPageController } from '@/features/auth/use-login-page-controller';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';
import { cn } from '@/product/primitives/lib/cn';

import { AuthEntryLayout, AuthLegalFooter } from './auth-entry-layout';
import { LoginForm } from './login-form';

/** Canonical `/login` surface — password · passkey · magic link (P3·W2). */
export function LoginPage() {
  const t = useT();
  const engine = useLoginPageController();
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    document.title = t('auth.entry.login.pageTitle');
  }, [t]);

  useEffect(() => {
    if (engine.magicSent) {
      productToast.show({ zone: 'warm', key: 'auth.entry.toast.magicLinkSent' });
    }
  }, [engine.magicSent]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void engine.handlePasswordLogin(event);
  };

  return (
    <AuthEntryLayout
      testId="login-page"
      title={t('auth.entry.login.pageTitle')}
      subtitle={t('auth.entry.login.subtitle')}
      footer={<AuthLegalFooter />}
    >
      <div className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4 md:p-6')}>
        <LoginForm
          engine={engine}
          onSubmit={onSubmit}
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
        />
      </div>
    </AuthEntryLayout>
  );
}
