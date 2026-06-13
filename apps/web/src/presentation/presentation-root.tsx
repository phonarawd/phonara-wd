import type { ReactNode } from 'react';

type PresentationRootProps = {
  children: ReactNode;
};

export function PresentationRoot({ children }: PresentationRootProps) {
  return (
    <div data-presentation="v1" className="presentation-root min-h-dvh bg-bg text-fg">
      {children}
    </div>
  );
}
