import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n";

export type ActivityItem = {
  id: string;
  kind: "self" | "notice";
  text: string;
  at: string;
};

export interface LiveActivityFeedProps {
  items: ActivityItem[];
  className?: string;
  emptyText?: string;
}

/**
 * Shows only:
 *  - the user's own activity
 *  - system notices
 *
 * Anonymous "other user" activity is intentionally NOT supported.
 */
export function LiveActivityFeed({
  items,
  className,
  emptyText = t("fomo.activity.empty"),
}: LiveActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground", className)}>
        {emptyText}
      </div>
    );
  }
  return (
    <ul className={cn("divide-y divide-border rounded-lg border border-border bg-(--color-surface)", className)}>
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {it.kind === "notice" && (
              <Badge className="bg-(--color-info)/15 text-(--color-info)">{t("fomo.activity.notice")}</Badge>
            )}
            <span className="truncate text-sm">{it.text}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{it.at}</span>
        </li>
      ))}
    </ul>
  );
}
