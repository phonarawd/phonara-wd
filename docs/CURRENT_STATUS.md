# PHONARA Status (2026-07-08)

> **Active SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)  
> **엔진:** `[x] FULLY CLOSED` — [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md)  
> **Demolition:** `[x] DONE` — [`PRODUCT/DEMOLITION_PLAN.md`](PRODUCT/DEMOLITION_PLAN.md) (이력만 · batch 재실행 아님)

## Gates (2026-07-08 · Trade 결함 0 Phase B B1–B3 closeout)

| Gate                                        | 결과                                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase B vitest bundle (B1–B3)**           | reconnect **8/8** · heartbeat **6/6** · stale **3/3** · store **2/2** · `use-spot-desk-wire` **7/7** · order-book panel **4/4** · **Σ 31/31**              |
| **`gate:ai-impl` Phase B workers**          | `apps/web/src/workers/__tests__` green · `typecheck` · `lint` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict` |
| **`check:ai-reference`** (Phase B doc sync) | green · `TRADE_UX_CANON` stale 임계 · ACTIVE_WORK_SSOT B1–B3                                                                                               |

## Gates (2026-07-08 · Trade 결함 0 Phase A closeout)

| Gate                                                           | 결과                                                                                                                                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`gate:ai-impl` Phase A doc honesty (`phase-a-doc-honesty`)** | order-states **11/11** · parity **29/29** · layout-dedup **9/9** · i18n-surface **5/5** · `typecheck` · `lint` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict` |
| **`check:ai-reference`** (Phase A)                             | green                                                                                                                                                                                                       |
| **Phase A commit**                                             | **`2129da3`** · push `closeout/engine-apex-freeze-phase-r-ready-2026-07-03` · CI pending                                                                                                                    |
| **Phase A UNVERIFIED 1~3** (`phase-a-unverified`)              | MCP READ-ONLY · migration name **203/204** (gap: `trade_t0b_oracle_aal2_guard`) · `liquidation-worker` **미배포(의도)** · `funding_rates` 21×0% · `funding_payments` 0                                      |

## Gates (2026-07-06 · Launch E4 closeout)

| Gate                                                                     | 결과                                                                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch E4 (`launch-engine-e4-concurrent-race-test`)                      | `concurrent_wallet_race_test.sql` **5/5** (E4-0..E4-4) · `test:sql` **118/118** · `stack:push-remote` · advisor **0 ERROR** · migration **0**                              |
| `check:migrations`                                                       | **211/211** lock parity (incl. `20260725000001_synthetic_book_definer_fmt6_fix`)                                                                                           |
| `check:hygiene`                                                          | green                                                                                                                                                                      |
| `check:release`                                                          | green                                                                                                                                                                      |
| `check:ai-reference`                                                     | green                                                                                                                                                                      |
| `gate:ai-impl` P9 WORLD gate (`p9-gate-trade-world-class`)               | vitest world-class **6/6** · layout-dedup **9/9** · action-path **6/6** · parity **29/29** · trade surfaces **122/122** · §13.1.1 · §32.7 H1–H4                            |
| `gate:ai-impl` Fiat core gate (`p4-gate-fiat-reference-world-class`)     | vitest fiat bundle **113/113** · gate contract **6/6** · ComplaintRisk core 3/3 live · preflight grep · §13.1.4 · P10 page unblock                                         |
| `gate:ai-impl` P9 VISUAL (`p9-operator-visual-signoff`)                  | vitest trade+staking **168/168** · `p9-trade-visual-signoff` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary                |
| `typecheck`                                                              | green                                                                                                                                                                      |
| `check:design-tokens`                                                    | green (advisory) · token SOT · surface-hover bridge · legacy diff · motion refs                                                                                            |
| `check:i18n`                                                             | green                                                                                                                                                                      |
| `check:pwa`                                                              | green (maskable flat · §25.9)                                                                                                                                              |
| `gate:ai-impl` P9 audit remediation A2 (`p9-trade-audit-remediation-a2`) | vitest spot-desk **10/10** · futures-desk **8/8** · `useTradeDeskViewport` · lg+/<lg chart mount 1× · `trade-layout-dedup-contract` A2                                     |
| `gate:ai-impl` P9 audit remediation A1 (`p9-trade-audit-remediation-a1`) | vitest spot-desk · `filterSpotDeskOpenOrders` whitelist · mobile cancel · `cancel-spot-open-order` registry · `trade-action-path-contract` · `spot-stake-display-contract` |
| `gate:ai-impl` P9 position mode label (`p9-trade-position-mode-label`)   | vitest **17/17** · `PositionModeFixedLabel` · `MarginModeSegment` · one-way fixed · hedge hidden · account-scoped margin copy · HelpTip                                    |
| `gate:ai-impl` P9 fills history (`p9-trade-fills-history-wire`)          | vitest **51/51** · `useTradingOrderFills` · `trade-fills-history-panel` · `/trade/orders` history tab · `margin_currency` column · §22.2.4 RPC display                     |
| `gate:ai-impl` P9 chart overlays (`p9-trade-chart-overlays-lwc`)         | vitest **39/39** · candle/line · MA7/EMA21 · crosshair legend · oracle/liq priceLine · fullscreen · display-only boundary                                                  |
| `gate:ai-impl` P9 chart (`p9-trade-chart-pro-lwc`)                       | vitest **30/30** · LWC v5 chart/\* · crosshair·volume·interval · display-only boundary                                                                                     |
| `gate:ai-impl` P9 spot-pair (`p9-trade-spot-pair-wire`)                  | vitest **10/10** · `spot-stake-display-contract` · `use-spot-desk-wire` · spot-desk page                                                                                   |
| `gate:ai-impl` P9 parity (`p9-trade-parity-matrix-sync`)                 | vitest **21/21** · `trade-exchange-parity-display-contract` · §22.2.1·§32.7                                                                                                |
| `gate:ai-impl` P8 Core VISUAL (`p8-operator-visual-signoff`)             | vitest **24/24** · §22.2 Earn+Home · 390/768/1024 · axe critical 0 · dead control 0                                                                                        |
| `gate:ai-impl` P8 Core (`p8-gate-core`)                                  | vitest **145/145** · home · settings · account · notifications · `p8-core-gate-contract` · `subnav-route-manifest`                                                         |
| `gate:ai-impl` P8 `/home` earn-home                                      | vitest **10/10** · contract 6/6 · controller 1/1 · surface 3/3                                                                                                             |
| `gate:ai-impl` P7 growth bundle                                          | vitest **82/82** · earn · home/referral/share/tier surfaces · domain contracts · `p7-growth-gate-contract` · `subnav-route-manifest`                                       |
| `gate:ai-impl` security surfaces (P5)                                    | vitest **57/57** · settings/security · bank-accounts · account/kyc · account/responsible-gaming                                                                            |
| `gate:ai-impl` wallet surfaces (P4)                                      | vitest **57/57** · §31.3 tier limits · deposit/withdraw/ledger                                                                                                             |
| `gate:ai-impl` wallet-money-policy                                       | vitest **4/4**                                                                                                                                                             |
| `check:ui-architecture`                                                  | green                                                                                                                                                                      |
| `check:ai-reference`                                                     | green                                                                                                                                                                      |
| `check:hygiene`                                                          | green                                                                                                                                                                      |
| `test:e2e` `wallet-d3.spec.ts`                                           | **6 spec** · operator/CI Σ=0 (G13 advisory)                                                                                                                                |
| `test:engine`                                                            | 275/275 (frozen · 회귀 시만)                                                                                                                                               |
| `test:sql`                                                               | **118/118** · Σ=0 (frozen · 회귀 시만)                                                                                                                                     |
| `stack:push-remote`                                                      | green (frozen · 회귀 시만)                                                                                                                                                 |
| `check:advisors`                                                         | **0 ERROR** (frozen · 회귀 시만)                                                                                                                                           |

## Frozen (재착수 금지)

| 영역                  | 정본                                                       |
| --------------------- | ---------------------------------------------------------- |
| Engine implementation | `ENGINE_APEX_CLOSEOUT.md` — evidence reports는 감사 이력만 |
| Demolition            | `DEMOLITION_PLAN.md` — DONE                                |
| v2 UI execution       | Batch 11 `git rm` — `DEPRECATED_DOC_DENYLIST.md`           |

## Next (유일한 구현 큐)

**Phase R UI Rebuild** — [`PRODUCT/REBUILD_PLAN_v1.md`](PRODUCT/REBUILD_PLAN_v1.md) · **`pqa-gate-platform-audit` `[x]` DONE** 2026-07-09 · **NEXT** `null` #null · §13.1.4 · preflight: [`ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)

**Trade 결함 0 수렴 (형제 큐)** — Plan `트레이딩_결함_0_수렴` · Phase A–C **`[x]` impl** 2026-07-08 · **NEXT** Phase D `phase-d-fills-pagination` (D1) → `phase-d-depth-chart` (D2) · preflight: [`ENGINE_UI_FULL_AUDIT_2026-07-08.md`](audit/ENGINE_UI_FULL_AUDIT_2026-07-08.md)

## §AI Todo Sync (Phase R · YAML 정본 미러 · completed **179**/346 · pending **160** · cancelled **7** · 48차)

> **정본:** Cursor Plan `phase_r_super-app_8bdf2c10` frontmatter · **346 ids** · `bun run check:plan-doc-sync` green 필수 · 기존 surface gate 증거 행은 유지 · 신규 id만 placeholder

| id                                      | 상태            | 완료일 | 증거                                                         |
| --------------------------------------- | --------------- | ------ | ------------------------------------------------------------ |
| `engine-p0-apex-closed`                 | `[x]` DONE      | —      | YAML #1 completed · surface/gate evidence pending doc sync   |
| `engine-p0-no-migration`                | `[x]` DONE      | —      | YAML #2 completed · surface/gate evidence pending doc sync   |
| `engine-p0-no-rpc`                      | `[x]` DONE      | —      | YAML #3 completed · surface/gate evidence pending doc sync   |
| `p1-active-work-ssot-sync`              | `[x]` DONE      | —      | YAML #4 completed · surface/gate evidence pending doc sync   |
| `p1-foundation-tokens`                  | `[x]` DONE      | —      | YAML #5 completed · surface/gate evidence pending doc sync   |
| `p1-foundation-primitives`              | `[x]` DONE      | —      | YAML #6 completed · surface/gate evidence pending doc sync   |
| `p1-foundation-router`                  | `[x]` DONE      | —      | YAML #7 completed · surface/gate evidence pending doc sync   |
| `p1-foundation-redirects`               | `[x]` DONE      | —      | YAML #8 completed · surface/gate evidence pending doc sync   |
| `p1-ssot-ia-canon-sync`                 | `[x]` DONE      | —      | YAML #9 completed · surface/gate evidence pending doc sync   |
| `p1-foundation-brand`                   | `[x]` DONE      | —      | YAML #10 completed · surface/gate evidence pending doc sync  |
| `p1-foundation-pwa`                     | `[x]` DONE      | —      | YAML #11 completed · surface/gate evidence pending doc sync  |
| `p1-foundation-i18n`                    | `[x]` DONE      | —      | YAML #12 completed · surface/gate evidence pending doc sync  |
| `p1-foundation-responsive`              | `[x]` DONE      | —      | YAML #13 completed · surface/gate evidence pending doc sync  |
| `p1-foundation-ux-grammar`              | `[x]` DONE      | —      | YAML #14 completed · surface/gate evidence pending doc sync  |
| `p1-gate-foundation`                    | `[x]` DONE      | —      | YAML #15 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-home`                    | `[x]` DONE      | —      | YAML #16 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-queues`                  | `[x]` DONE      | —      | YAML #17 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-deposits`                | `[x]` DONE      | —      | YAML #18 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-withdrawals`             | `[x]` DONE      | —      | YAML #19 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-ops`                     | `[x]` DONE      | —      | YAML #20 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-earn-referrals`          | `[x]` DONE      | —      | YAML #21 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-earn-missions`           | `[x]` DONE      | —      | YAML #22 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-tiers`                   | `[x]` DONE      | —      | YAML #23 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-users`                   | `[x]` DONE      | —      | YAML #24 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-risk`                    | `[x]` DONE      | —      | YAML #25 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-sports`                  | `[x]` DONE      | —      | YAML #26 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-audit`                   | `[x]` DONE      | —      | YAML #27 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-settings`                | `[x]` DONE      | —      | YAML #28 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-staking`                 | `[x]` DONE      | —      | YAML #29 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-earn-desk`               | `[x]` DONE      | —      | YAML #30 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-earn-rewards`            | `[x]` DONE      | —      | YAML #31 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-viral-stats`             | `[x]` DONE      | —      | YAML #32 completed · surface/gate evidence pending doc sync  |
| `p2-gate-admin`                         | `[x]` DONE      | —      | YAML #33 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-admin-nav`                 | `[x]` DONE      | —      | YAML #34 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-sports-resume`             | `[x]` DONE      | —      | YAML #35 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-migration-gate`            | `[x]` DONE      | —      | YAML #36 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-router-navigate`           | `[x]` DONE      | —      | YAML #37 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-doc-sync`                  | `[x]` DONE      | —      | YAML #38 completed · surface/gate evidence pending doc sync  |
| `p2-page-admin-user-tier`               | `[x]` DONE      | —      | YAML #39 completed · surface/gate evidence pending doc sync  |
| `p2-closeout-gate-rerun`                | `[x]` DONE      | —      | YAML #40 completed · surface/gate evidence pending doc sync  |
| `p3-page-login`                         | `[x]` DONE      | —      | YAML #41 completed · surface/gate evidence pending doc sync  |
| `p3-page-admin-login`                   | `[x]` DONE      | —      | YAML #42 completed · surface/gate evidence pending doc sync  |
| `p3-page-admin-mfa-enroll`              | `[x]` DONE      | —      | YAML #43 completed · surface/gate evidence pending doc sync  |
| `p3-page-admin-mfa-challenge`           | `[x]` DONE      | —      | YAML #44 completed · surface/gate evidence pending doc sync  |
| `p3-page-admin-mfa-policy`              | `[x]` DONE      | —      | YAML #45 completed · surface/gate evidence pending doc sync  |
| `p3-gate-admin-auth`                    | `[x]` DONE      | —      | YAML #46 completed · surface/gate evidence pending doc sync  |
| `p3-page-signup`                        | `[x]` DONE      | —      | YAML #47 completed · surface/gate evidence pending doc sync  |
| `p3-page-reset-password`                | `[x]` DONE      | —      | YAML #48 completed · surface/gate evidence pending doc sync  |
| `p3-page-auth-callback`                 | `[x]` DONE      | —      | YAML #49 completed · surface/gate evidence pending doc sync  |
| `p3-page-verify-email`                  | `[x]` DONE      | —      | YAML #50 completed · surface/gate evidence pending doc sync  |
| `p3-page-legal-terms`                   | `[x]` DONE      | —      | YAML #51 completed · surface/gate evidence pending doc sync  |
| `p3-page-legal-privacy`                 | `[x]` DONE      | —      | YAML #52 completed · surface/gate evidence pending doc sync  |
| `p3-page-legal-rg`                      | `[x]` DONE      | —      | YAML #53 completed · surface/gate evidence pending doc sync  |
| `p3-page-legal-risk`                    | `[x]` DONE      | —      | YAML #54 completed · surface/gate evidence pending doc sync  |
| `p3-page-landing`                       | `[x]` DONE      | —      | YAML #55 completed · surface/gate evidence pending doc sync  |
| `p3-ads-attribution`                    | `[x]` DONE      | —      | YAML #56 completed · surface/gate evidence pending doc sync  |
| `p3-gate-auth`                          | `[x]` DONE      | —      | YAML #57 completed · surface/gate evidence pending doc sync  |
| `p4-preflight-design-sot-motion`        | `[x]` DONE      | —      | YAML #58 completed · surface/gate evidence pending doc sync  |
| `p4-preflight-design-sot-locale-type`   | `[x]` DONE      | —      | YAML #59 completed · surface/gate evidence pending doc sync  |
| `p4-preflight-design-sot-token-gate`    | `[x]` DONE      | —      | YAML #60 completed · surface/gate evidence pending doc sync  |
| `p4-preflight-design-sot-brand-flat`    | `[x]` DONE      | —      | YAML #61 completed · surface/gate evidence pending doc sync  |
| `p4-preflight-design-sot-gate`          | `[x]` DONE      | —      | YAML #62 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet`                        | `[x]` DONE      | —      | YAML #63 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-deposit`                | `[x]` DONE      | —      | YAML #64 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-deposit-krw`            | `[x]` DONE      | —      | YAML #65 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-deposit-crypto`         | `[x]` DONE      | —      | YAML #66 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-deposit-giftcard`       | `[x]` DONE      | —      | YAML #67 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-withdraw`               | `[x]` DONE      | —      | YAML #68 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-withdraw-krw`           | `[x]` DONE      | —      | YAML #69 completed · surface/gate evidence pending doc sync  |
| `p4-page-wallet-withdraw-crypto`        | `[x]` DONE      | —      | YAML #70 completed · surface/gate evidence pending doc sync  |
| `p4-page-ledger`                        | `[x]` DONE      | —      | YAML #71 completed · surface/gate evidence pending doc sync  |
| `p4-page-rewards-history`               | `[x]` DONE      | —      | YAML #72 completed · surface/gate evidence pending doc sync  |
| `p4-gate-money`                         | `[x]` DONE      | —      | YAML #73 completed · surface/gate evidence pending doc sync  |
| `p5-page-settings-security`             | `[x]` DONE      | —      | YAML #74 completed · surface/gate evidence pending doc sync  |
| `p5-page-settings-bank-accounts`        | `[x]` DONE      | —      | YAML #75 completed · surface/gate evidence pending doc sync  |
| `p5-page-account-kyc`                   | `[x]` DONE      | —      | YAML #76 completed · surface/gate evidence pending doc sync  |
| `p5-page-account-responsible-gaming`    | `[x]` DONE      | —      | YAML #77 completed · surface/gate evidence pending doc sync  |
| `p5-gate-security`                      | `[x]` DONE      | —      | YAML #78 completed · surface/gate evidence pending doc sync  |
| `p3-refresh-auth-landing-design-sot`    | `[x]` DONE      | —      | YAML #79 completed · surface/gate evidence pending doc sync  |
| `p6-shell-appshell`                     | `[x]` DONE      | —      | YAML #80 completed · surface/gate evidence pending doc sync  |
| `p6-page-install`                       | `[x]` DONE      | —      | YAML #81 completed · surface/gate evidence pending doc sync  |
| `p6-page-onboarding`                    | `[x]` DONE      | —      | YAML #82 completed · surface/gate evidence pending doc sync  |
| `p6-page-onboarding-missions`           | `[x]` DONE      | —      | YAML #83 completed · surface/gate evidence pending doc sync  |
| `p6-page-offline`                       | `[x]` DONE      | —      | YAML #84 completed · surface/gate evidence pending doc sync  |
| `p6-page-home-stub`                     | `[x]` DONE      | —      | YAML #85 completed · surface/gate evidence pending doc sync  |
| `p6-gate-shell`                         | `[x]` DONE      | —      | YAML #86 completed · surface/gate evidence pending doc sync  |
| `p6-doc-platform-canon-sync`            | `[x]` DONE      | —      | YAML #87 completed · surface/gate evidence pending doc sync  |
| `p3-refresh-auth-landing-appshell`      | `[x]` DONE      | —      | YAML #88 completed · surface/gate evidence pending doc sync  |
| `p3-platform-narrative-i18n`            | `[x]` DONE      | —      | YAML #89 completed · surface/gate evidence pending doc sync  |
| `p3-operator-visual-signoff`            | `[x]` DONE      | —      | YAML #90 completed · surface/gate evidence pending doc sync  |
| `p6-operator-visual-signoff`            | `[x]` DONE      | —      | YAML #91 completed · surface/gate evidence pending doc sync  |
| `p7-page-referral`                      | `[x]` DONE      | —      | YAML #92 completed · surface/gate evidence pending doc sync  |
| `p7-page-referral-invite`               | `[x]` DONE      | —      | YAML #93 completed · surface/gate evidence pending doc sync  |
| `p7-page-home-missions`                 | `[x]` DONE      | —      | YAML #94 completed · surface/gate evidence pending doc sync  |
| `p7-page-home-attendance`               | `[x]` DONE      | —      | YAML #95 completed · surface/gate evidence pending doc sync  |
| `p7-page-home-missions-invite`          | `[x]` DONE      | —      | YAML #96 completed · surface/gate evidence pending doc sync  |
| `p7-page-home-missions-referral`        | `[x]` DONE      | —      | YAML #97 completed · surface/gate evidence pending doc sync  |
| `p7-page-tier-me`                       | `[x]` DONE      | —      | YAML #98 completed · surface/gate evidence pending doc sync  |
| `p7-page-tier-benefits`                 | `[x]` DONE      | —      | YAML #99 completed · surface/gate evidence pending doc sync  |
| `p7-tier-benefits-narrative`            | `[x]` DONE      | —      | YAML #100 completed · surface/gate evidence pending doc sync |
| `p7-page-share-earnings`                | `[x]` DONE      | —      | YAML #101 completed · surface/gate evidence pending doc sync |
| `p7-gate-growth`                        | `[x]` DONE      | —      | YAML #102 completed · surface/gate evidence pending doc sync |
| `p8-page-home`                          | `[x]` DONE      | —      | YAML #103 completed · surface/gate evidence pending doc sync |
| `p8-page-notifications`                 | `[x]` DONE      | —      | YAML #104 completed · surface/gate evidence pending doc sync |
| `p8-page-settings`                      | `[x]` DONE      | —      | YAML #105 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-notifications`        | `[x]` DONE      | —      | YAML #106 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-referral`             | `[x]` DONE      | —      | YAML #107 completed · surface/gate evidence pending doc sync |
| `p8-page-account-profile`               | `[x]` DONE      | —      | YAML #108 completed · surface/gate evidence pending doc sync |
| `p8-page-account`                       | `[x]` DONE      | —      | YAML #109 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-account`              | `[x]` DONE      | —      | YAML #110 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-preferences`          | `[x]` DONE      | —      | YAML #111 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-api-keys`             | `[x]` DONE      | —      | YAML #112 completed · surface/gate evidence pending doc sync |
| `p8-gate-core`                          | `[x]` DONE      | —      | YAML #113 completed · surface/gate evidence pending doc sync |
| `p8-operator-visual-signoff`            | `[x]` DONE      | —      | YAML #114 completed · surface/gate evidence pending doc sync |
| `p9-page-trade`                         | `[x]` DONE      | —      | YAML #115 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-futures`                 | `[x]` DONE      | —      | YAML #116 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-positions`               | `[x]` DONE      | —      | YAML #117 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-orders`                  | `[x]` DONE      | —      | YAML #118 completed · surface/gate evidence pending doc sync |
| `p9-page-staking`                       | `[x]` DONE      | —      | YAML #119 completed · surface/gate evidence pending doc sync |
| `p9-page-staking-positions`             | `[x]` DONE      | —      | YAML #120 completed · surface/gate evidence pending doc sync |
| `p9-first-trade-education`              | `[x]` DONE      | —      | YAML #121 completed · surface/gate evidence pending doc sync |
| `p9-gate-trade`                         | `[x]` DONE      | —      | YAML #122 completed · surface/gate evidence pending doc sync |
| `p9-world-preflight`                    | `[x]` DONE      | —      | YAML #123 completed · surface/gate evidence pending doc sync |
| `p9-trade-parity-matrix-sync`           | `[x]` DONE      | —      | YAML #124 completed · surface/gate evidence pending doc sync |
| `p9-trade-spot-pair-wire`               | `[x]` DONE      | —      | YAML #125 completed · surface/gate evidence pending doc sync |
| `p9-trade-ticker-header-wire`           | `[x]` DONE      | —      | YAML #126 completed · surface/gate evidence pending doc sync |
| `p9-trade-chart-pro-lwc`                | `[x]` DONE      | —      | YAML #127 completed · surface/gate evidence pending doc sync |
| `p9-trade-chart-overlays-lwc`           | `[x]` DONE      | —      | YAML #128 completed · surface/gate evidence pending doc sync |
| `p9-trade-fills-history-wire`           | `[x]` DONE      | —      | YAML #129 completed · surface/gate evidence pending doc sync |
| `p9-trade-terminal-bottom-dock`         | `[x]` DONE      | —      | YAML #130 completed · surface/gate evidence pending doc sync |
| `p9-trade-recent-trades-rail`           | `[x]` DONE      | —      | YAML #131 completed · surface/gate evidence pending doc sync |
| `p9-trade-orderbook-parity`             | `[x]` DONE      | —      | YAML #132 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-partial-close-ui`     | `[x]` DONE      | —      | YAML #133 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-margin-adjust-ui`     | `[x]` DONE      | —      | YAML #134 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-unrealized-pnl`       | `[x]` DONE      | —      | YAML #135 completed · surface/gate evidence pending doc sync |
| `p9-trade-leverage-slider-ux`           | `[x]` DONE      | —      | YAML #136 completed · surface/gate evidence pending doc sync |
| `p9-trade-order-ticket-density`         | `[x]` DONE      | —      | YAML #137 completed · surface/gate evidence pending doc sync |
| `p9-trade-beginner-help-layer`          | `[x]` DONE      | —      | YAML #138 completed · surface/gate evidence pending doc sync |
| `p9-trade-position-mode-label`          | `[x]` DONE      | —      | YAML #139 completed · surface/gate evidence pending doc sync |
| `p9-trade-cross-margin-canary`          | `[x]` DONE      | —      | YAML #140 completed · surface/gate evidence pending doc sync |
| `p9-trade-funding-history-display`      | `[x]` DONE      | —      | YAML #141 completed · surface/gate evidence pending doc sync |
| `p9-trade-tier-fee-display`             | `[x]` DONE      | —      | YAML #142 completed · surface/gate evidence pending doc sync |
| `p9-trade-oracle-circuit-banner`        | `[x]` DONE      | —      | YAML #143 completed · surface/gate evidence pending doc sync |
| `p9-trade-ultra-layout`                 | `[x]` DONE      | —      | YAML #144 completed · surface/gate evidence pending doc sync |
| `p9-trade-mobile-history-tab`           | `[x]` DONE      | —      | YAML #145 completed · surface/gate evidence pending doc sync |
| `p9-trade-mobile-futures-book-tab`      | `[x]` DONE      | —      | YAML #146 completed · surface/gate evidence pending doc sync |
| `p9-trade-settings-prefs-wire`          | `[x]` DONE      | —      | YAML #147 completed · surface/gate evidence pending doc sync |
| `p9-trade-layout-dedup-gate`            | `[x]` DONE      | —      | YAML #148 completed · surface/gate evidence pending doc sync |
| `p9-trade-i18n-surface-audit`           | `[x]` DONE      | —      | YAML #149 completed · surface/gate evidence pending doc sync |
| `p9-trade-audit-remediation-a1`         | `[x]` DONE      | —      | YAML #150 completed · surface/gate evidence pending doc sync |
| `p9-trade-audit-remediation-a2`         | `[x]` DONE      | —      | YAML #151 completed · surface/gate evidence pending doc sync |
| `p9-operator-visual-signoff`            | `[x]` DONE      | —      | YAML #152 completed · surface/gate evidence pending doc sync |
| `p9-gate-trade-world-class`             | `[x]` DONE      | —      | YAML #153 completed · surface/gate evidence pending doc sync |
| `launch-engine-e1-liquidation-notify`   | `[x]` DONE      | —      | YAML #154 completed · surface/gate evidence pending doc sync |
| `launch-engine-e2-admin-halt-market`    | `[x]` DONE      | —      | YAML #155 completed · surface/gate evidence pending doc sync |
| `launch-engine-e3-ops-telegram-webhook` | `[x]` DONE      | —      | YAML #156 completed · surface/gate evidence pending doc sync |
| `launch-engine-e4-concurrent-race-test` | `[x]` DONE      | —      | YAML #157 completed · surface/gate evidence pending doc sync |
| `p4-fiat-reference-preflight`           | `[x]` DONE      | —      | YAML #158 completed · surface/gate evidence pending doc sync |
| `p4-fiat-currency-precision-ssot`       | `[x]` DONE      | —      | YAML #159 completed · surface/gate evidence pending doc sync |
| `p4-fiat-reference-rates-hook`          | `[x]` DONE      | —      | YAML #160 completed · surface/gate evidence pending doc sync |
| `p4-fiat-hint-display-contract`         | `[x]` DONE      | —      | YAML #161 completed · surface/gate evidence pending doc sync |
| `p4-fiat-money-display-hint`            | `[x]` DONE      | —      | YAML #162 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-fiat-hint`              | `[x]` DONE      | —      | YAML #163 completed · surface/gate evidence pending doc sync |
| `p9-trade-fiat-hint-wire`               | `[x]` DONE      | —      | YAML #164 completed · surface/gate evidence pending doc sync |
| `p7-earn-fiat-hint-co-primary`          | `[x]` DONE      | —      | YAML #165 completed · surface/gate evidence pending doc sync |
| `p5-page-settings-fiat-reference`       | `[x]` DONE      | —      | YAML #166 completed · surface/gate evidence pending doc sync |
| `p4-gate-fiat-reference-world-class`    | `[x]` DONE      | —      | YAML #167 completed · surface/gate evidence pending doc sync |
| `p10-page-sports`                       | `[x]` DONE      | —      | YAML #168 completed · surface/gate evidence pending doc sync |
| `pqa-audit-a-db-guards`                 | `[x]` DONE      | —      | YAML #169 completed · surface/gate evidence pending doc sync |
| `pqa-audit-b-rpc-contract`              | `[x]` DONE      | —      | YAML #170 completed · surface/gate evidence pending doc sync |
| `pqa-audit-c-surface-controls`          | `[x]` DONE      | —      | YAML #171 completed · surface/gate evidence pending doc sync |
| `pqa-audit-d-config-state`              | `[x]` DONE      | —      | YAML #172 completed · surface/gate evidence pending doc sync |
| `pqa-audit-report`                      | `[x]` DONE      | —      | YAML #173 completed · surface/gate evidence pending doc sync |
| `pqa-fix-error-mapping`                 | `[x]` DONE      | —      | YAML #174 completed · surface/gate evidence pending doc sync |
| `pqa-fix-client-gate-prechecks`         | `[x]` DONE      | —      | YAML #175 completed · surface/gate evidence pending doc sync |
| `pqa-fix-dead-controls`                 | `[x]` DONE      | —      | YAML #176 completed · surface/gate evidence pending doc sync |
| `pqa-fix-types-regen`                   | `[x]` DONE      | —      | YAML #177 completed · surface/gate evidence pending doc sync |
| `launch-engine-e5-realtime-publication` | `[x]` DONE      | —      | YAML #178 completed · surface/gate evidence pending doc sync |
| `pqa-gate-platform-audit`               | `[x]` DONE      | —      | YAML #179 completed · surface/gate evidence pending doc sync |
| `da-w0-foundation-ssot-bundle`          | `[ ]` NEXT      | —      | YAML #180 pending                                            |
| `da-w1-ds-foundation-bundle`            | `[ ]` NEXT      | —      | YAML #181 pending                                            |
| `da-w1-gate-ds-2`                       | `[ ]` NEXT      | —      | YAML #182 pending                                            |
| `da-w2-shell-elevation-infra`           | `[ ]` NEXT      | —      | YAML #183 pending                                            |
| `da-w2-gate-shell-elevation`            | `[ ]` NEXT      | —      | YAML #184 pending                                            |
| `da-w3-home-progressive-disclosure`     | `[ ]` NEXT      | —      | YAML #185 pending                                            |
| `da-w3-wallet-hero-accordion`           | `[ ]` NEXT      | —      | YAML #186 pending                                            |
| `da-w3-trade-mobile-ticket-collapse`    | `[ ]` NEXT      | —      | YAML #187 pending                                            |
| `da-w3-gate-ia-progressive`             | `[ ]` NEXT      | —      | YAML #188 pending                                            |
| `da-w4-motion-interaction-wire`         | `[ ]` NEXT      | —      | YAML #189 pending                                            |
| `da-w4-motion-number-count-up`          | `[ ]` NEXT      | —      | YAML #190 pending                                            |
| `da-w4-gate-motion`                     | `[ ]` NEXT      | —      | YAML #191 pending                                            |
| `da-w5-cards-domain-variants`           | `[ ]` NEXT      | —      | YAML #192 pending                                            |
| `da-w5-gate-domain-cards`               | `[ ]` NEXT      | —      | YAML #193 pending                                            |
| `p10-sports-fiat-hint-wire`             | `[ ]` NEXT      | —      | YAML #194 pending                                            |
| `p10-page-sports-prematch`              | `[ ]` NEXT      | —      | YAML #195 pending                                            |
| `p10-page-sports-fixture`               | `[ ]` NEXT      | —      | YAML #196 pending                                            |
| `p10-page-sports-my-bets`               | `[ ]` NEXT      | —      | YAML #197 pending                                            |
| `p10-sports-parity-contract-and-board`  | `[ ]` NEXT      | —      | YAML #198 pending                                            |
| `p10-sports-live-surface-wire`          | `[ ]` NEXT      | —      | YAML #199 pending                                            |
| `p10-sports-cashout-wire`               | `[ ]` NEXT      | —      | YAML #200 pending                                            |
| `p10-sports-sgp-system-unlock`          | `[ ]` NEXT      | —      | YAML #201 pending                                            |
| `p10-sports-risk-limit-display`         | `[ ]` NEXT      | —      | YAML #202 pending                                            |
| `p10-sports-layout-dedup-gate`          | `[ ]` NEXT      | —      | YAML #203 pending                                            |
| `p10-page-sports-rules`                 | `[ ]` NEXT      | —      | YAML #204 pending                                            |
| `p10-page-sports-vip`                   | `[ ]` NEXT      | —      | YAML #205 pending                                            |
| `p10-page-casino`                       | `[ ]` NEXT      | —      | YAML #206 pending                                            |
| `p10-casino-replay-and-infra`           | `[ ]` NEXT      | —      | YAML #207 pending                                            |
| `p10-casino-fiat-hint-session-lock`     | `[ ]` NEXT      | —      | YAML #208 pending                                            |
| `p10-games-batch-a`                     | `[ ]` NEXT      | —      | YAML #209 pending                                            |
| `p10-games-batch-b`                     | `[ ]` NEXT      | —      | YAML #210 pending                                            |
| `p10-games-batch-c`                     | `[ ]` NEXT      | —      | YAML #211 pending                                            |
| `p10-games-batch-d`                     | `[ ]` NEXT      | —      | YAML #212 pending                                            |
| `p10-page-casino-fairness`              | `[ ]` NEXT      | —      | YAML #213 pending                                            |
| `p10-first-bet-education`               | `[ ]` NEXT      | —      | YAML #214 pending                                            |
| `p10-gate-betting`                      | `[ ]` NEXT      | —      | YAML #215 pending                                            |
| `p10-operator-visual-signoff`           | `[ ]` NEXT      | —      | YAML #216 pending                                            |
| `da-w6-brand-mark-aurora`               | `[ ]` NEXT      | —      | YAML #217 pending                                            |
| `da-w6-brand-domain-empty-states`       | `[ ]` NEXT      | —      | YAML #218 pending                                            |
| `da-w6-brand-loading-signature`         | `[ ]` NEXT      | —      | YAML #219 pending                                            |
| `da-w6-gate-brand-elevation`            | `[ ]` NEXT      | —      | YAML #220 pending                                            |
| `p4-operator-visual-signoff`            | `[ ]` NEXT      | —      | YAML #221 pending                                            |
| `p11-page-events`                       | `[ ]` NEXT      | —      | YAML #222 pending                                            |
| `p11-page-earn-play`                    | `[ ]` NEXT      | —      | YAML #223 pending                                            |
| `p11-page-wallet-redeem`                | `[ ]` NEXT      | —      | YAML #224 pending                                            |
| `p11-page-earn-cashback`                | `[ ]` NEXT      | —      | YAML #225 pending                                            |
| `p11-page-referral-leaderboard`         | `[ ]` NEXT      | —      | YAML #226 pending                                            |
| `p11-gate-side-income`                  | `[ ]` NEXT      | —      | YAML #227 pending                                            |
| `p12-page-tier-landing`                 | `[ ]` NEXT      | —      | YAML #228 pending                                            |
| `p12-page-features`                     | `[ ]` NEXT      | —      | YAML #229 pending                                            |
| `p12-page-fees`                         | `[ ]` NEXT      | —      | YAML #230 pending                                            |
| `p12-page-security-landing`             | `[ ]` NEXT      | —      | YAML #231 pending                                            |
| `p12-trust-center-narrative`            | `[ ]` NEXT      | —      | YAML #232 pending                                            |
| `p12-page-announcements`                | `[ ]` NEXT      | —      | YAML #233 pending                                            |
| `p12-page-system-status`                | `[ ]` NEXT      | —      | YAML #234 pending                                            |
| `p12-page-support-ticket`               | `[ ]` NEXT      | —      | YAML #235 pending                                            |
| `p12-page-support`                      | `[ ]` NEXT      | —      | YAML #236 pending                                            |
| `p12-page-support-faq`                  | `[ ]` NEXT      | —      | YAML #237 pending                                            |
| `p12-page-feedback`                     | `[ ]` NEXT      | —      | YAML #238 pending                                            |
| `p12-page-referral-terms`               | `[ ]` NEXT      | —      | YAML #239 pending                                            |
| `p12-page-legal-cookies`                | `[ ]` NEXT      | —      | YAML #240 pending                                            |
| `p12-gate-marketing`                    | `[ ]` NEXT      | —      | YAML #241 pending                                            |
| `da-w8-signature-home-dashboard`        | `[ ]` NEXT      | —      | YAML #242 pending                                            |
| `da-w8-signature-wallet-living-balance` | `[ ]` NEXT      | —      | YAML #243 pending                                            |
| `da-w8-signature-trade-market-heat`     | `[ ]` NEXT      | —      | YAML #244 pending                                            |
| `da-w8-signature-casino-tile-hover`     | `[ ]` NEXT      | —      | YAML #245 pending                                            |
| `da-w8-signature-sports-countdown`      | `[ ]` NEXT      | —      | YAML #246 pending                                            |
| `da-w8-signature-vip-xp-animation`      | `[ ]` NEXT      | —      | YAML #247 pending                                            |
| `da-w8-sound-design-spec-defer`         | `[ ]` NEXT      | —      | YAML #248 pending                                            |
| `da-w8-gate-signature-experience`       | `[ ]` NEXT      | —      | YAML #249 pending                                            |
| `p13-prep-admin-canonical-docs`         | `[ ]` NEXT      | —      | YAML #250 pending                                            |
| `p13-prep-admin-team-desk`              | `[ ]` NEXT      | —      | YAML #251 pending                                            |
| `p13-admin-ops-push`                    | `[ ]` NEXT      | —      | YAML #252 pending                                            |
| `p13-ops-prod-preflight`                | `[ ]` NEXT      | —      | YAML #253 pending                                            |
| `p13-soft-launch-qa`                    | `[ ]` NEXT      | —      | YAML #254 pending                                            |
| `p13-soft-launch-beta`                  | `[ ]` NEXT      | —      | YAML #255 pending                                            |
| `da-w7-enforcement-strict-tokens`       | `[ ]` NEXT      | —      | YAML #256 pending                                            |
| `da-w7-operator-visual-dae-signoff`     | `[ ]` NEXT      | —      | YAML #257 pending                                            |
| `p13-closeout-legacy-class-purge`       | `[ ]` NEXT      | —      | YAML #258 pending                                            |
| `p13-closeout-docs`                     | `[ ]` NEXT      | —      | YAML #259 pending                                            |
| `p13-closeout-ci`                       | `[ ]` NEXT      | —      | YAML #260 pending                                            |
| `launch-ramp-t1-feature-gates`          | `[ ]` NEXT      | —      | YAML #261 pending                                            |
| `launch-scale-t2-triggers`              | `[ ]` NEXT      | —      | YAML #262 pending                                            |
| `ew-e0-adr-approval`                    | `[ ]` NEXT      | —      | YAML #263 pending                                            |
| `ew-e1-adr-tier-decay`                  | `[ ]` NEXT      | —      | YAML #264 pending                                            |
| `ew-e1-engine-decay-rpc`                | `[ ]` NEXT      | —      | YAML #265 pending                                            |
| `ew-e1-gate-decay`                      | `[ ]` NEXT      | —      | YAML #266 pending                                            |
| `ew-e2-adr-mission-admin`               | `[ ]` NEXT      | —      | YAML #267 pending                                            |
| `ew-e2-engine-mission-crud`             | `[ ]` NEXT      | —      | YAML #268 pending                                            |
| `ew-e2-gate-missions`                   | `[ ]` NEXT      | —      | YAML #269 pending                                            |
| `ew-e3-adr-viral-leaderboard`           | `[ ]` NEXT      | —      | YAML #270 pending                                            |
| `ew-e3-engine-leaderboard-rpc`          | `[ ]` NEXT      | —      | YAML #271 pending                                            |
| `ew-e3-engine-promotions-cms`           | `[ ]` NEXT      | —      | YAML #272 pending                                            |
| `ew-e3-gate-cms-promotions`             | `[ ]` NEXT      | —      | YAML #273 pending                                            |
| `ew-e4-adr-tier-option-b`               | `[ ]` NEXT      | —      | YAML #274 pending                                            |
| `ew-e4-engine-admin-tier-write`         | `[ ]` NEXT      | —      | YAML #275 pending                                            |
| `ew-e4-engine-prime-elite`              | `[ ]` NEXT      | —      | YAML #276 pending                                            |
| `ew-e4-engine-tier-option-b`            | `[ ]` NEXT      | —      | YAML #277 pending                                            |
| `ew-e4-gate-tier-option-b`              | `[ ]` NEXT      | —      | YAML #278 pending                                            |
| `ew-e5-gate-gap-surfaces`               | `[ ]` NEXT      | —      | YAML #279 pending                                            |
| `ew-e5-page-referral-leaderboard`       | `[ ]` NEXT      | —      | YAML #280 pending                                            |
| `ew-e5-page-sports-vip`                 | `[ ]` NEXT      | —      | YAML #281 pending                                            |
| `ew-e5-page-tier-me-decay-wire`         | `[ ]` NEXT      | —      | YAML #282 pending                                            |
| `ew-e6-gate-admin-desks`                | `[ ]` NEXT      | —      | YAML #283 pending                                            |
| `ew-e6-page-admin-audit-export`         | `[ ]` NEXT      | —      | YAML #284 pending                                            |
| `ew-e6-page-admin-casino`               | `[ ]` NEXT      | —      | YAML #285 pending                                            |
| `ew-e6-page-admin-cms`                  | `[ ]` NEXT      | —      | YAML #286 pending                                            |
| `ew-e6-page-admin-earn-activity`        | `[ ]` NEXT      | —      | YAML #287 pending                                            |
| `ew-e6-page-admin-promotions`           | `[ ]` NEXT      | —      | YAML #288 pending                                            |
| `ew-e6-page-admin-staking`              | `[ ]` NEXT      | —      | YAML #289 pending                                            |
| `ew-e6-page-admin-tier-benefits`        | `[ ]` NEXT      | —      | YAML #290 pending                                            |
| `ew-e7-adr-social-co-mission`           | `[ ]` NEXT      | —      | YAML #291 pending                                            |
| `ew-e7-engine-social`                   | `[ ]` NEXT      | —      | YAML #292 pending                                            |
| `ew-e7-gate-engine-wave`                | `[ ]` NEXT      | —      | YAML #293 pending                                            |
| `ew-e21-adr-trade-exchange-parity`      | `[ ]` NEXT      | —      | YAML #294 pending                                            |
| `ew-e21-engine-hedge-position-mode`     | `[ ]` NEXT      | —      | YAML #295 pending                                            |
| `ew-e21-engine-position-tpsl-amend`     | `[ ]` NEXT      | —      | YAML #296 pending                                            |
| `ew-e21-engine-reduce-only-orders`      | `[ ]` NEXT      | —      | YAML #297 pending                                            |
| `ew-e21-engine-spot-limit-stop`         | `[ ]` NEXT      | —      | YAML #298 pending                                            |
| `ew-e21-gate-trade-engine-parity`       | `[ ]` NEXT      | —      | YAML #299 pending                                            |
| `ew-e21-ui-trade-engine-unlocks`        | `[ ]` NEXT      | —      | YAML #300 pending                                            |
| `ew-e22-adr-sports-parity`              | `[ ]` NEXT      | —      | YAML #301 pending                                            |
| `ew-e22-engine-partial-cashout`         | `[ ]` NEXT      | —      | YAML #302 pending                                            |
| `ew-e22-engine-odds-acceptance`         | `[ ]` NEXT      | —      | YAML #303 pending                                            |
| `ew-e22-engine-market-catalog`          | `[ ]` NEXT      | —      | YAML #304 pending                                            |
| `ew-e22-gate-sports-parity`             | `[ ]` NEXT      | —      | YAML #305 pending                                            |
| `ew-e22-ui-sports-parity-unlocks`       | `[ ]` NEXT      | —      | YAML #306 pending                                            |
| `ew-e23-adr-casino-live`                | `[ ]` NEXT      | —      | YAML #307 pending                                            |
| `ew-e23-engine-progressive-rounds`      | `[ ]` NEXT      | —      | YAML #308 pending                                            |
| `ew-e23-engine-live-crash`              | `[ ]` NEXT      | —      | YAML #309 pending                                            |
| `ew-e23-engine-pf-seed-controls`        | `[ ]` NEXT      | —      | YAML #310 pending                                            |
| `ew-e23-gate-casino-live`               | `[ ]` NEXT      | —      | YAML #311 pending                                            |
| `ew-e23-ui-casino-live-unlocks`         | `[ ]` NEXT      | —      | YAML #312 pending                                            |
| `ew-e8-adr-financial-connectivity`      | `[ ]` NEXT      | —      | YAML #313 pending                                            |
| `ew-e8-engine-api-keys`                 | `[ ]` NEXT      | —      | YAML #314 pending                                            |
| `ew-e8-engine-p2p-transfer`             | `[ ]` NEXT      | —      | YAML #315 pending                                            |
| `ew-e8-engine-points-shop-reverse`      | `[ ]` NEXT      | —      | YAML #316 pending                                            |
| `ew-e8-gate-financial`                  | `[ ]` NEXT      | —      | YAML #317 pending                                            |
| `ew-e9-adr-identity-support-analytics`  | `[ ]` NEXT      | —      | YAML #318 pending                                            |
| `ew-e9-engine-app-install-attribution`  | `[ ]` NEXT      | —      | YAML #319 pending                                            |
| `ew-e9-engine-product-analytics`        | `[ ]` NEXT      | —      | YAML #320 pending                                            |
| `ew-e9-engine-siwe-auth`                | `[ ]` NEXT      | —      | YAML #321 pending                                            |
| `ew-e9-engine-support-tickets`          | `[ ]` NEXT      | —      | YAML #322 pending                                            |
| `ew-e9-engine-tier-leaderboard`         | `[ ]` NEXT      | —      | YAML #323 pending                                            |
| `ew-e9-gate-identity-support`           | `[ ]` NEXT      | —      | YAML #324 pending                                            |
| `ew-e9-page-admin-support`              | `[ ]` NEXT      | —      | YAML #325 pending                                            |
| `ew-e10-adr-platform-trust-native`      | `[ ]` NEXT      | —      | YAML #326 pending                                            |
| `ew-e10-engine-co-bet`                  | `[ ]` NEXT      | —      | YAML #327 pending                                            |
| `ew-e10-engine-krw-proof-upload`        | `[ ]` NEXT      | —      | YAML #328 pending                                            |
| `ew-e10-engine-mission-chains`          | `[ ]` NEXT      | —      | YAML #329 pending                                            |
| `ew-e10-engine-ml-missions`             | `[ ]` NEXT      | —      | YAML #330 pending                                            |
| `ew-e10-gate-platform-world-class`      | `[ ]` NEXT      | —      | YAML #331 pending                                            |
| `ew-e10-page-admin-krw-proof-review`    | `[ ]` NEXT      | —      | YAML #332 pending                                            |
| `ew-e10-ui-app-install-mission`         | `[ ]` NEXT      | —      | YAML #333 pending                                            |
| `ew-e10-ui-kakao-share-sdk`             | `[ ]` NEXT      | —      | YAML #334 pending                                            |
| `ew-e10-ui-settings-api-keys`           | `[ ]` NEXT      | —      | YAML #335 pending                                            |
| `ew-e10-ui-support-ticket`              | `[ ]` NEXT      | —      | YAML #336 pending                                            |
| `ew-e10-ui-system-status`               | `[ ]` NEXT      | —      | YAML #337 pending                                            |
| `ew-e10-ui-tier-leaderboard`            | `[ ]` NEXT      | —      | YAML #338 pending                                            |
| `ew-e10-ui-wallet-transfer`             | `[ ]` NEXT      | —      | YAML #339 pending                                            |
| `p2-defer-admin-tier-benefits`          | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-promotions`             | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-cms`                    | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-casino`                 | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-staking`                | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-vip`                    | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |
| `p2-defer-admin-support`                | `[x]` cancelled | —      | YAML cancelled · DEFER — 구현 금지                           |

§AI Todo Sync · YAML canonical **179/346 completed** · **NEXT:** `da-w0-foundation-ssot-bundle` (#180) · **preflight:** [`ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)
