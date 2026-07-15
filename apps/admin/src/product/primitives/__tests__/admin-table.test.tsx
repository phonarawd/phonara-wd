import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminTable } from '@/product/primitives/admin-table';

type Row = { id: string; name: string; amount: string };

const ROWS: Row[] = [
  { id: 'a', name: 'Alpha', amount: '10' },
  { id: 'b', name: 'Beta', amount: '20' },
];

describe('AdminTable (§29.6)', () => {
  it('renders columns, rows, and row action slot', () => {
    const onAction = vi.fn();

    render(
      <AdminTable
        columns={[
          { id: 'name', header: 'Name', accessorKey: 'name' },
          {
            id: 'amount',
            header: 'Amount',
            cell: ({ row }) => <span className="tabular-nums">{row.amount}</span>,
            meta: { className: 'tabular-nums' },
          },
        ]}
        rows={ROWS}
        getRowId={(row) => row.id}
        minWidth={720}
        rowActionsHeader="Action"
        rowActions={(row) => (
          <button type="button" onClick={() => onAction(row.id)}>
            Act {row.name}
          </button>
        )}
      />,
    );

    expect(screen.getByTestId('admin-table')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Act Beta' }));
    expect(onAction).toHaveBeenCalledWith('b');
  });

  it('shows loading skeleton and empty slot', () => {
    const { rerender } = render(
      <AdminTable
        columns={[{ id: 'name', header: 'Name', accessorKey: 'name' }]}
        rows={[]}
        loading
        loadingRowCount={3}
      />,
    );

    expect(screen.getByTestId('admin-table-loading')).toBeTruthy();
    expect(screen.queryByTestId('admin-table')).toBeNull();

    rerender(
      <AdminTable
        columns={[{ id: 'name', header: 'Name', accessorKey: 'name' }]}
        rows={[]}
        empty={<p>Nothing here</p>}
      />,
    );

    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.queryByTestId('admin-table')).toBeNull();
  });

  it('supports optional client sort', () => {
    render(
      <AdminTable
        enableSorting
        columns={[
          {
            id: 'name',
            header: 'Name',
            accessorKey: 'name',
            enableSorting: true,
          },
        ]}
        rows={ROWS}
        getRowId={(row) => row.id}
      />,
    );

    const sortButton = screen.getByRole('button', { name: /Name/i });
    fireEvent.click(sortButton);
    const header = sortButton.closest('th');
    expect(header?.getAttribute('aria-sort')).toBe('ascending');
  });
});
