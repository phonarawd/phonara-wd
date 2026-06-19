import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { renderAdmin as render } from "@/test/admin-test-render";
import { useAdminComplianceMock } from "@/hooks/admin/useAdminComplianceMock";
import { ComplianceKycQueue } from "@/components/admin/compliance/ComplianceKycQueue";
import { ComplianceStrQueue } from "@/components/admin/compliance/ComplianceStrQueue";
import { ComplianceRiskRgQueue } from "@/components/admin/compliance/ComplianceRiskRgQueue";

beforeEach(() => {
  window.localStorage.clear();
});

function resetMock() {
  const { result } = renderHook(() => useAdminComplianceMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminComplianceMock — SEED & compose", () => {
  it("SEED counts meet LOCK minima", () => {
    const r = resetMock();
    expect(r.current.kyc.length).toBe(6);
    const kycPending = r.current.kyc.filter((x) => x.status === "pending");
    expect(kycPending.length).toBeGreaterThanOrEqual(3);
    expect(r.current.str.length).toBe(5);
    const strOpen = r.current.str.filter((x) => x.status === "open");
    expect(strOpen.length).toBeGreaterThanOrEqual(2);
    expect(r.current.risk.length).toBe(6);
    const riskActive = r.current.risk.filter((x) => x.status === "active");
    expect(riskActive.length).toBeGreaterThanOrEqual(3);
    const se = r.current.risk.filter(
      (x) => x.flagType === "rg_self_exclusion",
    );
    expect(se.length).toBeGreaterThanOrEqual(2);
    const limit = r.current.risk.filter((x) => x.rgLimit);
    expect(limit.length).toBeGreaterThanOrEqual(1);
  });

  it("SEED has ≥1 KYC SLA overdue (slaDueAt < submittedAt for fixture)", () => {
    const r = resetMock();
    const overdue = r.current.kyc.find(
      (x) =>
        (x.status === "pending" || x.status === "in_review") &&
        new Date(x.slaDueAt).getTime() < new Date(x.submittedAt).getTime(),
    );
    expect(overdue).toBeTruthy();
  });
});

describe("KYC actions", () => {
  it("approveKyc gates reason ≥4 + audit key", () => {
    const r = resetMock();
    const id = r.current.kyc.find((x) => x.status === "pending")!.id;
    act(() => r.current.approveKyc(id, "abc"));
    expect(r.current.kyc.find((x) => x.id === id)!.status).toBe("pending");
    act(() => r.current.approveKyc(id, "docs ok"));
    expect(r.current.kyc.find((x) => x.id === id)!.status).toBe("approved");
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.kyc.audit.approve",
    );
  });

  it("rejectKyc on in_review row → rejected + audit", () => {
    const r = resetMock();
    const id = r.current.kyc.find((x) => x.status === "in_review")!.id;
    act(() => r.current.rejectKyc(id, "unreadable doc"));
    expect(r.current.kyc.find((x) => x.id === id)!.status).toBe("rejected");
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.kyc.audit.reject",
    );
  });
});

describe("STR actions", () => {
  it("flagStr keeps open + audit only", () => {
    const r = resetMock();
    const id = r.current.str.find((x) => x.status === "open")!.id;
    act(() => r.current.flagStr(id, "suspicious"));
    expect(r.current.str.find((x) => x.id === id)!.status).toBe("open");
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.str.audit.flag",
    );
  });

  it("escalate → reviewing → file/dismiss valid transitions", () => {
    const r = resetMock();
    const id = r.current.str.find((x) => x.status === "open")!.id;
    act(() => r.current.escalateStr(id, "escalating now"));
    expect(r.current.str.find((x) => x.id === id)!.status).toBe("reviewing");
    act(() => r.current.fileStr(id, "filed STR-1"));
    expect(r.current.str.find((x) => x.id === id)!.status).toBe("filed");
  });

  it("dismissStr only valid on reviewing rows", () => {
    const r = resetMock();
    const open = r.current.str.find((x) => x.status === "open")!.id;
    act(() => r.current.dismissStr(open, "false positive"));
    expect(r.current.str.find((x) => x.id === open)!.status).toBe("open");
  });
});

describe("Risk/RG actions", () => {
  it("clearRiskFlag active → cleared + audit", () => {
    const r = resetMock();
    const id = r.current.risk.find((x) => x.status === "active")!.id;
    act(() => r.current.clearRiskFlag(id, "user verified"));
    expect(r.current.risk.find((x) => x.id === id)!.status).toBe("cleared");
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.rg.audit.clear",
    );
  });

  it("applyRgCooldown + limitOverride emit audit without changing status", () => {
    const r = resetMock();
    const id = r.current.risk.find((x) => x.status === "active")!.id;
    act(() => r.current.applyRgCooldown(id, "24h cooldown"));
    expect(r.current.risk.find((x) => x.id === id)!.status).toBe("active");
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.rg.audit.cooldown",
    );
    act(() => r.current.limitOverride(id, "manual override"));
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.compliance.rg.audit.limitOverride",
    );
  });
});

describe("KYC queue — 6 elements smoke", () => {
  it("renders filter chip · row approve · reason gate · MOCK chip · audit · bulk", () => {
    resetMock();
    render(<ComplianceKycQueue />);
    expect(screen.getByTestId("admin-filter-search")).toBeInTheDocument();
    expect(
      screen.getByTestId("admin-filter-chip-status:pending"),
    ).toBeInTheDocument();

    const firstPending = screen.getByTestId("queue-kyc-approve-KYC-2026-0617-001");
    fireEvent.click(firstPending);
    expect(screen.getByTestId("admin-queue-action-confirm")).toBeDisabled();
    fireEvent.change(screen.getByTestId("admin-queue-action-reason"), {
      target: { value: "docs verified" },
    });
    fireEvent.click(screen.getByTestId("admin-queue-action-confirm"));

    const list = screen.getByTestId("admin-audit-list");
    expect(within(list).getByText("docs verified")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-table-select-KYC-2026-0617-002"));
    expect(screen.getByTestId("kyc-bulk-approve")).toBeInTheDocument();
    expect(screen.getByTestId("kyc-bulk-reject")).toBeInTheDocument();
  });
});

describe("STR queue — 6 elements smoke", () => {
  it("renders open-row flag/escalate buttons · bulk after select", () => {
    resetMock();
    render(<ComplianceStrQueue />);
    expect(screen.getByTestId("str-flag-STR-2026-0617-011")).toBeInTheDocument();
    expect(
      screen.getByTestId("str-escalate-STR-2026-0617-011"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("admin-table-select-STR-2026-0617-011"));
    expect(screen.getByTestId("str-bulk-escalate")).toBeInTheDocument();
  });
});

describe("Risk/RG queue — 6 elements smoke", () => {
  it("renders active-row clear/cooldown/override · bulk clear after select", () => {
    resetMock();
    render(<ComplianceRiskRgQueue />);
    expect(screen.getByTestId("rg-clear-RG-2026-0617-101")).toBeInTheDocument();
    expect(
      screen.getByTestId("rg-cooldown-RG-2026-0617-101"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("rg-override-RG-2026-0617-101"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("admin-table-select-RG-2026-0617-101"));
    expect(screen.getByTestId("rg-bulk-clear")).toBeInTheDocument();
  });
});
