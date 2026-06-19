import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminReasonDialog } from "./AdminReasonDialog";
import { t } from "@/i18n";

// L1-15-P0 N5 — sticky bottom bulk-action bar with reason gate.

export interface AdminBulkActionBarProps {
  count: number;
  actionLabel: string;
  dialogTitle: string;
  dialogDescription?: string;
  onConfirm: (reason: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  variant?: "destructive" | "default";
  reasonMinLength?: number;
}

export function AdminBulkActionBar(props: AdminBulkActionBarProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  if (props.count <= 0) return null;

  return (
    <>
      <div
        className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
        data-testid="admin-bulk-bar"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="tabular-nums">
            {props.count}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t("admin.primitive.bulk.selected")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {props.onClear ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onClear}
              data-testid="admin-bulk-clear"
            >
              {t("admin.primitive.bulk.clear")}
            </Button>
          ) : null}
          <Button
            variant={props.variant ?? "destructive"}
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={props.disabled}
            data-testid="admin-bulk-action"
          >
            {props.actionLabel}
          </Button>
        </div>
      </div>

      <AdminReasonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={props.dialogTitle}
        description={props.dialogDescription}
        minLength={props.reasonMinLength ?? 4}
        variant={props.variant ?? "destructive"}
        onConfirm={props.onConfirm}
        reasonInputTestId="bulk-reason-input"
        confirmTestId="bulk-reason-confirm"
      />
    </>
  );
}
