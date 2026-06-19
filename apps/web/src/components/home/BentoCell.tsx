import type { ReactNode } from "react";
import { Link } from "@/shims/react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Phase 12-F.2 - Home Bento - shared cell wrapper.
 * Semantic OKLCH tokens only (no raw hex, no hardcoded colors).
 * Call sites pass `data-hub-id="home-<id>"` as a literal so rg
 * self-check (`data-hub-id="home-`) counts every cell statically.
 */
type Accent = "default" | "amber" | "primary";

const ACCENT: Record<Accent, string> = {
  default: "",
  amber: "border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-transparent",
  primary: "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
};

export interface BentoCellProps {
  "data-hub-id": string;
  to?: string;
  title: string;
  desc?: string;
  cta?: string;
  badge?: string;
  accent?: Accent;
  className?: string;
  children?: ReactNode;
}

export function BentoCell({
  "data-hub-id": hubId,
  to,
  title,
  desc,
  cta,
  badge,
  accent = "default",
  className = "",
  children,
}: BentoCellProps) {
  return (
    <Card
      data-hub-id={hubId}
      className={`${ACCENT[accent]} ${className}`.trim()}
    >
      <CardContent className="flex h-full items-center justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            {badge ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {badge}
              </span>
            ) : null}
          </div>
          {desc ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          ) : null}
          {children}
        </div>
        {to && cta ? (
          <Link
            to={to}
            className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-(--color-surface-elev)"
          >
            {cta}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
