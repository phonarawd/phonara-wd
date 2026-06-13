import type { ReactNode } from 'react';

export interface AdminPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
}

/** Admin route title block — shared typography and responsive action row. */
export function AdminPageHeader({
  title,
  description,
  meta,
  actions,
  titleId,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="min-w-0 flex-1">
        <h1 id={titleId} className="text-2xl font-bold tracking-tight text-fg">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
        {meta && <div className="mt-2 text-xs text-muted tabular-nums">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

AdminPageHeader.displayName = 'AdminPageHeader';
