/**
 * AdminTable — single shared desk list primitive (§29.6).
 * Desk surfaces must use this only — native `<table>` / local LoadingTable forbidden.
 */
import { useMemo, useState, type ReactNode } from 'react';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';

import { cn } from '@/product/primitives/lib/cn';
import { Skeleton } from '@/product/primitives/skeleton';

export type AdminTableColumnMeta = {
  className?: string;
  headerClassName?: string;
};

export type AdminTableColumn<TData extends object> = {
  id: string;
  header: ReactNode;
  accessorKey?: keyof TData & string;
  cell?: (ctx: { row: TData; rowIndex: number }) => ReactNode;
  enableSorting?: boolean;
  meta?: AdminTableColumnMeta;
};

export type AdminTableProps<TData extends object> = {
  columns: AdminTableColumn<TData>[];
  rows: TData[];
  getRowId?: (row: TData, index: number) => string;
  /** Optional `data-testid` on each body `<tr>` (desk E2E / vitest hooks). */
  getRowTestId?: (row: TData, index: number) => string | undefined;
  loading?: boolean;
  /** Skeleton rows while loading (default 5). */
  loadingRowCount?: number;
  /** Shown when not loading and rows are empty. */
  empty?: ReactNode;
  /** Horizontal scroll breakpoint — CSS length or px number (default 640). */
  minWidth?: number | string;
  /** Opt-in client sort via @tanstack/react-table. */
  enableSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Last-column action slot (buttons / menus). */
  rowActions?: (row: TData, index: number) => ReactNode;
  rowActionsHeader?: ReactNode;
  onRowClick?: (row: TData, index: number) => void;
  getRowClassName?: (row: TData, index: number) => string | undefined;
  className?: string;
  'aria-label'?: string;
};

function formatMinWidth(minWidth: number | string): string {
  return typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
}

function AdminTableLoadingSkeleton({
  columnCount,
  rowCount,
}: {
  columnCount: number;
  rowCount: number;
}) {
  return (
    <div className="space-y-2" aria-busy="true" data-testid="admin-table-loading">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columnCount }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function toTanstackColumns<TData extends object>(
  columns: AdminTableColumn<TData>[],
  rowActions: AdminTableProps<TData>['rowActions'],
  rowActionsHeader: ReactNode,
): ColumnDef<TData, unknown>[] {
  const defs: ColumnDef<TData, unknown>[] = columns.map((column) => ({
    id: column.id,
    accessorKey: column.accessorKey,
    header: () => column.header,
    enableSorting: column.enableSorting ?? false,
    meta: column.meta,
    cell: ({ row }) => {
      if (column.cell) {
        return column.cell({ row: row.original, rowIndex: row.index });
      }
      if (column.accessorKey) {
        const value = row.original[column.accessorKey];
        return value == null ? '—' : String(value);
      }
      return null;
    },
  }));

  if (rowActions) {
    defs.push({
      id: '__admin_row_actions',
      header: () => rowActionsHeader ?? null,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">{rowActions(row.original, row.index)}</div>
      ),
    });
  }

  return defs;
}

/** Dense exception-queue / desk list table — §29.6 contract. */
export function AdminTable<TData extends object>({
  columns,
  rows,
  getRowId,
  getRowTestId,
  loading = false,
  loadingRowCount = 5,
  empty,
  minWidth = 640,
  enableSorting = false,
  sorting: sortingProp,
  onSortingChange,
  rowActions,
  rowActionsHeader,
  onRowClick,
  getRowClassName,
  className,
  'aria-label': ariaLabel,
}: AdminTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = sortingProp ?? internalSorting;
  const handleSortingChange = onSortingChange ?? setInternalSorting;

  const columnCount = columns.length + (rowActions ? 1 : 0);

  const columnDefs = useMemo(
    () => toTanstackColumns(columns, rowActions, rowActionsHeader),
    [columns, rowActions, rowActionsHeader],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: enableSorting || sortingProp !== undefined ? { sorting } : undefined,
    onSortingChange: enableSorting || sortingProp !== undefined ? handleSortingChange : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting || sortingProp !== undefined ? getSortedRowModel() : undefined,
    getRowId: getRowId ? (row, index) => getRowId(row, index) : (_row, index) => String(index),
    enableSorting,
  });

  if (loading) {
    return <AdminTableLoadingSkeleton columnCount={columnCount} rowCount={loadingRowCount} />;
  }

  if (rows.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <div
      className={cn('overflow-x-auto rounded-(--ds-radius-lg) border border-line', className)}
      data-testid="admin-table"
    >
      <table
        className="w-full border-collapse text-left text-sm"
        style={{ minWidth: formatMinWidth(minWidth) }}
        aria-label={ariaLabel}
      >
        <thead className="bg-surface-raised text-foreground-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as AdminTableColumnMeta | undefined;
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn('px-4 py-3 font-medium', meta?.headerClassName)}
                    aria-sort={
                      canSort
                        ? sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="text-foreground-muted hover:text-foreground inline-flex items-center gap-1 font-medium"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ''}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-line border-t',
                onRowClick && 'cursor-pointer',
                getRowClassName?.(row.original, row.index),
              )}
              data-testid={getRowTestId?.(row.original, row.index)}
              onClick={onRowClick ? () => onRowClick(row.original, row.index) : undefined}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as AdminTableColumnMeta | undefined;
                const isActions = cell.column.id === '__admin_row_actions';
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-4 py-3',
                      isActions ? undefined : 'text-foreground',
                      meta?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
