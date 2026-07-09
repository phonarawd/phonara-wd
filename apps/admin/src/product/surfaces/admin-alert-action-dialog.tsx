import { useCallback, useId, useState } from 'react';

import { useT } from '@/product/i18n';
import type { AdminAlertRow } from '@/hooks/admin/useAdminAuditAlerts';
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
import { cn } from '@/product/primitives/lib/cn';

const MIN_REASON = 4;

export type AdminAlertActionMode = 'ack' | 'resolve';

export interface AdminAlertActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AdminAlertActionMode;
  alert: AdminAlertRow | null;
  loading?: boolean;
  onSubmit: (reason: string) => Promise<boolean>;
}

export function AdminAlertActionDialog({
  open,
  onOpenChange,
  mode,
  alert,
  loading = false,
  onSubmit,
}: AdminAlertActionDialogProps) {
  const t = useT();
  const reasonId = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const titleKey =
    mode === 'ack' ? 'admin.overview.dialog.alertAck' : 'admin.overview.dialog.alertResolve';
  const confirmKey =
    mode === 'ack' ? 'admin.overview.action.alertAck' : 'admin.overview.action.alertResolve';

  const reset = useCallback(() => {
    setReason('');
    setError(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (reason.trim().length < MIN_REASON) {
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
          {alert ? (
            <DialogDescription className="text-left">{alert.summary}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
            <p className="text-foreground-muted m-0 text-xs">{t('admin.overview.irreversible')}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-sm font-medium text-foreground">
              {t('admin.overview.reason.label')}
            </label>
            <Input
              id={reasonId}
              value={reason}
              invalid={error}
              onChange={(event) => {
                setReason(event.target.value);
                if (error && event.target.value.trim().length >= MIN_REASON) {
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
          <Button variant="primary" loading={loading} onClick={() => void handleConfirm()}>
            {t(confirmKey)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function healthStatusClass(status: 'ok' | 'warning' | 'critical'): string {
  return cn(
    'inline-flex items-center rounded-(--ds-radius-full) px-2.5 py-0.5 text-xs font-semibold',
    status === 'ok' && 'bg-success/15 text-success',
    status === 'warning' && 'bg-warning/15 text-warning',
    status === 'critical' && 'bg-danger/15 text-danger',
  );
}
