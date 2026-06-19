import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { t } from "@/i18n";

// L1-15-P0 N2 — generic admin data table.
// tabular-nums · sortable columns · optional selection · horizontal scroll on mobile.

export interface AdminColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export interface AdminDataTableSelection {
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (allKeys: string[]) => void;
}

export interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selection?: AdminDataTableSelection;
  empty?: React.ReactNode;
  rowTestId?: (row: T) => string;
  ariaLabel?: string;
  tableTestId?: string;
  /** Reserved for L1-15-J hotkey work. Default false. */
  enableHotkeys?: boolean;
}

type SortDir = "asc" | "desc" | null;

export function AdminDataTable<T>(props: AdminDataTableProps<T>) {
  const [sortId, setSortId] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);

  const sortedRows = React.useMemo(() => {
    if (!sortId || !sortDir) return props.rows;
    const col = props.columns.find((c) => c.id === sortId);
    if (!col?.sortable || !col.sortValue) return props.rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...props.rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [props.rows, props.columns, sortId, sortDir]);

  const handleSort = (colId: string) => {
    if (sortId !== colId) {
      setSortId(colId);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
  };

  if (props.rows.length === 0) {
    return (
      <div
        className="grid place-items-center p-10 text-center text-sm text-muted-foreground"
        data-testid="admin-table-empty"
      >
        {props.empty ?? t("admin.primitive.table.empty")}
      </div>
    );
  }

  const allKeys = props.rows.map(props.rowKey);
  const allSelected =
    props.selection && allKeys.length > 0
      ? allKeys.every((k) => props.selection!.selected.has(k))
      : false;

  return (
    <div className="min-w-0 overflow-x-auto">
      <table
        className="w-full min-w-[640px] text-sm md:min-w-0"
        aria-label={props.ariaLabel}
        data-testid={props.tableTestId}
      >
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            {props.selection ? (
              <th className="w-8 px-3 py-2 text-left font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => props.selection!.onToggleAll(allKeys)}
                  aria-label={t("admin.primitive.table.selectAll")}
                  data-testid="admin-table-select-all"
                />
              </th>
            ) : null}
            {props.columns.map((c) => {
              const isActive = sortId === c.id && sortDir !== null;
              const arrow = isActive ? (sortDir === "asc" ? " ▲" : " ▼") : "";
              return (
                <th
                  key={c.id}
                  className={
                    "px-4 py-2 font-medium " +
                    (c.align === "right" ? "text-right" : "text-left") +
                    (c.headerClassName ? " " + c.headerClassName : "")
                  }
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(c.id)}
                      className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
                      data-testid={`admin-table-sort-${c.id}`}
                    >
                      {c.header}
                      <span aria-hidden="true">{arrow}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const key = props.rowKey(row);
            const isSelected = props.selection?.selected.has(key) ?? false;
            return (
              <tr
                key={key}
                className={
                  "border-b border-border last:border-b-0 hover:bg-muted/30 " +
                  (props.onRowClick ? "cursor-pointer " : "") +
                  (isSelected ? "bg-(--color-primary)/5" : "")
                }
                data-testid={props.rowTestId?.(row)}
                onClick={(e) => {
                  const tgt = e.target as HTMLElement;
                  if (tgt.closest("button,input,[role=checkbox],a")) return;
                  props.onRowClick?.(row);
                }}
              >
                {props.selection ? (
                  <td className="w-8 px-3 py-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => props.selection!.onToggle(key)}
                      aria-label={t("admin.primitive.table.selectRow")}
                      data-testid={`admin-table-select-${key}`}
                    />
                  </td>
                ) : null}
                {props.columns.map((c) => (
                  <td
                    key={c.id}
                    className={
                      "px-4 py-2 " +
                      (c.align === "right" ? "text-right tabular-nums" : "") +
                      (c.className ? " " + c.className : "")
                    }
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
