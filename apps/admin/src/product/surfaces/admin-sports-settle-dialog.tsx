import { useCallback, useId, useState } from 'react';

import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/product/primitives/dialog';
import { Input } from '@/product/primitives/input';
import { Switch } from '@/product/primitives/switch';

const MIN_REASON = 4;

export interface AdminSportsSettleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixtureSummary: string;
  loading?: boolean;
  onSubmit: (
    homeGoals: number,
    awayGoals: number,
    reason: string,
    forceQuorum: boolean,
  ) => Promise<boolean>;
}

/** R3 quorum settlement — scores + optional force override (§29.2). */
export function AdminSportsSettleDialog({
  open,
  onOpenChange,
  fixtureSummary,
  loading = false,
  onSubmit,
}: AdminSportsSettleDialogProps) {
  const t = useT();
  const homeId = useId();
  const awayId = useId();
  const reasonId = useId();
  const forceId = useId();

  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [reason, setReason] = useState('');
  const [forceQuorum, setForceQuorum] = useState(false);
  const [reasonError, setReasonError] = useState(false);

  const reset = useCallback(() => {
    setHomeGoals('0');
    setAwayGoals('0');
    setReason('');
    setForceQuorum(false);
    setReasonError(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (reason.trim().length < MIN_REASON) {
      setReasonError(true);
      return;
    }
    const home = Number.parseInt(homeGoals, 10);
    const away = Number.parseInt(awayGoals, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) return;
    const ok = await onSubmit(home, away, reason.trim(), forceQuorum);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.sports.quorum.settle.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-foreground-muted m-0 text-sm">
            {t('admin.sports.quorum.settle.desc')}
          </p>
          <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
            <p className="text-foreground m-0 whitespace-pre-line">{fixtureSummary}</p>
          </div>
          <div className="rounded-(--ds-radius-md) border border-line bg-surface-raised p-4 text-sm">
            <p className="text-foreground-muted m-0 text-xs">{t('admin.overview.irreversible')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={homeId} className="text-foreground text-sm font-medium">
                {t('admin.sports.quorum.settle.homeGoals')}
              </label>
              <Input
                id={homeId}
                type="number"
                min={0}
                inputMode="numeric"
                value={homeGoals}
                onChange={(event) => setHomeGoals(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={awayId} className="text-foreground text-sm font-medium">
                {t('admin.sports.quorum.settle.awayGoals')}
              </label>
              <Input
                id={awayId}
                type="number"
                min={0}
                inputMode="numeric"
                value={awayGoals}
                onChange={(event) => setAwayGoals(event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id={forceId}
              checked={forceQuorum}
              onCheckedChange={setForceQuorum}
              aria-label={t('admin.sports.quorum.settle.forceQuorum')}
            />
            <label htmlFor={forceId} className="text-foreground text-sm">
              {t('admin.sports.quorum.settle.forceQuorum')}
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-foreground text-sm font-medium">
              {t('admin.overview.reason.label')}
            </label>
            <Input
              id={reasonId}
              value={reason}
              invalid={reasonError}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError && event.target.value.trim().length >= MIN_REASON) {
                  setReasonError(false);
                }
              }}
              placeholder={t('admin.sports.quorum.settle.reason.placeholder')}
              autoComplete="off"
            />
            {reasonError ? (
              <p className="text-danger m-0 text-xs">{t('admin.overview.reason.required')}</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {t('common.cta.cancel')}
          </Button>
          <Button variant="destructive" loading={loading} onClick={() => void handleConfirm()}>
            {t('admin.sports.quorum.settle.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
