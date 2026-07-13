# Pillar 3 — Frontend (IA · 상태관리 · UI state coverage · a11y 정적)

> **감사일:** 2026-07-13 · **READ-ONLY** — 정적 스캔 + 기존 매트릭스 재사용 · 브라우저 실측 없음
> **Baseline:** [`PER_PAGE_UI_MATRIX.md`](../PER_PAGE_UI_MATRIX.md) · Phase 1 §4–§8 · [`PLATFORM_AUDIT_REFERENCE.md`](../PLATFORM_AUDIT_REFERENCE.md) §8

## 점수

| 항목         |                       점수 |
| ------------ | -------------------------: |
| **Frontend** | **78 / 100** (Strong 하단) |

감점 근거: Empty state 정적 커버 39% (41 surfaces 무증거) · axe/a11y 실측 미검증 · R9 touch target WARN(Landing). IA 격리·상태관리 규율·표시 계약(196 contracts) 체계는 Strong.

## 1. IA · 경계 (2026-07-13 게이트 실측)

| 검사                               | 결과                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `check:phase-r-guards -- --strict` | **OK** — duplicate-work signal 0 · domain boundaries clean                                  |
| `check:ui-architecture`            | **OK** — Phase R product boundaries clean                                                   |
| 5-tab IA                           | BottomNav 5 (Earn/Wallet/Trade/Sports/Casino) — `apps/web/src/product/shell/bottom-nav.tsx` |
| Boundary SOT                       | `apps/web/src/product/shell/surface-domain-boundary.ts` — 12 casino slug 포함               |
| Shell owner                        | `AuthProvider → PwaShell → [AppShell                                                        | MarketingShell | ContentShell]` (`\_\_root.tsx`) — subnav owner AppShell 단일 (Reference §8.1: surface-owned subnav 0 · 390px root bypass 0) |
| Canonical routes                   | Web 84 canonical / 93 route files · redirect registry 66 (Reference §5)                     |

## 2. 상태관리 (Phase 1 §12 재확인)

| 계층           | 사용                                                                                             | 판정                                   |
| -------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| TanStack Query | 1차 데이터 계층 — desk data · `useRpc` mutations                                                 | 정본                                   |
| Zustand        | **3 files만** (`stores/realtime.ts` · `stores/notifications.ts` · `casino-fiat-rate-session.ts`) | 최소주의 유지 — global state 남용 없음 |
| React Context  | auth · PWA install prompt                                                                        | 경계 적합                              |
| Custom pub/sub | `ticker-store.ts` · `order-book-store.ts` (trade market display)                                 | 고빈도 시장 데이터 격리 — 적절         |
| 표시 계약      | 196 web + 20 admin `*-display-contract.ts` + vitest                                              | 세계 수준의 UI 회귀 방어               |

돈 표시: `@phonara/money` MoneyDisplay 경유 — R1/R5/R6에서 위반(H-01·M-02·M-03) 전부 VERIFIED_FIXED, `check:primitive-ratchet` baseline 게이트 존재 (M-15).

## 3. Per-page UI state coverage (79 web surfaces — 정적)

| State                          | yes | partial |  no | **yes 비율** |
| ------------------------------ | --: | ------: | --: | -----------: |
| Loading                        |  56 |       1 |  22 |    **70.9%** |
| Empty                          |  31 |       7 |  41 |    **39.2%** |
| Error                          |  48 |       2 |  29 |    **60.8%** |
| Responsive (`md:`/`lg:`/`sm:`) |  57 |      16 |   6 |    **72.2%** |

**해석:** `no` 다수는 legal 6 · marketing/static 계열로 fetch 없는 페이지(Empty/Error 해당 없음이 자연스러움). 다만 `casino-lobby-page` Error=no, `install-page` Loading=no 등 데이터 의존 surface의 공백은 잔여 부채 → Finding **SA-02 (LOW)**. Admin 32 surfaces는 `useAdmin*Desk` 패턴 + EmptyState 정비(R5 M-13 fix)로 별도 매트릭스 없이 desk 공통 상태 처리.

## 4. a11y 정적 신호 (실측 아님)

| 신호                     | 관찰                                                                                                                                   | 근거                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `prefers-reduced-motion` | 20+ files — hook `use-prefers-reduced-motion.ts` · game stages (crash/mines/dice/momentum) · `aurora-background` · tokens `colors.css` | grep 2026-07-13                                                                                   |
| Radix primitives         | Dialog · DropdownMenu · Popover · Tooltip · Tabs 등 (접근성 내장)                                                                      | Phase 1 §7.1                                                                                      |
| Touch target             | R9 Stage1: **WARN Landing만** (dense CTA row) · auth routes PASS                                                                       | [`r9-stage1-matrix.md`](../../OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix.md) |
| axe critical/serious     | **UNVERIFIED** — R9에서 DEFER (MCP VM file I/O 제한) · 본 감사 브라우저 미실행                                                         | R9 matrix                                                                                         |
| Raw control 부채         | M-15 VERIFIED_FIXED — `check:primitive-ratchet` baseline (residual signed)                                                             | Registry                                                                                          |

## 5. Phase R 경계·재작업 위험

- Plan `phase_r_super-app` Track A NEXT = `p10-games-batch-c` (#210) — 본 감사와 무관, 재착수 신호 없음.
- 완료 todo 재구현 신호 0 (`check:phase-r-guards` green).
- 미커밋 display contract 수정 다수(R10–R12 계열)는 Platform Perfect Launch closeout 잔여 — Pillar 1 §3.1과 동일 맥락.

## 6. Finding (Pillar 3)

| ID    | 심각도 | 내용                                                                                                                                |
| ----- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| SA-02 | LOW    | 데이터 의존 surface 일부의 Empty/Error 정적 증거 공백 (Empty yes 39.2%) — 정적 스캔 한계 포함, 실측 분리는 후속 WORLD_CLASS_UX 트랙 |

## 7. NOT VERIFIED

- 실제 브라우저 렌더 · 애니메이션 품질 · axe 점수 (R9 functional matrix 24/24 PASS만 인용)
- Admin 32 surfaces per-page state 매트릭스 (web만 생성됨)
