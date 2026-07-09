import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', invalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-11 w-full rounded-(--ds-radius-md) border border-line bg-surface px-3 py-2 text-base',
        'transition-[border-color,box-shadow] duration-(--ds-motion-field)',
        'placeholder:text-foreground-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
