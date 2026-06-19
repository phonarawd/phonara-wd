import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useAdminEarnDeskMock } from "@/hooks/admin/useAdminEarnDeskMock";
import { EarnDeskHub } from "@/components/admin/earn/EarnDeskHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetHook() {
  const { result } = renderHook(() => useAdminEarnDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminEarnDeskMock — SEED", () => {
  it("T1: agents SEED ≥10 with tier + status + depth mix", () => {
    const r = resetHook();
    expect(r.current.agents.length).toBeGreaterThanOrEqual(10);
    const tiers = new Set(r.current.agents.map((a) => a.tier));
    expect(tiers.size).toBe(4);
    const pending = r.current.agents.filter((a) => a.status === "pending").length;
    const active = r.current.agents.filter((a) => a.status === "active").length;
    const suspended = r.current.agents.filter((a) => a.status === "suspended").length;
    const depth2 = r.current.agents.filter((a) => a.treeDepth === "2").length;
    expect(pending).toBeGreaterThanOrEqual(3);
    expect(active).toBeGreaterThanOrEqual(5);
    expect(suspended).toBeGreaterThanOrEqual(2);
    expect(depth2).toBeGreaterThanOrEqual(4);
  });

  it("T2: settlements SEED ≥8 with state mix", () => {
    const r = resetHook();
    expect(r.current.settlements.length).toBeGreaterThanOrEqual(8);
    const pending = r.current.settlements.filter((s) => s.state === "pending").length;
    const approved = r.current.settlements.filter((s) => s.state === "approved").length;
    const paid = r.current.settlements.filter((s) => s.state === "paid").length;
    expect(pending).toBeGreaterThanOrEqual(3);
    expect(approved).toBeGreaterThanOrEqual(2);
    expect(paid).toBeGreaterThanOrEqual(2);
  });
});

describe("useAdminEarnDeskMock — filters", () => {
  it("T3: agents filter narrows by tier/status/search", () => {
    const r = resetHook();
    act(() => r.current.setAgentFilters((p) => ({ ...p, tier: "gold" })));
    expect(r.current.filteredAgents.every((a) => a.tier === "gold")).toBe(true);
    act(() =>
      r.current.setAgentFilters({ search: "", tier: "all", status: "pending" }),
    );
    expect(r.current.filteredAgents.every((a) => a.status === "pending")).toBe(true);
    act(() =>
      r.current.setAgentFilters({ search: "PHN-A001", tier: "all", status: "all" }),
    );
    expect(
      r.current.filteredAgents.every((a) => a.agentCode.includes("PHN-A001")),
    ).toBe(true);
  });

  it("T4: settlements filter narrows by state/search", () => {
    const r = resetHook();
    act(() => r.current.setSettlementFilters((p) => ({ ...p, state: "paid" })));
    expect(r.current.filteredSettlements.every((s) => s.state === "paid")).toBe(true);
    act(() => r.current.setSettlementFilters({ search: "2026-06", state: "all" }));
    expect(
      r.current.filteredSettlements.every((s) => s.periodKey === "2026-06"),
    ).toBe(true);
  });
});

describe("useAdminEarnDeskMock — agent mutations", () => {
  it("T5: suspendAgent requires reason ≥4 + audit subject = agentCode", () => {
    const r = resetHook();
    const target = r.current.agents.find((a) => a.status === "active")!;
    let ok = true;
    act(() => {
      ok = r.current.suspendAgent(target.id, "no");
    });
    expect(ok).toBe(false);
    expect(r.current.agents.find((a) => a.id === target.id)!.status).toBe("active");
    act(() => {
      r.current.suspendAgent(target.id, "fraud alert flagged");
    });
    expect(r.current.agents.find((a) => a.id === target.id)!.status).toBe("suspended");
    expect(r.current.audit[0]!.subject).toBe(target.agentCode);
    expect(r.current.audit[0]!.actionKey).toBe("admin.earn.agents.audit.suspend");
  });

  it("T6: setAgentTier reason<4 throws gate + bulk suspend gated", () => {
    const r = resetHook();
    const target = r.current.agents.find((a) => a.tier === "silver")!;
    let ok = true;
    act(() => {
      ok = r.current.setAgentTier(target.id, "gold", "x");
    });
    expect(ok).toBe(false);
    expect(r.current.agents.find((a) => a.id === target.id)!.tier).toBe("silver");
    act(() => {
      r.current.setAgentTier(target.id, "gold", "promo cycle");
    });
    expect(r.current.agents.find((a) => a.id === target.id)!.tier).toBe("gold");

    const ids = r.current.agents
      .filter((a) => a.status === "active")
      .map((a) => a.id);
    let bulkOk = true;
    act(() => {
      bulkOk = r.current.bulkSuspendAgents(ids, "ok");
    });
    expect(bulkOk).toBe(false);
  });

  it("T7: approveAgent transitions pending→active · only pending eligible", () => {
    const r = resetHook();
    const pendingAgent = r.current.agents.find((a) => a.status === "pending")!;
    act(() => {
      r.current.approveAgent(pendingAgent.id);
    });
    expect(r.current.agents.find((a) => a.id === pendingAgent.id)!.status).toBe(
      "active",
    );
    const activeAgent = r.current.agents.find(
      (a) => a.status === "active" && a.id !== pendingAgent.id,
    )!;
    let ok = true;
    act(() => {
      ok = r.current.approveAgent(activeAgent.id);
    });
    expect(ok).toBe(false);
  });
});

describe("useAdminEarnDeskMock — settlement mutations", () => {
  it("T8: markSettlementPaid requires reason ≥4 + audit subject = agentCode", () => {
    const r = resetHook();
    const approved = r.current.settlements.find((s) => s.state === "approved")!;
    let ok = true;
    act(() => {
      ok = r.current.markSettlementPaid(approved.id, "ok");
    });
    expect(ok).toBe(false);
    expect(r.current.settlements.find((s) => s.id === approved.id)!.state).toBe(
      "approved",
    );
    act(() => {
      r.current.markSettlementPaid(approved.id, "wire transfer cleared");
    });
    expect(r.current.settlements.find((s) => s.id === approved.id)!.state).toBe(
      "paid",
    );
    expect(r.current.audit[0]!.subject).toBe(approved.agentCode);
    expect(r.current.audit[0]!.actionKey).toBe("admin.earn.settlements.audit.paid");
  });

  it("T9: rejectSettlement reason gated · approveSettlement transitions pending→approved", () => {
    const r = resetHook();
    const pending = r.current.settlements.find((s) => s.state === "pending")!;
    act(() => {
      r.current.approveSettlement(pending.id);
    });
    expect(r.current.settlements.find((s) => s.id === pending.id)!.state).toBe(
      "approved",
    );
    const otherPending = r.current.settlements.find((s) => s.state === "pending")!;
    let ok = true;
    act(() => {
      ok = r.current.rejectSettlement(otherPending.id, "no");
    });
    expect(ok).toBe(false);
    act(() => {
      r.current.rejectSettlement(otherPending.id, "duplicate period entry");
    });
    expect(r.current.audit[0]!.actionKey).toBe("admin.earn.settlements.audit.reject");
    expect(r.current.audit[0]!.subject).toBe(otherPending.agentCode);
  });
});

describe("useAdminEarnDeskMock — isolation + display", () => {
  it("T10: mutations keep cross-desk storage byte-equal", () => {
    const r = resetHook();
    const keys = [
      "phonara-admin-operations-v1",
      "phonara-admin-casino-catalog-v1",
      "phonara-admin-casino-rtp-v1",
      "admin:wallet:withdraw:v1",
      "admin:wallet:deposit:v1",
      "admin:compliance:kyc:v1",
      "admin:users:v1",
      "admin:alerts:v1",
    ];
    for (const k of keys) {
      window.localStorage.setItem(
        k,
        JSON.stringify({ allRows: [], filters: {}, audit: [] }),
      );
    }
    const before = keys.map((k) => window.localStorage.getItem(k));
    act(() => {
      r.current.approveAgent(
        r.current.agents.find((a) => a.status === "pending")!.id,
      );
      r.current.suspendAgent(
        r.current.agents.find((a) => a.status === "active")!.id,
        "isolation guard test",
      );
      r.current.markSettlementPaid(
        r.current.settlements.find((s) => s.state === "approved")!.id,
        "isolation guard test",
      );
    });
    const after = keys.map((k) => window.localStorage.getItem(k));
    expect(after).toEqual(before);
  });

  it("T11: no float — all numeric display fields are strings", () => {
    const r = resetHook();
    for (const a of r.current.agents) {
      expect(typeof a.referralCount).toBe("string");
      expect(typeof a.pendingPayout).toBe("string");
      expect(typeof a.treeDepth).toBe("string");
    }
    for (const s of r.current.settlements) {
      expect(typeof s.amount).toBe("string");
      if (s.downlineCount !== undefined)
        expect(typeof s.downlineCount).toBe("string");
    }
  });
});

describe("EarnDeskHub", () => {
  it("renders MOCK chip + tab triggers + queue metrics (Tier C agent actions disabled)", () => {
    render(<EarnDeskHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("earn-tab-agents")).toBeInTheDocument();
    expect(screen.getByTestId("earn-tab-settlements")).toBeInTheDocument();
    expect(screen.getByTestId("agents-metric-active")).toBeInTheDocument();
    expect(screen.getByTestId("agents-metric-pending")).toBeInTheDocument();
    expect(screen.getByTestId("agents-metric-suspended")).toBeInTheDocument();
    expect(screen.getByTestId("agents-metric-depth2")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("earn-tab-settlements"));
    expect(screen.getByTestId("settlements-metric-pending")).toBeInTheDocument();
    expect(screen.getByTestId("settlements-metric-approved")).toBeInTheDocument();
    expect(screen.getByTestId("settlements-metric-paid")).toBeInTheDocument();
    expect(screen.getByTestId("settlements-metric-total")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("earn-tab-agents"));
    const rows = screen.getAllByTestId(/^agents-row-ag_/);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    const suspendBtn = screen.getAllByTestId(/^agent-suspend-ag_/)[0]!;
    expect((suspendBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
