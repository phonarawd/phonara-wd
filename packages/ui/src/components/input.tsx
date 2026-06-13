import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const inputVariants = cva(
  [
    'w-full rounded-xl border bg-[var(--color-surface-inset)] text-fg outline-none shadow-[var(--surface-inset-shadow)]',
    'placeholder:text-[var(--color-text-subtle)]',
    'transition-[border-color,box-shadow,background-color]',
    'duration-[var(--motion-duration-confirmation)] ease-[var(--motion-ease-standard)]',
    'focus-visible:shadow-[0_0_0_var(--focus-ring-offset)_var(--color-bg),0_0_0_calc(var(--focus-ring-offset)+var(--focus-ring-width))_var(--focus-ring-color)]',
    'disabled:opacity-45 disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      inputSize: {
        sm: 'h-[var(--density-compact-control)] px-3 text-sm',
        md: 'h-[var(--density-comfortable-control)] px-3.5 text-sm',
        lg: 'h-[var(--density-comfortable-control-lg)] px-4 text-base',
      },
      invalid: {
        true: 'border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-surface-inset))] focus-visible:shadow-[0_0_0_var(--focus-ring-offset)_var(--color-bg),0_0_0_calc(var(--focus-ring-offset)+var(--focus-ring-width))_var(--color-danger)]',
        false: 'border-[var(--color-divider)]',
      },
      tone: {
        neutral: '',
        success: 'border-[var(--color-trust)] bg-[color-mix(in_srgb,var(--color-trust)_6%,var(--color-surface-inset))]',
      },
      monetary: {
        true: 'font-[var(--money-default-weight)] tabular-nums text-right',
        false: '',
      },
      hasPrefix: {
        true: 'pl-10',
        false: '',
      },
      hasSuffix: {
        true: 'pr-10',
        false: '',
      },
    },
    defaultVariants: {
      inputSize: 'md',
      invalid: false,
      tone: 'neutral',
      monetary: false,
      hasPrefix: false,
      hasSuffix: false,
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>,
    VariantProps<typeof inputVariants> {
  prefix?: ReactNode;
  suffix?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
}

/**
 * Token-based text input primitive. i18n-agnostic: the caller passes any
 * translated `placeholder`. Monetary fields set `monetary` for tabular nums.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    inputSize,
    invalid,
    tone,
    monetary,
    inputMode,
    prefix,
    suffix,
    helperText,
    errorText,
    id,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = helperText || errorText ? `${inputId}-message` : undefined;
  const isInvalid = Boolean(invalid || errorText);
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

  return (
    <span className="block w-full">
      <span className="relative block">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          inputMode={monetary ? (inputMode ?? 'decimal') : inputMode}
          autoComplete={monetary ? props.autoComplete ?? 'off' : props.autoComplete}
          className={cn(
            inputVariants({
              inputSize,
              invalid: isInvalid,
              tone,
              monetary,
              hasPrefix: Boolean(prefix),
              hasSuffix: Boolean(suffix),
            }),
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted">
            {suffix}
          </span>
        ) : null}
      </span>
      {helperText || errorText ? (
        <span
          id={messageId}
          className={cn(
            'mt-1.5 block text-[length:var(--text-caption)] leading-[var(--text-caption--line-height)]',
            errorText ? 'text-[var(--color-danger)]' : 'text-muted',
          )}
        >
          {errorText ?? helperText}
        </span>
      ) : null}
    </span>
  );
});

Input.displayName = 'Input';
