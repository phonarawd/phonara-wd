import type { ReactNode } from 'react';

type PresentationRootProps = {
  children: ReactNode;
};

/** Isolates imported presentation CSS tokens from engine-backed admin auth routes. */
export function PresentationRoot({ children }: PresentationRootProps) {
  return (
    <div
      data-presentation-import="v1"
      data-lovable-skin="v1"
      className="presentation-import-root min-h-dvh"
    >
      {children}
    </div>
  );
}
