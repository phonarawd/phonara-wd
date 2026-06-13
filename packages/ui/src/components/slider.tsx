import {
  forwardRef,
  type InputHTMLAttributes,
  type ChangeEvent,
} from 'react';
import { cn } from '../lib/cn';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  /** Show the current value label above the thumb */
  showLabel?: boolean;
  formatLabel?: (v: number) => string;
  tone?: 'primary' | 'risk' | 'up' | 'down';
  density?: 'compact' | 'comfortable';
}

/**
 * Slider — styled range input. Primary use: leverage selector.
 * Renders a native <input type="range"> with custom CSS to match the design system.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      min = 1,
      max = 100,
      step = 1,
      onChange,
      showLabel = false,
      formatLabel,
      tone = 'primary',
      density = 'comfortable',
      className,
      ...rest
    },
    ref,
  ) => {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const label = formatLabel ? formatLabel(value) : `${value}×`;
    const fillClass = {
      primary: 'bg-primary',
      risk: 'bg-[linear-gradient(90deg,var(--color-primary),var(--color-warning),var(--color-danger))]',
      up: 'bg-up',
      down: 'bg-down',
    }[tone];

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(Number(e.target.value));
    };

    return (
      <div className={cn('relative flex flex-col gap-1.5', className)}>
        {showLabel && (
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{formatLabel ? formatLabel(min) : `${min}×`}</span>
            <span className="text-primary font-semibold">{label}</span>
            <span>{formatLabel ? formatLabel(max) : `${max}×`}</span>
          </div>
        )}
        <div className={cn('relative flex items-center', density === 'compact' ? 'h-5' : 'h-7')}>
          <div className="absolute inset-x-0 h-2 rounded-full border border-border bg-surface-inset shadow-[var(--surface-inset-shadow)]" />
          <div
            className={cn('absolute left-0 h-2 rounded-full shadow-[var(--primary-glow)]', fillClass)}
            style={{ width: `${pct}%` }}
          />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className={cn(
              'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
              'disabled:cursor-not-allowed',
            )}
            {...rest}
          />
          <div
            className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-primary-fg bg-primary shadow-[var(--elevation-1)]"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>
      </div>
    );
  },
);
Slider.displayName = 'Slider';
