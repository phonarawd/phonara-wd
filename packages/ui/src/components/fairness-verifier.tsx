import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Icon, type IconName } from './icon';

export const fairnessVerifierVariants = cva(
  'rounded-2xl border p-4 shadow-[var(--elevation-1)]',
  {
    variants: {
      state: {
        pending: 'border-border bg-surface/90',
        verified: 'border-up/35 bg-up/10',
        mismatch: 'border-down/35 bg-down/10',
      },
      density: {
        compact: 'p-3',
        comfortable: 'p-4',
      },
    },
    defaultVariants: {
      state: 'pending',
      density: 'comfortable',
    },
  },
);

export interface FairnessVerifierProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof fairnessVerifierVariants> {
  title: ReactNode;
  description?: ReactNode;
  seedHashLabel: ReactNode;
  seedHash: ReactNode;
  serverSeedLabel?: ReactNode;
  serverSeed?: ReactNode;
  resultLabel?: ReactNode;
  result?: ReactNode;
  statusLabel: ReactNode;
  verified?: boolean | null;
}

function SequenceStep({
  label,
  complete,
  failed,
}: {
  label: ReactNode;
  complete: boolean;
  failed?: boolean;
}) {
  const icon: IconName = failed ? 'alert' : complete ? 'check' : 'activity';
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs',
        failed
          ? 'border-down/35 bg-down/10 text-down'
          : complete
            ? 'border-up/35 bg-up/10 text-up'
            : 'border-border bg-surface-2/70 text-muted',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/30 bg-surface/60">
        <Icon name={icon} size="xs" />
      </span>
      <span className="truncate font-semibold">{label}</span>
    </li>
  );
}

export const FairnessVerifier = forwardRef<HTMLDivElement, FairnessVerifierProps>(
  function FairnessVerifier(
    {
      title,
      description,
      seedHashLabel,
      seedHash,
      serverSeedLabel,
      serverSeed,
      resultLabel,
      result,
      statusLabel,
      verified,
      state,
      density,
      className,
      ...props
    },
    ref,
  ) {
    const resolvedState = state ?? (verified === false ? 'mismatch' : verified ? 'verified' : 'pending');
    const hasServerSeed = Boolean(serverSeedLabel && serverSeed);

    return (
      <div
        ref={ref}
        className={cn(fairnessVerifierVariants({ state: resolvedState, density }), className)}
        data-state={resolvedState}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-fg">{title}</h3>
            {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
          </div>
          <Badge tone={verified === false ? 'down' : verified ? 'up' : 'neutral'} size="sm" density="compact">
            {statusLabel}
          </Badge>
        </div>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          <SequenceStep label={seedHashLabel} complete />
          {serverSeedLabel ? <SequenceStep label={serverSeedLabel} complete={hasServerSeed} /> : null}
          {resultLabel ? <SequenceStep label={resultLabel} complete={Boolean(verified)} failed={verified === false} /> : null}
        </ol>
        <dl className="mt-3 flex flex-col gap-2 text-xs">
          <div className="rounded-xl border border-border bg-surface-inset px-3 py-2">
            <dt className="text-muted">{seedHashLabel}</dt>
            <dd className="break-all font-mono text-fg">{seedHash}</dd>
          </div>
          {serverSeedLabel && serverSeed ? (
            <div className="rounded-xl border border-border bg-surface-inset px-3 py-2">
              <dt className="text-muted">{serverSeedLabel}</dt>
              <dd className="break-all font-mono text-fg">{serverSeed}</dd>
            </div>
          ) : null}
          {resultLabel && result ? (
            <div className="rounded-xl border border-border bg-surface-inset px-3 py-2">
              <dt className="text-muted">{resultLabel}</dt>
              <dd className="break-all font-mono text-fg">{result}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    );
  },
);

FairnessVerifier.displayName = 'FairnessVerifier';
