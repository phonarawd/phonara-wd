import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n";

// L1-15-P0 N1 — generic admin queue section wrapper.
// Sticky header · count badge · optional MOCK chip · semantic tokens only.

export interface AdminQueueSectionProps {
  title: string;
  count?: number;
  countAriaLabel?: string;
  subtitle?: string;
  severity?: "default" | "warn" | "crit";
  mockChip?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminQueueSection(props: AdminQueueSectionProps) {
  const severity = props.severity ?? "default";
  const badgeVariant =
    severity === "crit" ? "destructive" : severity === "warn" ? "default" : "secondary";

  return (
    <section
      aria-label={props.title}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{props.title}</h2>
          {typeof props.count === "number" ? (
            <Badge
              variant={badgeVariant as "default" | "secondary" | "destructive"}
              className="tabular-nums"
              aria-label={props.countAriaLabel ?? String(props.count)}
            >
              {props.count}
            </Badge>
          ) : null}
          {props.mockChip ? (
            <Badge
              variant="outline"
              className="border-(--color-primary)/40 text-[10px] uppercase tracking-wider"
              data-testid="mock-chip"
            >
              {t("admin.primitive.mock")}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {props.subtitle ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {props.subtitle}
            </span>
          ) : null}
          {props.actions}
        </div>
      </header>
      {props.children}
    </section>
  );
}
