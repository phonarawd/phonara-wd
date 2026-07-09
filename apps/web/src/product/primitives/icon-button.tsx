import type { ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Button, buttonVariants, type ButtonProps } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export interface IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    Pick<ButtonProps, 'variant' | 'size' | 'loading' | 'asChild'> {
  /** Required for icon-only controls (§25.2). */
  'aria-label': string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', children, asChild = false, ...props }, ref) => {
    const iconSizeClass = size === 'sm' ? 'size-9' : size === 'lg' ? 'size-12' : 'size-11';

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(
            buttonVariants({ variant: props.variant, size }),
            iconSizeClass,
            'p-0',
            className,
          )}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <Button ref={ref} size={size} className={cn(iconSizeClass, 'p-0', className)} {...props}>
        {children}
      </Button>
    );
  },
);
IconButton.displayName = 'IconButton';
