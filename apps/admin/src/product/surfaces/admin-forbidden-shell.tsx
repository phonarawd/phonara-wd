import { ADMIN_NEGATIVE_AUTH_TEST_IDS } from '@/domain/admin-security-display-contract';
import { useT } from '@/product/i18n';
import { Card, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { ShellPage } from '@/product/layout/content-shell';

type AdminForbiddenShellProps = {
  titleKey?: 'admin.login.title' | 'admin.mfa.enroll.title' | 'admin.mfa.challenge.title';
};

/** Shared negative-auth surface for non-admin sessions (profiles role gate). */
export function AdminForbiddenShell({ titleKey = 'admin.login.title' }: AdminForbiddenShellProps) {
  const t = useT();

  return (
    <ShellPage
      className="bg-background text-foreground flex min-h-dvh items-center justify-center p-4"
      data-testid={ADMIN_NEGATIVE_AUTH_TEST_IDS.forbidden}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(titleKey)}</CardTitle>
          <CardDescription>{t('admin.forbidden')}</CardDescription>
        </CardHeader>
      </Card>
    </ShellPage>
  );
}
