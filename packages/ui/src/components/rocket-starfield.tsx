import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface RocketStarfieldProps extends HTMLAttributes<HTMLDivElement> {
  density?: 'calm' | 'dense';
}

const calmStars =
  '8vw 12vh var(--color-rocket-cyan), 18vw 42vh var(--color-rocket-magenta), 30vw 18vh var(--color-fg), 42vw 70vh var(--color-rocket-cyan), 57vw 34vh var(--color-rocket-violet), 71vw 16vh var(--color-fg), 82vw 64vh var(--color-rocket-magenta), 92vw 28vh var(--color-rocket-cyan), 12vw 86vh var(--color-fg), 66vw 88vh var(--color-rocket-violet)';

const denseStars =
  `${calmStars}, 5vw 58vh var(--color-rocket-gold), 24vw 78vh var(--color-rocket-cyan), 36vw 50vh var(--color-fg), 49vw 12vh var(--color-rocket-magenta), 61vw 58vh var(--color-fg), 76vw 44vh var(--color-rocket-cyan), 88vw 82vh var(--color-rocket-violet), 96vw 10vh var(--color-fg)`;

export const RocketStarfield = forwardRef<HTMLDivElement, RocketStarfieldProps>(function RocketStarfield(
  { density = 'dense', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[var(--rocket-gradient-bg)]', className)}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 opacity-60 rocket-scanline-grid" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-rocket-cyan)_8%,transparent),transparent)]" />
      <div
        className="absolute left-0 top-0 h-1 w-1 rounded-full opacity-80 [animation:rocket-starfield-drift_18s_linear_infinite]"
        style={{ boxShadow: density === 'dense' ? denseStars : calmStars }}
      />
      <div
        className="absolute left-0 top-[200px] h-1 w-1 rounded-full opacity-50 [animation:rocket-starfield-drift_26s_linear_infinite]"
        style={{ boxShadow: density === 'dense' ? denseStars : calmStars }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--color-rocket-magenta)_18%,transparent),transparent_38%)]" />
    </div>
  );
});

RocketStarfield.displayName = 'RocketStarfield';
