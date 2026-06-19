import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { t } from "@/i18n";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-(--color-surface)/50 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-(--color-surface-elev) text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="grid gap-1">
        <div className="text-sm font-medium text-foreground">
          {title ?? t("state.empty.title")}
        </div>
        {description !== undefined || title === undefined ? (
          <div className="text-xs text-muted-foreground">
            {description ?? t("state.empty.description")}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
