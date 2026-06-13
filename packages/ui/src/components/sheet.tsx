import {
  forwardRef,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { cn } from '../lib/cn';
import { mergeRefs } from '../lib/merge-refs';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface SheetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** @default 'bottom' */
  side?: 'bottom' | 'right';
}

/**
 * Sheet — mobile-first bottom / side drawer.
 * Renders a backdrop + sliding panel. Use for order panels, detail drawers, etc.
 */
export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  ({ open, onClose, title, children, side = 'bottom', className, ...rest }, ref) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const { body } = document;
      const prevOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
      const onKey = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      const panel = panelRef.current;
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
      return () => {
        body.style.overflow = prevOverflow;
        document.removeEventListener('keydown', onKey);
      };
    }, [open, onClose]);

    if (!open) return null;

    const isBottom = side === 'bottom';

    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[var(--glass-blur)]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={mergeRefs(panelRef, ref)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={cn(
            'relative z-10 flex flex-col border border-border bg-[var(--glass-panel-strong)] shadow-[var(--elevation-sheet)] outline-none',
            isBottom
              ? 'mt-auto max-h-[90dvh] w-full rounded-t-2xl animate-[pn-rise_var(--motion-duration-reveal)_var(--motion-ease-spring)_both]'
              : 'ml-auto h-full w-full max-w-sm rounded-l-2xl animate-[pn-rise_var(--motion-duration-reveal)_var(--motion-ease-spring)_both]',
            className,
          )}
          {...rest}
        >
          {isBottom && (
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>
          )}
          {title && (
            <div className="flex-shrink-0 border-b border-border px-[var(--density-comfortable-panel-padding)] pb-4 pt-3">
              <p className="text-base font-semibold text-fg">{title}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-[var(--density-comfortable-panel-padding)]">{children}</div>
        </div>
      </div>
    );
  },
);
Sheet.displayName = 'Sheet';
