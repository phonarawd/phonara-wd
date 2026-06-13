import { forwardRef, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Input, type InputProps } from './input';

export const gameStakeInputVariants = cva('flex flex-col', {
  variants: {
    density: {
      compact: 'gap-1.5',
      comfortable: 'gap-2',
    },
  },
  defaultVariants: {
    density: 'comfortable',
  },
});

export interface GameStakeInputProps
  extends Omit<InputProps, 'prefix' | 'suffix'>,
    VariantProps<typeof gameStakeInputVariants> {
  label: ReactNode;
  currency: ReactNode;
  hint?: ReactNode;
}

export const GameStakeInput = forwardRef<HTMLInputElement, GameStakeInputProps>(
  function GameStakeInput({ label, currency, hint, errorText, density, className, ...props }, ref) {
    return (
      <label className={cn(gameStakeInputVariants({ density }))}>
        <span className="text-sm font-medium text-fg">{label}</span>
        <Input
          ref={ref}
          monetary
          inputMode="decimal"
          suffix={(
            <span className="rounded-lg border border-border bg-surface-2 px-2 py-0.5 text-[0.7rem] font-semibold text-muted shadow-[var(--surface-highlight)]">
              {currency}
            </span>
          )}
          helperText={hint}
          errorText={errorText}
          className={cn('min-w-0 pr-20 text-right tabular-nums', className)}
          {...props}
        />
      </label>
    );
  },
);

GameStakeInput.displayName = 'GameStakeInput';
