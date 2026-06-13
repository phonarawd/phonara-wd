import type { ReactNode } from 'react';
import './presentation-deps';

type PresentationRootProps = {
  children: ReactNode;
};

/**
 * Isolates imported presentation CSS tokens and layout from the engine-backed app shell.
 * Wrap imported presentation pages with this in route adapters only.
 */
export function PresentationRoot({ children }: PresentationRootProps) {
  return (
    <div data-presentation-import="v1" className="presentation-import-root min-h-dvh bg-bg text-fg">
      {children}
    </div>
  );
}
