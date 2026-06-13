import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function ErrorState({ title, description, action, className, ...props }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-3xl border border-danger/35 bg-danger/10 p-5 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="grid gap-1">
        <p className="text-base font-semibold text-fg">{title}</p>
        {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
