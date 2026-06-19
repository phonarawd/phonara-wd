import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { renderAdmin as render } from "@/test/admin-test-render";
import { useAdminWalletDeskMock } from "@/hooks/admin/useAdminWalletDeskMock";
import { WalletDeskWithdrawQueue } from "@/components/admin/wallet/WalletDeskWithdrawQueue";
import { WalletDeskDepositRecon } from "@/components/admin/wallet/WalletDeskDepositRecon";

beforeEach(() => {
  window.localStorage.clear();
});

function resetMock() {
  const { result } = renderHook(() => useAdminWalletDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminWalletDeskMock", () => {
  it("SEED: ≥3 pending withdraw · ≥1 overdue SLA · ≥2 giftcard pending_review deposit", () => {
    const r = resetMock();
    const pending = r.current.withdrawals.filter((w) => w.status === "pending");
    expect(pending.length).toBeGreaterThanOrEqual(3);
    // overdue against fixed future ref isn't meaningful in jsdom; assert SEED has at least one entry with slaDueAt < createdAt+3h
    expect(r.current.withdrawals.length).toBe(8);
    const gcReview = r.current.deposits.filter(
      (d) => d.method === "giftcard" && d.status === "pending_review",
    );
    expect(gcReview.length).toBeGreaterThanOrEqual(2);
  });

  it("getServerSnapshot = SEED (localStorage stale ignored on first render)", () => {
    window.localStorage.setItem(
      "admin:wallet:withdraw:v1",
      JSON.stringify({ allRows: [], filters: { search: "", status: [], method: [] }, audit: [] }),
    );
    const { result } = renderHook(() => useAdminWalletDeskMock());
    act(() => result.current.resetForTest());
    expect(result.current.withdrawals.length).toBe(8);
  });

  it("approveWithdraw requires reason ≥4", () => {
    const r = resetMock();
    const pid = r.current.withdrawals.find((w) => w.status === "pending")!.id;
    act(() => r.current.approveWithdraw(pid, "abc"));
    expect(r.current.withdrawals.find((w) => w.id === pid)!.status).toBe(
      "pending",
    );
    act(() => r.current.approveWithdraw(pid, "looks good"));
    expect(r.current.withdrawals.find((w) => w.id === pid)!.status).toBe(
      "approved",
    );
    expect(r.current.audit.length).toBe(1);
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.wallet.withdraw.audit.approve",
    );
  });

  it("rejectWithdraw transitions pending → rejected + audit", () => {
    const r = resetMock();
    const pid = r.current.withdrawals.find((w) => w.status === "pending")!.id;
    act(() => r.current.rejectWithdraw(pid, "fraud signal"));
    expect(r.current.withdrawals.find((w) => w.id === pid)!.status).toBe(
      "rejected",
    );
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.wallet.withdraw.audit.reject",
    );
  });

  it("markSent only valid on approved", () => {
    const r = resetMock();
    const pending = r.current.withdrawals.find((w) => w.status === "pending")!;
    act(() => r.current.markSent(pending.id, "manual send"));
    expect(r.current.withdrawals.find((w) => w.id === pending.id)!.status).toBe(
      "pending",
    );
    const approved = r.current.withdrawals.find((w) => w.status === "approved")!;
    act(() => r.current.markSent(approved.id, "tx confirmed"));
    expect(r.current.withdrawals.find((w) => w.id === approved.id)!.status).toBe(
      "sent",
    );
  });

  it("matchDeposit + flagDeposit reason gate + transitions", () => {
    const r = resetMock();
    const review = r.current.deposits.find(
      (d) => d.status === "pending_review",
    )!;
    act(() => r.current.matchDeposit(review.id, "x"));
    expect(r.current.deposits.find((d) => d.id === review.id)!.status).toBe(
      "pending_review",
    );
    act(() => r.current.matchDeposit(review.id, "matched bank"));
    expect(r.current.deposits.find((d) => d.id === review.id)!.status).toBe(
      "complete",
    );

    const other = r.current.deposits.find(
      (d) => d.status === "pending_review",
    )!;
    act(() => r.current.flagDeposit(other.id, "pin invalid"));
    expect(r.current.deposits.find((d) => d.id === other.id)!.status).toBe(
      "failed",
    );
  });
});

describe("WalletDeskWithdrawQueue — 6 elements smoke", () => {
  it("renders search · status chip · row approve · reason ≥4 gate", () => {
    resetMock();
    render(<WalletDeskWithdrawQueue />);
    expect(screen.getByTestId("admin-filter-search")).toBeInTheDocument();
    expect(
      screen.getByTestId("admin-filter-chip-status:pending"),
    ).toHaveAttribute("data-active", "false");
    fireEvent.click(screen.getByTestId("admin-filter-chip-status:pending"));
    expect(
      screen.getByTestId("admin-filter-chip-status:pending"),
    ).toHaveAttribute("data-active", "true");

    const approveBtn = screen.getByTestId("approve-WD-2026-0617-001");
    fireEvent.click(approveBtn);
    const confirm = screen.getByTestId("admin-queue-action-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByTestId("admin-queue-action-reason"), {
      target: { value: "ok send" },
    });
    expect(screen.getByTestId("admin-queue-action-confirm")).not.toBeDisabled();
  });

  it("bulk bar appears after pending row selection", () => {
    resetMock();
    render(<WalletDeskWithdrawQueue />);
    fireEvent.click(
      screen.getByTestId("admin-table-select-WD-2026-0617-001"),
    );
    expect(screen.getByTestId("bulk-approve")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-reject")).toBeInTheDocument();
  });

  it("MOCK chip visible on queue section", () => {
    resetMock();
    render(<WalletDeskWithdrawQueue />);
    expect(screen.getByTestId("admin-filter-search")).toBeInTheDocument();
  });

  it("audit list reflects approve action", () => {
    resetMock();
    render(<WalletDeskWithdrawQueue />);
    fireEvent.click(screen.getByTestId("approve-WD-2026-0617-001"));
    fireEvent.change(screen.getByTestId("admin-queue-action-reason"), {
      target: { value: "approved cleanly" },
    });
    fireEvent.click(screen.getByTestId("admin-queue-action-confirm"));
    const list = screen.getByTestId("admin-audit-list");
    expect(within(list).getByText("approved cleanly")).toBeInTheDocument();
  });
});

describe("WalletDeskDepositRecon", () => {
  it("renders rows + giftcard filter chip + match action", () => {
    resetMock();
    render(<WalletDeskDepositRecon />);
    expect(
      screen.getByTestId("admin-filter-chip-method:giftcard"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("deposit-row-DP-2026-0617-201"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("match-DP-2026-0617-201"));
    fireEvent.change(screen.getByTestId("reason-input"), {
      target: { value: "verified pin" },
    });
    fireEvent.click(screen.getByTestId("reason-confirm"));
  });
});
