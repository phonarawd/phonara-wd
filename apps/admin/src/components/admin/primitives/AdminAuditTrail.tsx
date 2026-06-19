import * as React from "react";
import { t } from "@/i18n";

// L1-15-P0 N7 — inline audit trail list. presentation-only.

export interface AdminAuditEvent {
  id: string;
  at: string; // ISO
  actorKey: string; // i18n key (e.g. admin.primitive.audit.actor.system)
  actionKey: string; // i18n key
  subject?: string;
  reason?: string;
}

export interface AdminAuditTrailProps {
  events: AdminAuditEvent[];
  emptyLabel?: string;
  ariaLabel?: string;
}

function formatAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return iso;
  }
}

export function AdminAuditTrail(props: AdminAuditTrailProps) {
  if (props.events.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground"
        data-testid="admin-audit-empty"
      >
        {props.emptyLabel ?? t("admin.primitive.audit.empty")}
      </div>
    );
  }

  return (
    <ul
      aria-label={props.ariaLabel ?? t("admin.primitive.audit.title")}
      className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
      data-testid="admin-audit-list"
    >
      {props.events.map((e) => (
        <li key={e.id} className="grid gap-1 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{t(e.actionKey)}</span>
              {e.subject ? (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {e.subject}
                </span>
              ) : null}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {formatAt(e.at)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{t(e.actorKey)}</span>
            {e.reason ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-foreground/80">{e.reason}</span>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
