import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';

import { useT } from '@/product/i18n';
import { ContentShell, ShellPage } from '@/product/layout/content-shell';
import { AdminMobileNav, AdminNav, resolveAdminNavTitleKey } from '@/product/layout/admin-nav';

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const titleKey = resolveAdminNavTitleKey(pathname);

  return (
    <ShellPage className="bg-background text-foreground min-h-dvh">
      <div className="flex min-h-dvh">
        <aside
          className="border-line bg-surface sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto border-r lg:block"
          data-testid="admin-sidebar"
        >
          <ContentShell className="py-5">
            <p className="text-foreground-muted m-0 mb-4 text-xs font-medium tracking-wide uppercase">
              {t('admin.shell.subtitle')}
            </p>
            <AdminNav />
          </ContentShell>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-line bg-surface sticky top-0 z-10 border-b">
            <ContentShell className="flex flex-col gap-3 py-3">
              <div className="min-w-0">
                <p className="text-foreground-muted m-0 text-xs font-medium tracking-wide uppercase lg:hidden">
                  {t('admin.shell.subtitle')}
                </p>
                <h1 className="text-foreground m-0 truncate text-lg font-semibold">
                  {t(titleKey)}
                </h1>
              </div>
              <div className="border-line -mx-1 overflow-x-auto border-t px-1 pt-3 lg:hidden">
                <AdminMobileNav />
              </div>
            </ContentShell>
          </header>
          <ContentShell className="flex-1 py-6">{children}</ContentShell>
        </div>
      </div>
    </ShellPage>
  );
}
