import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  AdminReasonDialog,
  AdminDataTable,
  AdminBulkActionBar,
  AdminMetricCard,
  AdminAuditTrail,
  AdminFilterBar,
  type AdminColumn,
  type AdminAuditEvent,
} from "@/components/admin/primitives";
import { createAdminMockHook } from "@/hooks/admin/createAdminMockHook";

beforeEach(() => {
  window.localStorage.clear();
});

interface Row {
  id: string;
  name: string;
  qty: number;
}

const ROWS: Row[] = [
  { id: "r1", name: "Alpha", qty: 5 },
  { id: "r2", name: "Bravo", qty: 12 },
  { id: "r3", name: "Charlie", qty: 3 },
];

const COLUMNS: AdminColumn<Row>[] = [
  { id: "name", header: "Name", cell: (r) => r.name },
  {
    id: "qty",
    header: "Qty",
    align: "right",
    sortable: true,
    sortValue: (r) => r.qty,
    cell: (r) => r.qty,
  },
];

describe("AdminReasonDialog", () => {
  it("disables confirm when reason < minLength (4)", () => {
    const onConfirm = vi.fn();
    render(
      <AdminReasonDialog
        open
        onOpenChange={() => {}}
        title="Suspend"
        onConfirm={onConfirm}
      />,
    );
    const confirm = screen.getByTestId("reason-confirm");
    expect(confirm).toBeDisabled();
    const input = screen.getByTestId("reason-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "abc" } });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("enables confirm + trims reason on confirm (>=4)", () => {
    const onConfirm = vi.fn();
    render(
      <AdminReasonDialog
        open
        onOpenChange={() => {}}
        title="Suspend"
        onConfirm={onConfirm}
      />,
    );
    const input = screen.getByTestId("reason-input");
    fireEvent.change(input, { target: { value: "  odds drift  " } });
    const confirm = screen.getByTestId("reason-confirm");
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("odds drift");
  });

  it("resets reason when re-opened", () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen((o) => !o)}>toggle</button>
          <AdminReasonDialog
            open={open}
            onOpenChange={setOpen}
            title="Reset"
            onConfirm={() => {}}
          />
        </>
      );
    }
    render(<Harness />);
    const input = screen.getByTestId("reason-input") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "leftover" } });
    expect(input.value).toBe("leftover");
    fireEvent.click(screen.getByText("toggle"));
    fireEvent.click(screen.getByText("toggle"));
    const next = screen.getByTestId("reason-input") as HTMLTextAreaElement;
    expect(next.value).toBe("");
  });
});

describe("AdminDataTable", () => {
  it("renders rows via rowKey", () => {
    render(
      <AdminDataTable<Row>
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(r) => r.id}
        rowTestId={(r) => `row-${r.id}`}
      />,
    );
    expect(screen.getByTestId("row-r1")).toBeInTheDocument();
    expect(screen.getByTestId("row-r2")).toBeInTheDocument();
    expect(screen.getByTestId("row-r3")).toBeInTheDocument();
  });

  it("supports individual + all selection toggling", () => {
    function Harness() {
      const [selected, setSelected] = useState<Set<string>>(new Set());
      return (
        <AdminDataTable<Row>
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(r) => r.id}
          selection={{
            selected,
            onToggle: (k) =>
              setSelected((p) => {
                const n = new Set(p);
                if (n.has(k)) n.delete(k);
                else n.add(k);
                return n;
              }),
            onToggleAll: (keys) =>
              setSelected((p) =>
                keys.every((k) => p.has(k)) ? new Set() : new Set(keys),
              ),
          }}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByTestId("admin-table-select-r1"));
    fireEvent.click(screen.getByTestId("admin-table-select-all"));
    // toggling all when only one selected → selects all
    expect(screen.getByTestId("admin-table-select-r2")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("renders empty slot when rows = []", () => {
    render(
      <AdminDataTable<Row>
        columns={COLUMNS}
        rows={[]}
        rowKey={(r) => r.id}
        empty="nothing here"
      />,
    );
    expect(screen.getByTestId("admin-table-empty")).toHaveTextContent(
      "nothing here",
    );
  });
});

describe("AdminBulkActionBar", () => {
  it("hides when count = 0 and shows when count >= 1", () => {
    const { rerender } = render(
      <AdminBulkActionBar
        count={0}
        actionLabel="Suspend"
        dialogTitle="Suspend"
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByTestId("admin-bulk-bar")).toBeNull();
    rerender(
      <AdminBulkActionBar
        count={3}
        actionLabel="Suspend"
        dialogTitle="Suspend"
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByTestId("admin-bulk-bar")).toBeInTheDocument();
  });

  it("invokes onConfirm with trimmed reason via dialog", () => {
    const onConfirm = vi.fn();
    render(
      <AdminBulkActionBar
        count={2}
        actionLabel="Suspend"
        dialogTitle="Suspend"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByTestId("admin-bulk-action"));
    fireEvent.change(screen.getByTestId("bulk-reason-input"), {
      target: { value: "bulk reason" },
    });
    fireEvent.click(screen.getByTestId("bulk-reason-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("bulk reason");
  });
});

describe("AdminMetricCard + AdminAuditTrail + AdminFilterBar", () => {
  it("AdminMetricCard renders label/value with no raw hex classes", () => {
    const { container } = render(
      <AdminMetricCard label="Total" value="₩100" tone="primary" />,
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("₩100")).toBeInTheDocument();
    // Sanity: no inline `style` with hex codes
    expect(container.innerHTML).not.toMatch(/style="[^"]*#[0-9a-fA-F]{3,6}/);
  });

  it("AdminAuditTrail shows empty + lists events", () => {
    const events: AdminAuditEvent[] = [
      {
        id: "e1",
        at: "2026-06-14T18:30:00.000Z",
        actorKey: "admin.primitive.audit.actor.system",
        actionKey: "admin.sports.audit.suspend",
        subject: "FX-1",
        reason: "feed anomaly",
      },
    ];
    const { rerender } = render(<AdminAuditTrail events={[]} />);
    expect(screen.getByTestId("admin-audit-empty")).toBeInTheDocument();
    rerender(<AdminAuditTrail events={events} />);
    expect(screen.getByTestId("admin-audit-list")).toBeInTheDocument();
    expect(screen.getByText("FX-1")).toBeInTheDocument();
    expect(screen.getByText("feed anomaly")).toBeInTheDocument();
  });

  it("AdminFilterBar toggles search + chip", () => {
    function Harness() {
      const [search, setSearch] = useState("");
      const [active, setActive] = useState(false);
      return (
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          chips={[
            {
              label: "Live",
              value: "live",
              active,
              onToggle: () => setActive((a) => !a),
            },
          ]}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByTestId("admin-filter-search") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("abc");
    const chip = screen.getByTestId("admin-filter-chip-live");
    expect(chip).toHaveAttribute("data-active", "false");
    fireEvent.click(chip);
    expect(screen.getByTestId("admin-filter-chip-live")).toHaveAttribute(
      "data-active",
      "true",
    );
  });
});

describe("createAdminMockHook", () => {
  interface F {
    q: string;
  }
  const useMock = createAdminMockHook<Row, F>({
    storageKey: "test:mock:v1",
    seedRows: ROWS,
    seedFilters: { q: "" },
    filterFn: (rows, f) =>
      f.q ? rows.filter((r) => r.name.includes(f.q)) : rows,
  });

  it("server snapshot = SEED · setFilters/patchRow/appendAudit work", async () => {
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useMock());
    act(() => {
      result.current.resetForTest();
    });
    expect(result.current.allRows.length).toBe(3);
    expect(result.current.rows.length).toBe(3);

    act(() => {
      result.current.setFilters({ q: "Alpha" });
    });
    expect(result.current.rows.length).toBe(1);
    expect(result.current.rows[0]!.name).toBe("Alpha");

    act(() => {
      result.current.patchRow("r1", (r) => r.id, (r) => ({ ...r, qty: 99 }));
    });
    expect(result.current.allRows.find((r) => r.id === "r1")!.qty).toBe(99);

    act(() => {
      result.current.appendAudit({
        id: "a1",
        at: "2026-06-14T00:00:00.000Z",
        actorKey: "admin.primitive.audit.actor.system",
        actionKey: "admin.sports.audit.suspend",
      });
    });
    expect(result.current.audit.length).toBe(1);
  });
});
