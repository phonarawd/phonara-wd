import { cn } from '@/product/primitives/lib/cn';
import { usePrefersReducedMotion } from '@/product/primitives/lib/use-prefers-reduced-motion';

import type { AuroraBackdropIntensity } from './aurora-backdrop-policy';

export type AuroraBackgroundProps = {
  intensity: AuroraBackdropIntensity;
  className?: string;
};

/**
 * Aurora Mesh backdrop — §34.10 · at most one mount per route.
 * `prefers-reduced-motion` → static mesh (no drift).
 */
export function AuroraBackground({ intensity, className }: AuroraBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (intensity === 'off') return null;

  return (
    <div
      className={cn('ds-aurora-background', className)}
      data-intensity={intensity}
      data-static={prefersReducedMotion ? 'true' : 'false'}
      data-testid="aurora-background"
      aria-hidden
    >
      <div className="ds-aurora-background__mesh" />
      <div className="ds-aurora-background__noise" />
    </div>
  );
}
