import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

import { useAdminAccessDeskMock } from "@/hooks/admin/useAdminAccessDeskMock";
import { AccessSettingsHub } from "@/components/admin/access/AccessSettingsHub";
import { MfaPolicyHub } from "@/components/admin/access/MfaPolicyHub";
import { ADMIN_COMMAND_ROUTES } from "@/components/admin/access/AdminCommandPalette";

// L1-15-J · J8 — Admin Access desk T1–T12.
// react-router-dom is only used to satisfy any nested Link that might
// resolve through TanStack at render time — components here use `t()` keys
// and primitives, no router-bound navigation in DOM tests.

beforeEach(() => {
  window.localStorage.clear();
});

function resetHook() {
  const { result } = renderHook(() => useAdminAccessDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminAccessDeskMock — SEED", () => {
  it("T1: RBAC SEED = 6 roles with stable role keys", () => {
    const r = resetHook();
    expect(r.current.roles.length).toBe(6);
    const keys = r.current.roles.map((x) => x.roleKey).sort();
    expect(keys).toEqual([
      "finance",
      "operator",
      "owner",
      "risk",
      "support",
      "viewer",
    ]);
  });

  it("T2: Saved filters SEED ≥8 spanning 8 desks", () => {
    const r = resetHook();
    expect(r.current.presets.length).toBeGreaterThanOrEqual(8);
    const desks = new Set(r.current.presets.map((p) => p.deskKey));
    expect(desks.size).toBeGreaterThanOrEqual(8);
  });

  it("T3: MFA SEED ≥6 spanning 6 tiers", () => {
    const r = resetHook();
    expect(r.current.mfaPolicies.length).toBeGreaterThanOrEqual(6);
    const tiers = new Set(r.current.mfaPolicies.map((m) => m.tierKey));
    expect(tiers.size).toBe(6);
  });
});

describe("ADMIN_COMMAND_ROUTES — palette", () => {
  it("T4: command palette exposes ≥10 unique admin routes (no user-funnel)", () => {
    expect(ADMIN_COMMAND_ROUTES.length).toBeGreaterThanOrEqual(10);
    for (const r of ADMIN_COMMAND_ROUTES) {
      expect(r.to.startsWith("/")).toBe(true);
      expect(r.to.startsWith("/admin")).toBe(false);
    }
    const tos = new Set(ADMIN_COMMAND_ROUTES.map((r) => r.to));
    expect(tos.size).toBe(ADMIN_COMMAND_ROUTES.length);
  });
});

describe("AdminHotkeyProvider — scope", () => {
  it("T5: hotkey provider context returns disabled outside admin tree", async () => {
    // No provider mounted → fallback context is disabled. Asserts the
    // out-of-tree default path (admin-only leak guard).
    const mod = await import(
      "@/components/admin/access/AdminHotkeyProvider"
    );
    const { result } = renderHook(() => mod.useAdminHotkeyContext());
    expect(result.current.enabled).toBe(false);
    expect(result.current.paletteOpen).toBe(false);
    // openPalette is a no-op outside admin
    act(() => result.current.openPalette());
    expect(result.current.paletteOpen).toBe(false);
  });
});

describe("useAdminAccessDeskMock — mutations + reason gate", () => {
  it("T6: disableRole throws on reason<4 · succeeds at ≥4 · audit subject = roleKey", () => {
    const r = resetHook();
    const finance = r.current.roles.find((x) => x.roleKey === "finance")!;
    expect(() => {
      act(() => {
        r.current.disableRole(finance.id, "x");
      });
    }).toThrow();
    expect(
      r.current.roles.find((x) => x.id === finance.id)!.enabled,
    ).toBe(true);
    act(() => {
      r.current.disableRole(finance.id, "policy rotation");
    });
    expect(
      r.current.roles.find((x) => x.id === finance.id)!.enabled,
    ).toBe(false);
    expect(r.current.audit[0]!.subject).toBe("finance");
  });

  it("T7: deletePreset throws on reason<4 · succeeds at ≥4 · audit subject = presetName", () => {
    const r = resetHook();
    const preset = r.current.presets[0]!;
    expect(() => {
      act(() => {
        r.current.deletePreset(preset.id, "no");
      });
    }).toThrow();
    act(() => {
      r.current.deletePreset(preset.id, "obsolete preset");
    });
    expect(r.current.audit[0]!.subject).toBe(preset.presetName);
    expect(r.current.audit[0]!.actionKey).toBe(
      "admin.access.filters.audit.delete",
    );
  });

  it("T8: relaxMfa throws on reason<4 · admin tier protected · audit subject = tierKey", () => {
    const r = resetHook();
    const gold = r.current.mfaPolicies.find((m) => m.tierKey === "tier.gold")!;
    expect(() => {
      act(() => {
        r.current.relaxMfa(gold.id, "no");
      });
    }).toThrow();
    act(() => {
      r.current.relaxMfa(gold.id, "rollback to optional MFA pilot");
    });
    expect(
      r.current.mfaPolicies.find((m) => m.id === gold.id)!.mfaRequired,
    ).toBe(false);
    expect(r.current.audit[0]!.subject).toBe("tier.gold");

    // admin tier must stay required
    const admin = r.current.mfaPolicies.find(
      (m) => m.tierKey === "tier.admin",
    )!;
    act(() => {
      r.current.relaxMfa(admin.id, "attempt to relax admin tier");
    });
    expect(
      r.current.mfaPolicies.find((m) => m.id === admin.id)!.mfaRequired,
    ).toBe(true);
  });

  it("T9: bulk reason throws + bulkRequireMfa requires no reason", () => {
    const r = resetHook();
    const ids = r.current.roles
      .filter((x) => x.enabled && x.roleKey !== "owner")
      .map((x) => x.id);
    expect(() => {
      act(() => {
        r.current.bulkDisableRoles(ids, "no");
      });
    }).toThrow();
    const off = r.current.mfaPolicies
      .filter((m) => !m.mfaRequired)
      .map((m) => m.id);
    act(() => {
      r.current.bulkRequireMfa(off);
    });
    for (const id of off) {
      expect(r.current.mfaPolicies.find((m) => m.id === id)!.mfaRequired).toBe(
        true,
      );
    }
  });
});

describe("useAdminAccessDeskMock — isolation + display", () => {
  it("T10: mutations keep 9 cross-desk storages byte-equal", () => {
    const r = resetHook();
    const keys = [
      "phonara-admin-operations-v1",
      "phonara-admin-casino-catalog-v1",
      "phonara-admin-casino-rtp-v1",
      "phonara-admin-earn-agents-v1",
      "phonara-admin-earn-settlements-v1",
      "phonara-admin-cms-pages-v1",
      "phonara-admin-cms-promos-v1",
      "admin:wallet:withdraw:v1",
      "admin:users:v1",
    ];
    for (const k of keys) {
      window.localStorage.setItem(
        k,
        JSON.stringify({ allRows: [], filters: {}, audit: [] }),
      );
    }
    const before = keys.map((k) => window.localStorage.getItem(k));

    const finance = r.current.roles.find((x) => x.roleKey === "finance")!;
    const preset = r.current.presets[0]!;
    const silver = r.current.mfaPolicies.find(
      (m) => m.tierKey === "tier.silver",
    )!;
    act(() => {
      r.current.disableRole(finance.id, "isolation guard test");
      r.current.deletePreset(preset.id, "isolation guard test");
      r.current.requireMfa(silver.id);
    });
    const after = keys.map((k) => window.localStorage.getItem(k));
    expect(after).toEqual(before);
  });

  it("T11: no float — all numeric/display fields string-typed", () => {
    const r = resetHook();
    for (const x of r.current.roles) {
      expect(typeof x.memberCount).toBe("string");
      expect(typeof x.routesSummary).toBe("string");
      expect(typeof x.updatedAt).toBe("string");
    }
    for (const m of r.current.mfaPolicies) {
      expect(typeof m.graceDays).toBe("string");
      expect(typeof m.enrollRate).toBe("string");
    }
    for (const p of r.current.presets) {
      expect(typeof p.presetName).toBe("string");
      expect(typeof p.filterBlob).toBe("string");
    }
  });
});

describe("AccessSettingsHub + MfaPolicyHub", () => {
  it("T12: hubs render MOCK chip, metrics, tabs, and reason gates", () => {
    // Settings hub (RBAC + filters tabs)
    const settings = render(<AccessSettingsHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("access-tab-rbac")).toBeInTheDocument();
    expect(screen.getByTestId("access-tab-filters")).toBeInTheDocument();
    expect(screen.getByTestId("rbac-metric-total")).toBeInTheDocument();
    expect(screen.getByTestId("rbac-metric-enabled")).toBeInTheDocument();
    expect(screen.getByTestId("rbac-metric-disabled")).toBeInTheDocument();
    expect(screen.getByTestId("rbac-metric-members")).toBeInTheDocument();
    const disableBtns = screen.getAllByTestId(/^rbac-disable-/);
    expect(disableBtns.length).toBeGreaterThan(0);
    expect((disableBtns[0] as HTMLButtonElement).disabled).toBe(true);
    settings.unmount();

    // MFA hub
    render(<MfaPolicyHub />);
    expect(screen.getByTestId("mfa-metric-total")).toBeInTheDocument();
    expect(screen.getByTestId("mfa-metric-required")).toBeInTheDocument();
    expect(screen.getByTestId("mfa-metric-relaxed")).toBeInTheDocument();
    expect(screen.getByTestId("mfa-metric-enroll")).toBeInTheDocument();
    const relaxBtns = screen.getAllByTestId(/^mfa-relax-/);
    expect(relaxBtns.length).toBeGreaterThan(0);
    expect((relaxBtns[0] as HTMLButtonElement).disabled).toBe(true);
  });
});
