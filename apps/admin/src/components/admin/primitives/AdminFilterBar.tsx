import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

// L1-15-P0 N3 — search + chip toggle filter row.

export interface AdminFilterChip {
  label: string;
  value: string;
  active: boolean;
  onToggle: (value: string) => void;
}

export interface AdminFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  chips?: AdminFilterChip[];
  onReset?: () => void;
  searchTestId?: string;
}

export function AdminFilterBar(props: AdminFilterBarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-muted/20 px-4 py-3 md:flex-row md:items-center md:gap-3">
      <Input
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder={props.placeholder ?? t("admin.primitive.search.placeholder")}
        className="h-9 md:max-w-xs"
        data-testid={props.searchTestId ?? "admin-filter-search"}
      />
      {props.chips && props.chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {props.chips.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => c.onToggle(c.value)}
              data-testid={`admin-filter-chip-${c.value}`}
              data-active={c.active ? "true" : "false"}
              className={
                "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider cursor-pointer transition-colors " +
                (c.active
                  ? "border-(--color-primary) bg-(--color-primary)/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      {props.onReset ? (
        <Button
          variant="ghost"
          size="sm"
          className="md:ml-auto"
          onClick={props.onReset}
          data-testid="admin-filter-reset"
        >
          {t("admin.primitive.reset")}
        </Button>
      ) : null}
    </div>
  );
}
