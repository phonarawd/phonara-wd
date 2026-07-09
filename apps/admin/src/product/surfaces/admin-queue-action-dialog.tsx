import { useCallback, useId, useState, type ReactNode } from 'react';

import { useT } from '@/product/i18n';
import type { MessageKey } from '@phonara/i18n';
import { Button } from '@/product/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { Input } from '@/product/primitives/input';

const DEFAULT_MIN_REASON = 4;

export interface AdminQueueActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleKey: MessageKey;
  confirmKey: MessageKey;
  summary?: ReactNode;
  loading?: boolean;
  destructive?: boolean;
  /** R3 manual wallet adjust requires ≥8 chars in engine RPC. */
  minReason?: number;
  onSubmit: (reason: string) => Promise<boolean>;
}

/** R2/R3 queue action — reason ≥4 chars + irreversible notice (§29.3). */
export function AdminQueueActionDialog({
  open,
  onOpenChange,
  titleKey,
  confirmKey,
  summary,
  loading = false,
  destructive = false,
  minReason = DEFAULT_MIN_REASON,
  onSubmit,
}: AdminQueueActionDialogProps) {
  const t = useT();
  const reasonId = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const reset = useCallback(() => {
    setReason('');
    setError(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (reason.trim().length < minReason) {
      setError(true);
      return;
    }
    const ok = await onSubmit(reason.trim());
    if (ok) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          {summary ? (
            <DialogDescription className="sr-only">{t(titleKey)}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-3">
          {summary ? (
            <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
              {summary}
            </div>
          ) : null}
          <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
            <p className="text-foreground-muted m-0 text-xs">{t('admin.overview.irreversible')}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-foreground text-sm font-medium">
              {t('admin.overview.reason.label')}
            </label>
            <Input
              id={reasonId}
              value={reason}
              invalid={error}
              onChange={(event) => {
                setReason(event.target.value);
                if (error && event.target.value.trim().length >= minReason) {
                  setError(false);
                }
              }}
              placeholder={t('admin.overview.reason.hint')}
              autoComplete="off"
            />
            {error ? (
              <p className="text-danger m-0 text-xs">{t('admin.overview.reason.required')}</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {t('common.cta.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            onClick={() => void handleConfirm()}
          >
            {t(confirmKey)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
