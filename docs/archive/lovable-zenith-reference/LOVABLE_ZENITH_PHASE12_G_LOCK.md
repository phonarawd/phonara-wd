# Phase 12-G SEO Coverage Sweep — LOCK v0.1 FINAL (정본)

> **GAP:** #4·#5·#6 P1  
> **carry:** 12-A GREEN 후 baseline **1201** → target **1229** (Δ +28) · sitemap **43**

---

## 1. Mission

**14 route** `head()` 추가 · 기존 **46 route head Δ=0** · leaf og:image · canonical 60/60.

---

## 2. Scope

**EDIT:** 14 `src/routes/*` — head() only (title · description · og:title · og:description · canonical · og:url · og:image leaf)

**EDIT:** 14 route `head()` · `src/i18n/locales/ko.json` · `en.json` (+28)

**VERIFY:** `__root.tsx` — global og:image **없음** (leaf override)

**NO-TOUCH:** ImportedPage 본문 · hub routes head (home/trade.hub/casino hub post-12-A) · component layer · sitemap URL count

---

## 3. Gates R-G1 ~ R-G8

| ID | 규칙 | FAIL |
|----|------|------|
| R-G1 | 14 target routes only · 기존 46 route head diff quiet | regex/stat |
| R-G2 | `head()` 보유 route = **60/60** | count |
| R-G3 | canonical present 60/60 | rg |
| R-G4 | `__root.tsx` og:image global 0 | rg |
| R-G5 | hub/trade/casino/game engine quiet | stat |
| R-G6 | i18n +28 · catalog **1229** | parity |

**§GREEN G-G1~G-G8:** vitest **356/356** · sitemap **43** · JSON-LD routes **≥8**

---

*v0.1 FINAL · 2026-06-15*
