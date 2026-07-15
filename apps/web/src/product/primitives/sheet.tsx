import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';

import { usePrefersReducedMotion } from './lib/use-prefers-reduced-motion';

import { cn } from './lib/cn';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

/**
 * R9-PERF-JS: CSS keyframes (`--ds-motion-*` in motion.css) replace framer-motion
 * here — see the matching comment in `dialog.tsx` for the full rationale.
 */
export const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const reduced = usePrefersReducedMotion() || import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
  const overlayClassName = cn(
    'fixed inset-0 z-50 bg-black/60',
    !reduced && 'ds-motion-overlay',
    className,
  );

  return <DialogPrimitive.Overlay ref={ref} className={overlayClassName} {...props} />;
});
SheetOverlay.displayName = 'SheetOverlay';

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const reduced = usePrefersReducedMotion() || import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
  const contentClassName = cn(
    'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col',
    !reduced && 'ds-motion-sheet-content',
    'rounded-t-(--ds-radius-lg) border border-line bg-surface-overlay shadow-overlay',
    'pb-[max(1rem,env(safe-area-inset-bottom))] focus:outline-none',
    className,
  );

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content ref={ref} className={contentClassName} {...props}>
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden />
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-(--ds-radius-sm) p-1 text-foreground-muted',
            'transition-opacity duration-(--ds-motion-press) hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          )}
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 px-4 pt-2', className)} {...props} />
);

export const SheetFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-foreground-muted', className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;
