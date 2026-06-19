# Phase 12-H-Theme — Aurora Ember LOCK v0.1 FINAL (정본)

> **ID:** **12-H-Theme** (Admin = **12-H-Admin defer** · PRODUCT_PLAN 충돌 회피)  
> **선행:** 12-D ✅ · Lovable live baseline  
> **operator GO:** **§A only** or **12-F.2+Theme bundled §A→§B**  
> **ZIP/paste:** 「Lovable 완성」/ 12-Z FINAL 전 **금지**

---

## 1. Mission

**Aurora Ember** — OKLCH P3 · **다크 고정** · semantic 토큰만 교체 → shadcn **컴포넌트 0 변경**.

---

## 2. Files

| 액션 | 파일 |
|------|------|
| EDIT | `src/styles.css` — `:root` 토큰 블록 전면 교체 (§A CSS) |
| EDIT | `index.html` — `<html class="dark" lang="ko">` 강제 |
| DELETE | `.dark { }` 중복 · `@media (prefers-color-scheme: light)` · light 토큰 블록 |
| KEEP | `@theme inline { --color-*: var(--*) }` 매핑 |

**NO-TOUCH:** `components/**` · `routes/**` (Step 1) · Bento 미진입

---

## 3. Step 1 GATE (R-H1 ~ R-H6)

| ID | 규칙 | FAIL |
|----|------|------|
| R-H1 | vitest **356/356** (#D-13 output assert) | summary |
| R-H2 | `@media (prefers-color-scheme: light)` = 0 | rg |
| R-H3 | `html.dark` 강제 | index.html rg |
| R-H4 | hardcode `bg-[#` · `text-white` · `bg-black` · `text-[#` in components/routes = 0 (baseline allowlist) | rg |
| R-H5 | `@theme` / `:root` light 변수 잔존 0 | rg |
| R-H6 | ember `text-primary` / `bg-primary` 1+ visible path | manual/screenshot |

**FAIL → §A only revert** · §B 미진입

---

## 4. §GREEN

- G-H1~G-H6 ALL PASS
- mobile **390** + desktop **1280** screenshot · ember 팔레트 확인
- `/earn` · `/casino` · `/trade` 토큰 inherit smoke (보고)

---

*v0.1 FINAL · 2026-06-15*
