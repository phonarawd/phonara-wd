import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

import { Input, type InputProps } from '@/product/primitives/input';
import { cn } from '@/product/primitives/lib/cn';
import { useT } from '@/lib/i18n';
import type { MessageKey } from '@phonara/i18n';

export interface FieldProps<T extends FieldValues> extends Omit<InputProps, 'name'> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  /** i18n key for validation / server errors */
  errorKey?: MessageKey;
  rules?: RegisterOptions<T, FieldPath<T>>;
  hint?: string;
}

/** RHF Controller + Zod-friendly field shell (§25.2). */
export function Field<T extends FieldValues>({
  control,
  name,
  label,
  errorKey,
  rules,
  hint,
  className,
  id,
  ...inputProps
}: FieldProps<T>) {
  const t = useT();
  const fieldId = id ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        const errorText =
          typeof message === 'string' && message.startsWith('error.')
            ? t(message as MessageKey)
            : errorKey
              ? t(errorKey)
              : typeof message === 'string'
                ? message
                : undefined;

        return (
          <div className={cn('flex flex-col gap-1.5', className)}>
            <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
              {label}
            </label>
            <Input
              {...field}
              {...inputProps}
              id={fieldId}
              invalid={Boolean(fieldState.error)}
              value={field.value ?? ''}
            />
            {hint && !errorText ? <p className="text-xs text-foreground-muted">{hint}</p> : null}
            {errorText ? (
              <p className="text-xs text-danger" role="alert">
                {errorText}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
