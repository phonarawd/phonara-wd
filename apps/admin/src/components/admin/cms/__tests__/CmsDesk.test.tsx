import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useAdminCmsDeskMock } from "@/hooks/admin/useAdminCmsDeskMock";
import { CmsDeskHub } from "@/components/admin/cms/CmsDeskHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetHook() {
  const { result } = renderHook(() => useAdminCmsDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminCmsDeskMock — SEED", () => {
  it("T1: pages SEED ≥10 with bucket + locale mix", () => {
    const r = resetHook();
    expect(r.current.pages.length).toBeGreaterThanOrEqual(10);
    const published = r.current.pages.filter((p) => p.status === "published").length;
    const draft = r.current.pages.filter((p) => p.status === "draft").length;
    const archived = r.current.pages.filter((p) => p.status === "archived").length;
    expect(published).toBeGreaterThanOrEqual(4);
    expect(draft).toBeGreaterThanOrEqual(3);
    expect(archived).toBeGreaterThanOrEqual(2);
    const locales = new Set(r.current.pages.map((p) => p.locale));
    expect(locales.has("ko")).toBe(true);
    expect(locales.has("en")).toBe(true);
  });

  it("T2: promos SEED ≥8 with status + surface mix", () => {
    const r = resetHook();
    expect(r.current.promos.length).toBeGreaterThanOrEqual(8);
    for (const s of ["draft", "scheduled", "live", "ended"] as const) {
      expect(r.current.promos.filter((p) => p.status === s).length)
        .toBeGreaterThanOrEqual(2);
    }
    for (const sf of ["home", "casino", "earn", "trade"] as const) {
      expect(r.current.promos.filter((p) => p.surface === sf).length)
        .toBeGreaterThanOrEqual(1);
    }
  });
});

describe("useAdminCmsDeskMock — filters", () => {
  it("T3: pages filter narrows by locale/status/search", () => {
    const r = resetHook();
    act(() => r.current.setPageFilters((p) => ({ ...p, locale: "ko" })));
    expect(r.current.filteredPages.every((p) => p.locale === "ko")).toBe(true);
    act(() =>
      r.current.setPageFilters({ search: "", locale: "all", status: "draft" }),
    );
    expect(r.current.filteredPages.every((p) => p.status === "draft")).toBe(true);
    act(() =>
      r.current.setPageFilters({
        search: "home.hero",
        locale: "all",
        status: "all",
      }),
    );
    expect(
      r.current.filteredPages.every((p) => p.pageKey.includes("home.hero")),
    ).toBe(true);
  });

  it("T4: promos filter narrows by surface/status", () => {
    const r = resetHook();
    act(() => r.current.setPromoFilters((p) => ({ ...p, surface: "casino" })));
    expect(r.current.filteredPromos.every((p) => p.surface === "casino")).toBe(true);
    act(() =>
      r.current.setPromoFilters({ search: "", surface: "all", status: "live" }),
    );
    expect(r.current.filteredPromos.every((p) => p.status === "live")).toBe(true);
  });
});

describe("useAdminCmsDeskMock — page mutations", () => {
  it("T5: publishPage draft→published · audit subject = pageKey", () => {
    const r = resetHook();
    const draft = r.current.pages.find((p) => p.status === "draft")!;
    act(() => {
      r.current.publishPage(draft.id);
    });
    expect(r.current.pages.find((p) => p.id === draft.id)!.status).toBe("published");
    expect(r.current.audit[0]!.subject).toBe(draft.pageKey);
    expect(r.current.audit[0]!.actionKey).toBe("admin.cms.pages.audit.publish");
  });

  it("T6: archivePage throws on reason<4 · succeeds at ≥4", () => {
    const r = resetHook();
    const target = r.current.pages.find((p) => p.status === "published")!;
    expect(() => {
      act(() => {
        r.current.archivePage(target.id, "x");
      });
    }).toThrow();
    expect(r.current.pages.find((p) => p.id === target.id)!.status).toBe(
      "published",
    );
    act(() => {
      r.current.archivePage(target.id, "stale copy approved");
    });
    expect(r.current.pages.find((p) => p.id === target.id)!.status).toBe(
      "archived",
    );
  });

  it("T7: bulkArchivePages reason gate throws · bulkPublishPages no-reason ok", () => {
    const r = resetHook();
    const ids = r.current.pages
      .filter((p) => p.status === "published")
      .map((p) => p.id);
    expect(() => {
      act(() => {
        r.current.bulkArchivePages(ids, "no");
      });
    }).toThrow();
    const draftIds = r.current.pages
      .filter((p) => p.status === "draft")
      .map((p) => p.id);
    act(() => {
      r.current.bulkPublishPages(draftIds);
    });
    for (const id of draftIds) {
      expect(r.current.pages.find((p) => p.id === id)!.status).toBe("published");
    }
  });
});

describe("useAdminCmsDeskMock — promo mutations", () => {
  it("T8: endPromoEarly throws reason<4 + audit subject = promoKey", () => {
    const r = resetHook();
    const live = r.current.promos.find((p) => p.status === "live")!;
    expect(() => {
      act(() => {
        r.current.endPromoEarly(live.id, "no");
      });
    }).toThrow();
    act(() => {
      r.current.endPromoEarly(live.id, "policy violation");
    });
    expect(r.current.promos.find((p) => p.id === live.id)!.status).toBe("ended");
    expect(r.current.audit[0]!.subject).toBe(live.promoKey);
    expect(r.current.audit[0]!.actionKey).toBe("admin.cms.promos.audit.end");
  });
});

describe("useAdminCmsDeskMock — isolation + display", () => {
  it("T9: mutations keep 7 cross-desk storages byte-equal", () => {
    const r = resetHook();
    const keys = [
      "phonara-admin-operations-v1",
      "phonara-admin-casino-catalog-v1",
      "phonara-admin-casino-rtp-v1",
      "phonara-admin-earn-agents-v1",
      "phonara-admin-earn-settlements-v1",
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
    act(() => {
      r.current.publishPage(
        r.current.pages.find((p) => p.status === "draft")!.id,
      );
      r.current.archivePage(
        r.current.pages.find((p) => p.status === "published")!.id,
        "isolation guard test",
      );
      r.current.endPromoEarly(
        r.current.promos.find((p) => p.status === "live")!.id,
        "isolation guard test",
      );
      r.current.activatePromo(
        r.current.promos.find((p) => p.status === "scheduled")!.id,
      );
    });
    const after = keys.map((k) => window.localStorage.getItem(k));
    expect(after).toEqual(before);
  });

  it("T10: no float — all numeric/display fields strings", () => {
    const r = resetHook();
    for (const p of r.current.pages) {
      expect(typeof p.updatedAt).toBe("string");
      expect(typeof p.pageKey).toBe("string");
    }
    for (const pr of r.current.promos) {
      expect(typeof pr.priority).toBe("string");
      expect(typeof pr.startsAt).toBe("string");
      expect(typeof pr.endsAt).toBe("string");
    }
  });
});

describe("CmsDeskHub", () => {
  it("T11: renders MOCK chip + tab triggers + metrics (Tier C mutations disabled)", () => {
    render(<CmsDeskHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("cms-tab-pages")).toBeInTheDocument();
    expect(screen.getByTestId("cms-tab-promos")).toBeInTheDocument();
    expect(screen.getByTestId("pages-metric-published")).toBeInTheDocument();
    expect(screen.getByTestId("pages-metric-draft")).toBeInTheDocument();
    expect(screen.getByTestId("pages-metric-archived")).toBeInTheDocument();
    expect(screen.getByTestId("pages-metric-locales")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-tab-promos"));
    expect(screen.getByTestId("promos-metric-live")).toBeInTheDocument();
    expect(screen.getByTestId("promos-metric-scheduled")).toBeInTheDocument();
    expect(screen.getByTestId("promos-metric-draft")).toBeInTheDocument();
    expect(screen.getByTestId("promos-metric-ended")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-tab-pages"));
    const rows = screen.getAllByTestId(/^pages-row-pg_/);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    const archiveBtn = screen.getAllByTestId(/^page-archive-pg_/)[0]!;
    expect((archiveBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
