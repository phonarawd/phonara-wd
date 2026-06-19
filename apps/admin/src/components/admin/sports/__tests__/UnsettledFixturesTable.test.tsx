import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { UnsettledFixturesTable } from "@/components/admin/sports/UnsettledFixturesTable";
import { useAdminSportsMock } from "@/hooks/useAdminSportsMock";
import { renderHook, act } from "@testing-library/react";
import { renderAdmin as render } from "@/test/admin-test-render";

beforeEach(() => {
  window.localStorage.clear();
});

// L1-15-P0 T2 — Sports Desk 6요소 smoke (refactor reference impl).

function resetSportsMock() {
  const { result } = renderHook(() => useAdminSportsMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("UnsettledFixturesTable — 6 elements", () => {
  it("element 1+2: filter search narrows queue rows", () => {
    resetSportsMock();
    render(<UnsettledFixturesTable />);
    const search = screen.getByTestId("admin-filter-search") as HTMLInputElement;
    fireEvent.change(search, { target: { value: "Arsenal" } });
    expect(screen.getByTestId("fixture-row-FX-2026-0614-001")).toBeInTheDocument();
    expect(screen.queryByTestId("fixture-row-FX-2026-0614-002")).toBeNull();
  });

  it("element 1: status chip toggles activates filter", () => {
    resetSportsMock();
    render(<UnsettledFixturesTable />);
    const chip = screen.getByTestId("admin-filter-chip-live");
    expect(chip).toHaveAttribute("data-active", "false");
    fireEvent.click(chip);
    expect(screen.getByTestId("admin-filter-chip-live")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("element 3+4: row suspend opens reason dialog with ≥4 char gate", () => {
    const result = resetSportsMock();
    render(<UnsettledFixturesTable />);
    const firstId = result.current.fixtures[0]!.id;
    fireEvent.click(screen.getByTestId(`suspend-${firstId}`));
    const confirm = screen.getByTestId("suspend-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByTestId("suspend-reason"), {
      target: { value: "feed anomaly" },
    });
    expect(screen.getByTestId("suspend-confirm")).not.toBeDisabled();
  });

  it("element 5: audit trail lists suspended markets", () => {
    const r = resetSportsMock();
    act(() => {
      r.current.suspendMarket(r.current.fixtures[0]!.id, "feed anomaly");
    });
    render(<UnsettledFixturesTable />);
    const list = screen.getByTestId("admin-audit-list");
    expect(within(list).getByText("feed anomaly")).toBeInTheDocument();
  });

  it("element 6: bulk suspend across selected ids", () => {
    const r = resetSportsMock();
    render(<UnsettledFixturesTable />);
    const ids = r.current.fixtures.slice(0, 2).map((f) => f.id);
    ids.forEach((id) =>
      fireEvent.click(screen.getByTestId(`admin-table-select-${id}`)),
    );
    expect(screen.getByTestId("admin-bulk-bar")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("admin-bulk-action"));
    fireEvent.change(screen.getByTestId("bulk-reason-input"), {
      target: { value: "bulk suspension" },
    });
    fireEvent.click(screen.getByTestId("bulk-reason-confirm"));
    const { result: after } = renderHook(() => useAdminSportsMock());
    expect(after.current.suspended.length).toBeGreaterThanOrEqual(2);
  });

  it("MOCK chip is visible on queue section", () => {
    resetSportsMock();
    render(<UnsettledFixturesTable />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThanOrEqual(1);
  });
});
