import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { Button } from '@/product/primitives/button';
import { useT } from '@/lib/i18n';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** High-risk recap — amount, destination, etc. */
  summary?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  destructive?: boolean;
  /** Radix DialogContent test id — trade confirm focus-trap signoff (P3-E). */
  contentTestId?: string;
}

/** Unified high-risk confirmation grammar (§25.2 · UNIFIED_UX_CANON). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  summary,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  confirmDisabled = false,
  destructive = false,
  contentTestId,
}: ConfirmDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={contentTestId}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {summary ? (
          <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
            {summary}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? t('common.cta.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            disabled={confirmDisabled || loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.cta.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
