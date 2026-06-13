import {
  forwardRef,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type UIEvent,
} from 'react';
import { cn } from '../lib/cn';
import { Icon } from './icon';
import { Skeleton } from './skeleton';

export interface ColumnDef<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
}

export interface DataTableProps<T> extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, i: number) => string | number;
  emptyState?: ReactNode;
  loading?: boolean;
  /** Compact row height */
  size?: 'sm' | 'md';
  density?: 'compact' | 'comfortable';
  stickyHeader?: boolean;
  maxBodyHeight?: string;
  onSort?: (columnKey: string) => void;
  virtualized?: boolean;
  estimatedRowHeight?: number;
  overscan?: number;
}

/**
 * DataTable — generic sortable/scrollable table for positions, orders, ledger entries.
 * All props generic over row type T. Column rendering via cell() function.
 */
function DataTableInner<T>(
  {
    columns,
    data,
    keyExtractor,
    emptyState,
    loading = false,
    size = 'md',
    density = size === 'sm' ? 'compact' : 'comfortable',
    stickyHeader = true,
    maxBodyHeight,
    onSort,
    virtualized = false,
    estimatedRowHeight,
    overscan = 6,
    className,
    ...rest
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const compact = density === 'compact' || size === 'sm';
  const rowCls = compact ? 'h-[var(--density-compact-row)] text-xs' : 'h-[var(--density-comfortable-row)] text-sm';
  const rowHeight = estimatedRowHeight ?? (compact ? 40 : 52);
  const [scrollState, setScrollState] = useState({ top: 0, height: 480 });
  const totalRows = data.length;
  const visibleWindow = useMemo(() => {
    if (!virtualized || totalRows === 0) {
      return { start: 0, end: totalRows, topPad: 0, bottomPad: 0, rows: data };
    }

    const start = Math.max(0, Math.floor(scrollState.top / rowHeight) - overscan);
    const visibleCount = Math.ceil(scrollState.height / rowHeight) + overscan * 2;
    const end = Math.min(totalRows, start + visibleCount);
    return {
      start,
      end,
      topPad: start * rowHeight,
      bottomPad: Math.max(0, (totalRows - end) * rowHeight),
      rows: data.slice(start, end),
    };
  }, [data, overscan, rowHeight, scrollState.height, scrollState.top, totalRows, virtualized]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (!virtualized) return;
    const target = event.currentTarget;
    setScrollState({ top: target.scrollTop, height: target.clientHeight });
  }

  return (
    <div
      ref={ref}
      className={cn('overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-highlight)]', className)}
      {...rest}
    >
      <div className="overflow-auto" style={{ maxHeight: maxBodyHeight }} onScroll={handleScroll}>
      <table className="w-full border-collapse">
        <thead>
          <tr className={cn('border-b border-border bg-surface-2', stickyHeader && 'sticky top-0 z-10')}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2.5 text-xs font-[var(--font-weight-label)] text-muted whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                )}
                aria-sort={
                  col.sortDirection === 'asc'
                    ? 'ascending'
                    : col.sortDirection === 'desc'
                      ? 'descending'
                      : undefined
                }
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg text-inherit transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      col.align === 'right' && 'justify-end',
                    )}
                    onClick={() => onSort?.(col.key)}
                    disabled={!onSort}
                  >
                    <span>{col.header}</span>
                    {col.sortDirection ? (
                      <Icon
                        name={col.sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'}
                        size="xs"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted text-sm"
              >
                <div className="grid gap-2" aria-hidden="true">
                  <Skeleton shape="line" />
                  <Skeleton shape="line" className="w-2/3" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted text-sm"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            <>
              {virtualized && visibleWindow.topPad > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={columns.length} style={{ height: visibleWindow.topPad }} />
                </tr>
              ) : null}
              {visibleWindow.rows.map((row, i) => {
                const rowIndex = visibleWindow.start + i;
                return (
                  <tr
                    key={keyExtractor(row, rowIndex)}
                    className={cn(
                      rowCls,
                      'border-b border-border/60 transition-colors last:border-0 hover:bg-surface/60',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 text-fg tabular-nums',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {virtualized && visibleWindow.bottomPad > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={columns.length} style={{ height: visibleWindow.bottomPad }} />
                </tr>
              ) : null}
            </>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export const DataTable = forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof DataTableInner>;

(DataTable as { displayName?: string }).displayName = 'DataTable';
