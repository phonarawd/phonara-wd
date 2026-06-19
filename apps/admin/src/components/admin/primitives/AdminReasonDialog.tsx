import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";

// L1-15-P0 N6 — reusable reason-required confirm dialog.
// F2 LOCK: minLength default = 4 · trim before length check.

export interface AdminReasonDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  subject?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  minLength?: number;
  variant?: "destructive" | "default";
  onConfirm: (reason: string) => void | Promise<void | boolean>;
  reasonInputTestId?: string;
  confirmTestId?: string;
  placeholder?: string;
}

export function AdminReasonDialog(props: AdminReasonDialogProps) {
  const minLength = props.minLength ?? 4;
  const variant = props.variant ?? "destructive";
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (props.open) setReason("");
  }, [props.open]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < minLength;

  const handleConfirm = () => {
    if (tooShort) return;
    void (async () => {
      const result = await props.onConfirm(trimmed);
      if (result === false) return;
      props.onOpenChange(false);
    })();
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description ? (
            <DialogDescription>{props.description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {props.subject ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {props.subject}
          </div>
        ) : null}

        <div className="grid gap-2">
          <label
            htmlFor="admin-reason-input"
            className="text-xs font-medium text-muted-foreground"
          >
            {t("admin.primitive.reason.label")}
          </label>
          <Textarea
            id="admin-reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              props.placeholder ?? t("admin.primitive.reason.placeholder")
            }
            rows={3}
            data-testid={props.reasonInputTestId ?? "reason-input"}
          />
          <p
            className={
              tooShort
                ? "text-[11px] text-(--color-destructive)"
                : "text-[11px] text-muted-foreground"
            }
          >
            {t("admin.primitive.reason.hint", { min: minLength })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => props.onOpenChange(false)}>
            {props.cancelLabel ?? t("admin.primitive.bulk.cancel")}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={tooShort}
            data-testid={props.confirmTestId ?? "reason-confirm"}
          >
            {props.confirmLabel ?? t("admin.primitive.bulk.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
