import { ChevronRight, type LucideIcon } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type DepositPaymentMethodCardProps = {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  metaKey: MessageKey;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  ctaKey?: MessageKey;
  testId?: string;
};

/** Payment Method Card grammar — §PAYMENT_ARCHITECTURE_CANON §5. */
export function DepositPaymentMethodCard({
  titleKey,
  descriptionKey,
  metaKey,
  href,
  icon: Icon,
  disabled = false,
  ctaKey = 'wallet.deposit.rail.cta',
  testId,
}: DepositPaymentMethodCardProps) {
  const t = useT();

  const content = (
    <>
      <CardHeader className="flex-row items-start gap-3 pb-0">
        <span
          className="bg-accent/10 text-accent inline-flex size-11 shrink-0 items-center justify-center rounded-(--ds-radius-md)"
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{t(titleKey)}</CardTitle>
          <CardDescription className="mt-1">{t(descriptionKey)}</CardDescription>
        </div>
      </CardHeader>
      <CardBody className="pb-2 pt-3">
        <p className="text-foreground-muted m-0 text-xs">{t(metaKey)}</p>
      </CardBody>
      <CardFooter>
        <span
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'md' }),
            'w-full justify-between',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          {t(ctaKey)}
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </span>
      </CardFooter>
    </>
  );

  if (disabled) {
    return (
      <Card data-testid={testId} className="opacity-80" aria-disabled="true">
        {content}
      </Card>
    );
  }

  return (
    <a
      href={href}
      className="block rounded-(--ds-radius-lg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)"
      data-testid={testId}
    >
      <Card className="transition-[border-color,box-shadow] duration-(--ds-motion-surface) hover:border-accent/40 hover:shadow-md">
        {content}
      </Card>
    </a>
  );
}
