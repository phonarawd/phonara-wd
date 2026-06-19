/**
 * BetConfirmDialog — shared confirm modal used by every casino game.
 *
 * Exposes the three PHONARA testids and is mounted ONLY while
 * `open === true` so the unopened DOM stays clean (P1 §8.3).
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import type { Currency } from "./types";

export interface BetConfirmDialogProps {
  open: boolean;
  stake: string;
  currency: Currency;
  /** Game-specific selection summary (e.g. "자동 캐시아웃 2.00×"). */
  summary?: ReactNode;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BetConfirmDialog({
  open,
  stake,
  currency,
  summary,
  busy,
  onConfirm,
  onCancel,
}: BetConfirmDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent data-testid="casino-bet-confirm" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>베팅 확인</DialogTitle>
          <DialogDescription className="grid gap-1 pt-2 text-sm">
            <span className="flex items-baseline justify-between tabular-nums">
              <span className="text-muted-foreground">베팅</span>
              <span className="font-mono">
                {stake} {currency}
              </span>
            </span>
            {summary && (
              <span className="flex items-baseline justify-between text-muted-foreground">
                {summary}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="casino-bet-confirm-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            취소
          </Button>
          <Button
            type="button"
            data-testid="casino-bet-confirm-confirm"
            onClick={onConfirm}
            disabled={busy}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
