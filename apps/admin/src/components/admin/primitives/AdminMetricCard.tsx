import * as React from "react";

// L1-15-P0 N8 — KPI metric card. semantic tokens · tabular-nums.

export interface AdminMetricCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: "default" | "primary" | "warn" | "crit";
  srLabel?: string;
  testId?: string;
}

const TONE: Record<NonNullable<AdminMetricCardProps["tone"]>, string> = {
  default: "border-border bg-card",
  primary: "border-(--color-primary)/30 bg-(--color-primary)/5",
  warn: "border-(--color-warning)/30 bg-(--color-warning)/5",
  crit: "border-(--color-destructive)/30 bg-(--color-destructive)/5",
};

export function AdminMetricCard(props: AdminMetricCardProps) {
  const tone = props.tone ?? "default";
  return (
    <div
      className={"rounded-xl border p-4 " + TONE[tone]}
      data-testid={props.testId}
      aria-label={props.srLabel ?? props.label}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {props.label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {props.value}
      </div>
      {props.delta ? (
        <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          {props.delta}
        </div>
      ) : null}
    </div>
  );
}
