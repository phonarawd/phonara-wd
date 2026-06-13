import type { ReactNode } from 'react';

export interface AdminSectionProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
  titleId?: string;
}

/** Section wrapper with admin uppercase title rhythm. */
export function AdminSection({ title, children, className = '', testId, titleId }: AdminSectionProps) {
  return (
    <section className={`admin-section ${className}`.trim()} data-testid={testId}>
      <h2 id={titleId} className="admin-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

AdminSection.displayName = 'AdminSection';
