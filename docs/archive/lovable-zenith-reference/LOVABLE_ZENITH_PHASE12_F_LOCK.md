# Phase 12-F Home FOMO Density — LOCK v0.1 FINAL (정본)

> **GAP:** #1 P0 · [`LOVABLE_ZENITH_PHASE12_GAP_AUDIT.md`](LOVABLE_ZENITH_PHASE12_GAP_AUDIT.md)  
> **carry:** 12-C §GREEN · 12-B/E/D NO-TOUCH  
> **baseline:** catalog **1165** → target **1177** (Δ +12) · sitemap **43**

---

## 1. Mission

HomeHub **6→9 slot** · FOMO 3-card mount · 첫 3초 Rollbit/앱테크 밀도 회복.

---

## 2. Files

**CREATE (3):** `src/components/home/`

- `LiveActivityFeed.tsx` — `data-hub-id="home-fomo-live"`
- `StreakRing.tsx` — `data-hub-id="home-fomo-streak"`
- `LimitedDropCard.tsx` — `data-hub-id="home-fomo-drop"`

**EDIT (2):** `HomeHub.tsx` (6+3 layout) · `en.ts`/`ko.ts` (+12 each)

**NO-TOUCH:** `home.tsx` head Δ=0 · H1~H6 기존 6 teaser · Footer #19 · `ImportedHomePage` · `components/fomo/` · earn/casino/trade

---

## 3. i18n (+12)

`home.fomo.live.*` · `home.fomo.streak.*` · `home.fomo.drop.*` (title/desc/cta 각 4키 = 12)

---

## 4. Gates R-F1 ~ R-F6

| ID | 규칙 | FAIL |
|----|------|------|
| R-F1 | `home.tsx` head/meta/canonical/JSON-LD Δ=0 | regex |
| R-F2 | slot **9** (6 legacy + 3 fomo) · allowlist `home-{welcome\|…\|games\|fomo-live\|fomo-streak\|fomo-drop}` | count/allowlist |
| R-F3 | `components/fomo/` git diff quiet | drift |
| R-F4 | earn/trade/casino carry quiet | stat |
| R-F5 | banned tokens 0 in **3 CREATE + HomeHub edit** | rg |
| R-F6 | `/partner` leak 0 in `components/home/` | rg |

**§GREEN G-F1~G-F6:** catalog **1177** · vitest **356/356** · sitemap **43** · red-grep · i18n-parity

---

*v0.1 FINAL · 2026-06-15*
