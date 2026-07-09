import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/product/primitives/lib/cn';

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-line',
      'bg-surface-raised transition-[background-color] duration-(--ds-motion-toggle)',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-accent',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-5 translate-x-0.5 rounded-full bg-foreground shadow-sm',
        'transition-transform duration-(--ds-motion-toggle)',
        'data-[state=checked]:translate-x-[1.375rem] data-[state=checked]:bg-accent-foreground',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
