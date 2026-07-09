import { Link } from '@tanstack/react-router';
import { Check } from 'lucide-react';

import type { RoutineStepId } from '@/domain/home-attendance-display-contract';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type RoutineStepDisplay = {
  id: RoutineStepId;
  label: string;
  duration: string;
  route: string;
  done: boolean;
  current: boolean;
};

export type RoutineCardProps = {
  title: string;
  steps: RoutineStepDisplay[];
  className?: string;
};

/** §13.10.4 — today's side-hustle routine (presentation · hub order only). */
export function RoutineCard({ title, steps, className }: RoutineCardProps) {
  return (
    <Card data-testid="routine-card" className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-2 pt-0">
        {steps.map((step, index) => (
          <Link
            key={step.id}
            to={step.route}
            data-testid={`routine-step-${step.id}`}
            className={cn(
              'flex items-center gap-3 rounded-(--ds-radius-md) border px-3 py-2.5 transition-colors',
              step.current
                ? 'border-accent bg-accent/5'
                : step.done
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-surface-elevated hover:border-accent/40',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                step.done
                  ? 'bg-success text-success-foreground'
                  : step.current
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground-muted',
              )}
              aria-hidden
            >
              {step.done ? <Check className="size-4" /> : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-foreground block text-sm font-medium">{step.label}</span>
              <span className="text-foreground-muted block text-xs">{step.duration}</span>
            </span>
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
