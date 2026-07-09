import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';

import { cn } from './lib/cn';
import { usePrefersReducedMotion } from './lib/use-prefers-reduced-motion';
import {
  dialogContentMotionVariants,
  dialogMotionTransition,
  overlayMotionTransition,
  overlayMotionVariants,
} from './lib/motion-presets';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const reduced = usePrefersReducedMotion() || import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
  const overlayClassName = cn('fixed inset-0 z-50 bg-black/60', className);

  return (
    <DialogPrimitive.Overlay ref={ref} asChild {...props}>
      {reduced ? (
        <div className={overlayClassName} />
      ) : (
        <motion.div
          className={overlayClassName}
          variants={overlayMotionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={overlayMotionTransition}
        />
      )}
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const reduced = usePrefersReducedMotion() || import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
  const contentClassName = cn(
    'fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
    'gap-4 rounded-(--ds-radius-lg) border border-line bg-surface-overlay p-6 shadow-overlay',
    'focus:outline-none',
    className,
  );
  const dialogBody = (
    <>
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-4 top-4 rounded-(--ds-radius-sm) p-1 text-foreground-muted',
          'transition-opacity duration-(--ds-motion-press) hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ds-focus)',
        )}
      >
        <X className="size-4" aria-hidden />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </>
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        {reduced ? (
          <div className={contentClassName}>{dialogBody}</div>
        ) : (
          <motion.div
            className={contentClassName}
            variants={dialogContentMotionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={dialogMotionTransition}
          >
            {dialogBody}
          </motion.div>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-foreground-muted', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
