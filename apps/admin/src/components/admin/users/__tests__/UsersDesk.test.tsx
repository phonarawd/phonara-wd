import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useAdminUsersDeskMock } from "@/hooks/admin/useAdminUsersDeskMock";
import { UsersDeskHub } from "@/components/admin/users/UsersDeskHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetMock() {
  const { result } = renderHook(() => useAdminUsersDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminUsersDeskMock", () => {
  it("SEED: ≥10 users · ≥6 active · ≥2 suspended · ≥1 banned · ≥3 mfa", () => {
    const r = resetMock();
    expect(r.current.users.length).toBeGreaterThanOrEqual(10);
    expect(
      r.current.users.filter((u) => u.status === "active").length,
    ).toBeGreaterThanOrEqual(6);
    expect(
      r.current.users.filter((u) => u.status === "suspended").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      r.current.users.filter((u) => u.status === "banned").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      r.current.users.filter((u) => u.mfaEnabled).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("balance fields are strings · no implicit numeric coercion", () => {
    const r = resetMock();
    for (const u of r.current.users) {
      expect(typeof u.balanceCash).toBe("string");
      expect(typeof u.balanceBonus).toBe("string");
      expect(typeof u.balanceLocked).toBe("string");
    }
  });

  it("suspendUser requires reason ≥4 + transitions active → suspended", () => {
    const r = resetMock();
    const id = r.current.users.find((u) => u.status === "active")!.id;
    act(() => r.current.suspendUser(id, "abc"));
    expect(r.current.users.find((u) => u.id === id)!.status).toBe("active");
    act(() => r.current.suspendUser(id, "vip review"));
    expect(r.current.users.find((u) => u.id === id)!.status).toBe("suspended");
    expect(r.current.audit[0]!.actionKey).toBe("admin.users.audit.suspend");
  });

  it("banUser blocks no-op on already banned", () => {
    const r = resetMock();
    const banned = r.current.users.find((u) => u.status === "banned")!;
    const before = r.current.audit.length;
    act(() => r.current.banUser(banned.id, "duplicate ban"));
    expect(r.current.audit.length).toBe(before);
  });

  it("unsuspendUser: suspended → active + audit", () => {
    const r = resetMock();
    const s = r.current.users.find((u) => u.status === "suspended")!;
    act(() => r.current.unsuspendUser(s.id, "appeal ok"));
    expect(r.current.users.find((u) => u.id === s.id)!.status).toBe("active");
    expect(r.current.audit[0]!.actionKey).toBe("admin.users.audit.unsuspend");
  });

  it("resetMfa flips mfaEnabled + audits", () => {
    const r = resetMock();
    const mfaUser = r.current.users.find((u) => u.mfaEnabled)!;
    act(() => r.current.resetMfa(mfaUser.id, "lost device"));
    expect(r.current.users.find((u) => u.id === mfaUser.id)!.mfaEnabled).toBe(
      false,
    );
    expect(r.current.audit[0]!.actionKey).toBe("admin.users.audit.mfaReset");
  });

  it("killSession zeroes activeSessions when >0", () => {
    const r = resetMock();
    const live = r.current.users.find((u) => u.activeSessions > 0)!;
    act(() => r.current.killSession(live.id, "device theft"));
    expect(
      r.current.users.find((u) => u.id === live.id)!.activeSessions,
    ).toBe(0);
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.users.audit.sessionKill",
    );
  });
});

describe("UsersDeskHub — 6 elements smoke", () => {
  it("renders filter · table · row suspend disabled (Tier C wire)", () => {
    resetMock();
    render(<UsersDeskHub />);
    expect(screen.getByTestId("admin-filter-search")).toBeInTheDocument();
    expect(
      screen.getByTestId("admin-filter-chip-status:active"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThanOrEqual(1);

    const suspendBtn = screen.getByTestId("suspend-u_8af201");
    expect((suspendBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("bulk bar appears after active row selection (UI loop)", () => {
    resetMock();
    render(<UsersDeskHub />);
    fireEvent.click(screen.getByTestId("admin-table-select-u_8af201"));
    expect(screen.getByTestId("users-bulk-suspend")).toBeInTheDocument();
    expect(screen.getByTestId("users-bulk-ban")).toBeInTheDocument();
  });

  it("drawer renders balance strings verbatim (no recompute)", () => {
    resetMock();
    render(<UsersDeskHub />);
    fireEvent.click(screen.getByTestId("users-row-u_3c911b"));
    const drawer = screen.getByTestId("admin-detail-drawer");
    // 5,840,000 / 120,000 / 240,000 — all formatted from STRINGS
    expect(within(drawer).getByText("₩5,840,000")).toBeInTheDocument();
    expect(within(drawer).getByText("₩120,000")).toBeInTheDocument();
    expect(within(drawer).getByText("₩240,000")).toBeInTheDocument();
  });
});
