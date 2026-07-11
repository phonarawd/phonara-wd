# PHONARA Status (2026-07-10)

> **Active SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)  
> **엔진:** `[x] FULLY CLOSED` — [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md)  
> **Demolition:** `[x] DONE` — [`PRODUCT/DEMOLITION_PLAN.md`](PRODUCT/DEMOLITION_PLAN.md) (이력만 · batch 재실행 아님)

## Gates (2026-07-10 · Cursor 8GB perf v4.4.5 · `phase0-gate`)

| Gate                                        | 결과                                                                                                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cursor perf vitest bundle**               | perf-rollout **11/11** · gate-diagnosis · gate-phase0 · high-remediation · dominant-ram-consumer · claude-desktop · cursor-dev-processes DRIFT · parse-migrations-lock · schtasks · schedule-observe · tsserver-observe · standby **Σ 87/87** |
| **`gate:ai-impl` (`perf-rollout.test.ts`)** | `typecheck` · `lint` · `check:i18n` · `check:release` · `check:hygiene` · `check:ui-architecture` · `check:phase-r-guards --strict` green                                                                                                     |
| **`check:ai-reference`**                    | green                                                                                                                                                                                                                                         |

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
| `gate:ai-impl` DA W7 GATE (`da-w7-enforcement-strict-tokens`)            | vitest **19/19** · `check:design-tokens --strict` green · text-tiny · P3 legacy purge · §34.28 · engine **0**                                                              |
| `gate:ai-impl` DA W7 VISUAL (`da-w7-operator-visual-dae-signoff`)        | vitest **22/22** · Home+Shell+Trade · 4-tier · preview · axe 0 · dead control 0 · §20.12 · engine **0**                                                                    |
| `gate:ai-impl` DA W6 GATE (`da-w6-gate-brand-elevation`)                 | vitest **23/23** · BrandMark aurora · domain empty · Quad Stream · `check:design-tokens` advisory (91 notes) · VISUAL advisory · §34.18–34.20 · engine **0**               |
| `gate:ai-impl` DA W6 Brand (`da-w6-brand-elevation-bundle`)              | vitest **55/55** · BrandMark aurora · domain empty · QuadStreamLoading · router pending · §34.18–34.20 · engine **0**                                                      |
| `gate:ai-impl` P4 VISUAL (`p4-operator-visual-signoff`)                  | vitest surface **13/13** · contract **6/6** · §22.2 Wallet · §25.12.6 · 390/768/1024 · axe critical 0 · dead control 0 · preview https://preview.phonara-web.pages.dev     |
| `gate:ai-impl` P9 VISUAL (`p9-operator-visual-signoff`)                  | vitest trade+staking **168/168** · `p9-trade-visual-signoff` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary                |
| `typecheck`                                                              | green                                                                                                                                                                      |
| `check:design-tokens`                                                    | green (**strict** da-w7) · token SOT · text-tiny · legacy bridge 0 · spacing-ratchet advisory                                                                              |
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

**Phase R UI Rebuild** — [`PRODUCT/REBUILD_PLAN_v1.md`](PRODUCT/REBUILD_PLAN_v1.md) · **Cursor 8GB perf `phase0-gate` `[x]` DONE** 2026-07-10 · **PIR `[x]` DONE** · **전역 NEXT** `ew-e23-ui-casino-live-unlocks` · E23 GATE `[x]` DONE · E23 WAVE `[x]` DONE · E22 UI `[x]` DONE · E22 GATE `[x]` DONE · E22 WAVE `[x]` DONE · E21 UI `[x]` DONE · E21 GATE `#255` `[x]` DONE · E21 WAVE `#254` `[x]` DONE · E7 GATE `#253` `[x]` DONE · E7 WAVE `#252` `[x]` DONE · E6 GATE `#251` `[x]` DONE · E6 WAVE `#250` `[x]` DONE · E5 GATE `#249` `[x]` DONE · E5 WIRE `#248` `[x]` DONE · E4 GATE `#247` `[x]` DONE · E4 WAVE `#246` `[x]` DONE · E3 GATE `#245` `[x]` DONE · E3 WAVE `#244` `[x]` DONE · E2 GATE `#243` `[x]` DONE · E2 WAVE `#242` `[x]` DONE · E1 GATE `#241` `[x]` DONE · E1 `#240` `[x]` DONE · E0 `#239` `[x]` DONE · T2 scale `#238` `[x]` DONE · T1 ramp `#237` `[x]` DONE · P13 closeout `#236` `[x]` DONE · DA W7 VISUAL `#235` agent impl `[x]` · W7 strict `#234` `[x]` · Soft Launch `#233` `[x]` · preflight: [`ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)

**Trade 결함 0 수렴 (형제 큐)** — Plan `트레이딩_결함_0_수렴` · Phase A–C **`[x]` impl** 2026-07-08 · **NEXT** Phase D `phase-d-fills-pagination` (D1) → `phase-d-depth-chart` (D2) · preflight: [`ENGINE_UI_FULL_AUDIT_2026-07-08.md`](audit/ENGINE_UI_FULL_AUDIT_2026-07-08.md)

## §AI Todo Sync (Phase R · YAML 정본 미러 · completed **273**/280 · pending **0** · cancelled **7** · 48차)

> **정본:** Cursor Plan `phase_r_super-app_8bdf2c10` frontmatter · **280 ids** · `bun run check:plan-doc-sync` green 필수 · 기존 surface gate 증거 행은 유지 · 신규 id만 placeholder

| id | 상태 | 완료일 | 증거 |
|----|------|--------|------|
| `engine-p0-apex-closed` | `[x]` DONE | — | YAML #1 completed · surface/gate evidence pending doc sync |
| `engine-p0-no-migration` | `[x]` DONE | — | YAML #2 completed · surface/gate evidence pending doc sync |
| `engine-p0-no-rpc` | `[x]` DONE | — | YAML #3 completed · surface/gate evidence pending doc sync |
| `p1-active-work-ssot-sync` | `[x]` DONE | — | YAML #4 completed · surface/gate evidence pending doc sync |
| `p1-foundation-tokens` | `[x]` DONE | — | YAML #5 completed · surface/gate evidence pending doc sync |
| `p1-foundation-primitives` | `[x]` DONE | — | YAML #6 completed · surface/gate evidence pending doc sync |
| `p1-foundation-router` | `[x]` DONE | — | YAML #7 completed · surface/gate evidence pending doc sync |
| `p1-foundation-redirects` | `[x]` DONE | — | YAML #8 completed · surface/gate evidence pending doc sync |
| `p1-ssot-ia-canon-sync` | `[x]` DONE | — | YAML #9 completed · surface/gate evidence pending doc sync |
| `p1-foundation-brand` | `[x]` DONE | — | YAML #10 completed · surface/gate evidence pending doc sync |
| `p1-foundation-pwa` | `[x]` DONE | — | YAML #11 completed · surface/gate evidence pending doc sync |
| `p1-foundation-i18n` | `[x]` DONE | — | YAML #12 completed · surface/gate evidence pending doc sync |
| `p1-foundation-responsive` | `[x]` DONE | — | YAML #13 completed · surface/gate evidence pending doc sync |
| `p1-foundation-ux-grammar` | `[x]` DONE | — | YAML #14 completed · surface/gate evidence pending doc sync |
| `p1-gate-foundation` | `[x]` DONE | — | YAML #15 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-home` | `[x]` DONE | — | YAML #16 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-queues` | `[x]` DONE | — | YAML #17 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-deposits` | `[x]` DONE | — | YAML #18 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-withdrawals` | `[x]` DONE | — | YAML #19 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-ops` | `[x]` DONE | — | YAML #20 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-earn-referrals` | `[x]` DONE | — | YAML #21 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-earn-missions` | `[x]` DONE | — | YAML #22 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-tiers` | `[x]` DONE | — | YAML #23 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-users` | `[x]` DONE | — | YAML #24 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-risk` | `[x]` DONE | — | YAML #25 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-sports` | `[x]` DONE | — | YAML #26 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-audit` | `[x]` DONE | — | YAML #27 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-settings` | `[x]` DONE | — | YAML #28 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-staking` | `[x]` DONE | — | YAML #29 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-earn-desk` | `[x]` DONE | — | YAML #30 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-earn-rewards` | `[x]` DONE | — | YAML #31 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-viral-stats` | `[x]` DONE | — | YAML #32 completed · surface/gate evidence pending doc sync |
| `p2-gate-admin` | `[x]` DONE | — | YAML #33 completed · surface/gate evidence pending doc sync |
| `p2-closeout-admin-nav` | `[x]` DONE | — | YAML #34 completed · surface/gate evidence pending doc sync |
| `p2-closeout-sports-resume` | `[x]` DONE | — | YAML #35 completed · surface/gate evidence pending doc sync |
| `p2-closeout-migration-gate` | `[x]` DONE | — | YAML #36 completed · surface/gate evidence pending doc sync |
| `p2-closeout-router-navigate` | `[x]` DONE | — | YAML #37 completed · surface/gate evidence pending doc sync |
| `p2-closeout-doc-sync` | `[x]` DONE | — | YAML #38 completed · surface/gate evidence pending doc sync |
| `p2-page-admin-user-tier` | `[x]` DONE | — | YAML #39 completed · surface/gate evidence pending doc sync |
| `p2-closeout-gate-rerun` | `[x]` DONE | — | YAML #40 completed · surface/gate evidence pending doc sync |
| `p3-page-login` | `[x]` DONE | — | YAML #41 completed · surface/gate evidence pending doc sync |
| `p3-page-admin-login` | `[x]` DONE | — | YAML #42 completed · surface/gate evidence pending doc sync |
| `p3-page-admin-mfa-enroll` | `[x]` DONE | — | YAML #43 completed · surface/gate evidence pending doc sync |
| `p3-page-admin-mfa-challenge` | `[x]` DONE | — | YAML #44 completed · surface/gate evidence pending doc sync |
| `p3-page-admin-mfa-policy` | `[x]` DONE | — | YAML #45 completed · surface/gate evidence pending doc sync |
| `p3-gate-admin-auth` | `[x]` DONE | — | YAML #46 completed · surface/gate evidence pending doc sync |
| `p3-page-signup` | `[x]` DONE | — | YAML #47 completed · surface/gate evidence pending doc sync |
| `p3-page-reset-password` | `[x]` DONE | — | YAML #48 completed · surface/gate evidence pending doc sync |
| `p3-page-auth-callback` | `[x]` DONE | — | YAML #49 completed · surface/gate evidence pending doc sync |
| `p3-page-verify-email` | `[x]` DONE | — | YAML #50 completed · surface/gate evidence pending doc sync |
| `p3-page-legal-terms` | `[x]` DONE | — | YAML #51 completed · surface/gate evidence pending doc sync |
| `p3-page-legal-privacy` | `[x]` DONE | — | YAML #52 completed · surface/gate evidence pending doc sync |
| `p3-page-legal-rg` | `[x]` DONE | — | YAML #53 completed · surface/gate evidence pending doc sync |
| `p3-page-legal-risk` | `[x]` DONE | — | YAML #54 completed · surface/gate evidence pending doc sync |
| `p3-page-landing` | `[x]` DONE | — | YAML #55 completed · surface/gate evidence pending doc sync |
| `p3-ads-attribution` | `[x]` DONE | — | YAML #56 completed · surface/gate evidence pending doc sync |
| `p3-gate-auth` | `[x]` DONE | — | YAML #57 completed · surface/gate evidence pending doc sync |
| `p4-preflight-design-sot-motion` | `[x]` DONE | — | YAML #58 completed · surface/gate evidence pending doc sync |
| `p4-preflight-design-sot-locale-type` | `[x]` DONE | — | YAML #59 completed · surface/gate evidence pending doc sync |
| `p4-preflight-design-sot-token-gate` | `[x]` DONE | — | YAML #60 completed · surface/gate evidence pending doc sync |
| `p4-preflight-design-sot-brand-flat` | `[x]` DONE | — | YAML #61 completed · surface/gate evidence pending doc sync |
| `p4-preflight-design-sot-gate` | `[x]` DONE | — | YAML #62 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet` | `[x]` DONE | — | YAML #63 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-deposit` | `[x]` DONE | — | YAML #64 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-deposit-krw` | `[x]` DONE | — | YAML #65 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-deposit-crypto` | `[x]` DONE | — | YAML #66 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-deposit-giftcard` | `[x]` DONE | — | YAML #67 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-withdraw` | `[x]` DONE | — | YAML #68 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-withdraw-krw` | `[x]` DONE | — | YAML #69 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-withdraw-crypto` | `[x]` DONE | — | YAML #70 completed · surface/gate evidence pending doc sync |
| `p4-page-ledger` | `[x]` DONE | — | YAML #71 completed · surface/gate evidence pending doc sync |
| `p4-page-rewards-history` | `[x]` DONE | — | YAML #72 completed · surface/gate evidence pending doc sync |
| `p4-gate-money` | `[x]` DONE | — | YAML #73 completed · surface/gate evidence pending doc sync |
| `p5-page-settings-security` | `[x]` DONE | — | YAML #74 completed · surface/gate evidence pending doc sync |
| `p5-page-settings-bank-accounts` | `[x]` DONE | — | YAML #75 completed · surface/gate evidence pending doc sync |
| `p5-page-account-kyc` | `[x]` DONE | — | YAML #76 completed · surface/gate evidence pending doc sync |
| `p5-page-account-responsible-gaming` | `[x]` DONE | — | YAML #77 completed · surface/gate evidence pending doc sync |
| `p5-gate-security` | `[x]` DONE | — | YAML #78 completed · surface/gate evidence pending doc sync |
| `p3-refresh-auth-landing-design-sot` | `[x]` DONE | — | YAML #79 completed · surface/gate evidence pending doc sync |
| `p6-shell-appshell` | `[x]` DONE | — | YAML #80 completed · surface/gate evidence pending doc sync |
| `p6-page-install` | `[x]` DONE | — | YAML #81 completed · surface/gate evidence pending doc sync |
| `p6-page-onboarding` | `[x]` DONE | — | YAML #82 completed · surface/gate evidence pending doc sync |
| `p6-page-onboarding-missions` | `[x]` DONE | — | YAML #83 completed · surface/gate evidence pending doc sync |
| `p6-page-offline` | `[x]` DONE | — | YAML #84 completed · surface/gate evidence pending doc sync |
| `p6-page-home-stub` | `[x]` DONE | — | YAML #85 completed · surface/gate evidence pending doc sync |
| `p6-gate-shell` | `[x]` DONE | — | YAML #86 completed · surface/gate evidence pending doc sync |
| `p6-doc-platform-canon-sync` | `[x]` DONE | — | YAML #87 completed · surface/gate evidence pending doc sync |
| `p3-refresh-auth-landing-appshell` | `[x]` DONE | — | YAML #88 completed · surface/gate evidence pending doc sync |
| `p3-platform-narrative-i18n` | `[x]` DONE | — | YAML #89 completed · surface/gate evidence pending doc sync |
| `p3-operator-visual-signoff` | `[x]` DONE | — | YAML #90 completed · surface/gate evidence pending doc sync |
| `p6-operator-visual-signoff` | `[x]` DONE | — | YAML #91 completed · surface/gate evidence pending doc sync |
| `p7-page-referral` | `[x]` DONE | — | YAML #92 completed · surface/gate evidence pending doc sync |
| `p7-page-referral-invite` | `[x]` DONE | — | YAML #93 completed · surface/gate evidence pending doc sync |
| `p7-page-home-missions` | `[x]` DONE | — | YAML #94 completed · surface/gate evidence pending doc sync |
| `p7-page-home-attendance` | `[x]` DONE | — | YAML #95 completed · surface/gate evidence pending doc sync |
| `p7-page-home-missions-invite` | `[x]` DONE | — | YAML #96 completed · surface/gate evidence pending doc sync |
| `p7-page-home-missions-referral` | `[x]` DONE | — | YAML #97 completed · surface/gate evidence pending doc sync |
| `p7-page-tier-me` | `[x]` DONE | — | YAML #98 completed · surface/gate evidence pending doc sync |
| `p7-page-tier-benefits` | `[x]` DONE | — | YAML #99 completed · surface/gate evidence pending doc sync |
| `p7-tier-benefits-narrative` | `[x]` DONE | — | YAML #100 completed · surface/gate evidence pending doc sync |
| `p7-page-share-earnings` | `[x]` DONE | — | YAML #101 completed · surface/gate evidence pending doc sync |
| `p7-gate-growth` | `[x]` DONE | — | YAML #102 completed · surface/gate evidence pending doc sync |
| `p8-page-home` | `[x]` DONE | — | YAML #103 completed · surface/gate evidence pending doc sync |
| `p8-page-notifications` | `[x]` DONE | — | YAML #104 completed · surface/gate evidence pending doc sync |
| `p8-page-settings` | `[x]` DONE | — | YAML #105 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-notifications` | `[x]` DONE | — | YAML #106 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-referral` | `[x]` DONE | — | YAML #107 completed · surface/gate evidence pending doc sync |
| `p8-page-account-profile` | `[x]` DONE | — | YAML #108 completed · surface/gate evidence pending doc sync |
| `p8-page-account` | `[x]` DONE | — | YAML #109 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-account` | `[x]` DONE | — | YAML #110 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-preferences` | `[x]` DONE | — | YAML #111 completed · surface/gate evidence pending doc sync |
| `p8-page-settings-api-keys` | `[x]` DONE | — | YAML #112 completed · surface/gate evidence pending doc sync |
| `p8-gate-core` | `[x]` DONE | — | YAML #113 completed · surface/gate evidence pending doc sync |
| `p8-operator-visual-signoff` | `[x]` DONE | — | YAML #114 completed · surface/gate evidence pending doc sync |
| `p9-page-trade` | `[x]` DONE | — | YAML #115 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-futures` | `[x]` DONE | — | YAML #116 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-positions` | `[x]` DONE | — | YAML #117 completed · surface/gate evidence pending doc sync |
| `p9-page-trade-orders` | `[x]` DONE | — | YAML #118 completed · surface/gate evidence pending doc sync |
| `p9-page-staking` | `[x]` DONE | — | YAML #119 completed · surface/gate evidence pending doc sync |
| `p9-page-staking-positions` | `[x]` DONE | — | YAML #120 completed · surface/gate evidence pending doc sync |
| `p9-first-trade-education` | `[x]` DONE | — | YAML #121 completed · surface/gate evidence pending doc sync |
| `p9-gate-trade` | `[x]` DONE | — | YAML #122 completed · surface/gate evidence pending doc sync |
| `p9-world-preflight` | `[x]` DONE | — | YAML #123 completed · surface/gate evidence pending doc sync |
| `p9-trade-parity-matrix-sync` | `[x]` DONE | — | YAML #124 completed · surface/gate evidence pending doc sync |
| `p9-trade-spot-pair-wire` | `[x]` DONE | — | YAML #125 completed · surface/gate evidence pending doc sync |
| `p9-trade-ticker-header-wire` | `[x]` DONE | — | YAML #126 completed · surface/gate evidence pending doc sync |
| `p9-trade-chart-pro-lwc` | `[x]` DONE | — | YAML #127 completed · surface/gate evidence pending doc sync |
| `p9-trade-chart-overlays-lwc` | `[x]` DONE | — | YAML #128 completed · surface/gate evidence pending doc sync |
| `p9-trade-fills-history-wire` | `[x]` DONE | — | YAML #129 completed · surface/gate evidence pending doc sync |
| `p9-trade-terminal-bottom-dock` | `[x]` DONE | — | YAML #130 completed · surface/gate evidence pending doc sync |
| `p9-trade-recent-trades-rail` | `[x]` DONE | — | YAML #131 completed · surface/gate evidence pending doc sync |
| `p9-trade-orderbook-parity` | `[x]` DONE | — | YAML #132 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-partial-close-ui` | `[x]` DONE | — | YAML #133 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-margin-adjust-ui` | `[x]` DONE | — | YAML #134 completed · surface/gate evidence pending doc sync |
| `p9-trade-futures-unrealized-pnl` | `[x]` DONE | — | YAML #135 completed · surface/gate evidence pending doc sync |
| `p9-trade-leverage-slider-ux` | `[x]` DONE | — | YAML #136 completed · surface/gate evidence pending doc sync |
| `p9-trade-order-ticket-density` | `[x]` DONE | — | YAML #137 completed · surface/gate evidence pending doc sync |
| `p9-trade-beginner-help-layer` | `[x]` DONE | — | YAML #138 completed · surface/gate evidence pending doc sync |
| `p9-trade-position-mode-label` | `[x]` DONE | — | YAML #139 completed · surface/gate evidence pending doc sync |
| `p9-trade-cross-margin-canary` | `[x]` DONE | — | YAML #140 completed · surface/gate evidence pending doc sync |
| `p9-trade-funding-history-display` | `[x]` DONE | — | YAML #141 completed · surface/gate evidence pending doc sync |
| `p9-trade-tier-fee-display` | `[x]` DONE | — | YAML #142 completed · surface/gate evidence pending doc sync |
| `p9-trade-oracle-circuit-banner` | `[x]` DONE | — | YAML #143 completed · surface/gate evidence pending doc sync |
| `p9-trade-ultra-layout` | `[x]` DONE | — | YAML #144 completed · surface/gate evidence pending doc sync |
| `p9-trade-mobile-history-tab` | `[x]` DONE | — | YAML #145 completed · surface/gate evidence pending doc sync |
| `p9-trade-mobile-futures-book-tab` | `[x]` DONE | — | YAML #146 completed · surface/gate evidence pending doc sync |
| `p9-trade-settings-prefs-wire` | `[x]` DONE | — | YAML #147 completed · surface/gate evidence pending doc sync |
| `p9-trade-layout-dedup-gate` | `[x]` DONE | — | YAML #148 completed · surface/gate evidence pending doc sync |
| `p9-trade-i18n-surface-audit` | `[x]` DONE | — | YAML #149 completed · surface/gate evidence pending doc sync |
| `p9-trade-audit-remediation-a1` | `[x]` DONE | — | YAML #150 completed · surface/gate evidence pending doc sync |
| `p9-trade-audit-remediation-a2` | `[x]` DONE | — | YAML #151 completed · surface/gate evidence pending doc sync |
| `p9-operator-visual-signoff` | `[x]` DONE | — | YAML #152 completed · surface/gate evidence pending doc sync |
| `p9-gate-trade-world-class` | `[x]` DONE | — | YAML #153 completed · surface/gate evidence pending doc sync |
| `launch-engine-e1-liquidation-notify` | `[x]` DONE | — | YAML #154 completed · surface/gate evidence pending doc sync |
| `launch-engine-e2-admin-halt-market` | `[x]` DONE | — | YAML #155 completed · surface/gate evidence pending doc sync |
| `launch-engine-e3-ops-telegram-webhook` | `[x]` DONE       | —          | YAML #156 completed · surface/gate evidence pending doc sync                                                                                                                                                                                |
| `launch-engine-e4-concurrent-race-test` | `[x]` DONE       | —          | YAML #157 completed · surface/gate evidence pending doc sync                                                                                                                                                                                |
| `p4-fiat-reference-preflight` | `[x]` DONE | — | YAML #158 completed · surface/gate evidence pending doc sync |
| `p4-fiat-currency-precision-ssot` | `[x]` DONE | — | YAML #159 completed · surface/gate evidence pending doc sync |
| `p4-fiat-reference-rates-hook` | `[x]` DONE | — | YAML #160 completed · surface/gate evidence pending doc sync |
| `p4-fiat-hint-display-contract` | `[x]` DONE | — | YAML #161 completed · surface/gate evidence pending doc sync |
| `p4-fiat-money-display-hint` | `[x]` DONE | — | YAML #162 completed · surface/gate evidence pending doc sync |
| `p4-page-wallet-fiat-hint` | `[x]` DONE | — | YAML #163 completed · surface/gate evidence pending doc sync |
| `p9-trade-fiat-hint-wire` | `[x]` DONE | — | YAML #164 completed · surface/gate evidence pending doc sync |
| `p7-earn-fiat-hint-co-primary` | `[x]` DONE | — | YAML #165 completed · surface/gate evidence pending doc sync |
| `p5-page-settings-fiat-reference` | `[x]` DONE | — | YAML #166 completed · surface/gate evidence pending doc sync |
| `p4-gate-fiat-reference-world-class` | `[x]` DONE | — | YAML #167 completed · surface/gate evidence pending doc sync |
| `p10-page-sports` | `[x]` DONE | — | YAML #168 completed · surface/gate evidence pending doc sync |
| `pqa-audit-a-db-guards` | `[x]` DONE | — | YAML #169 completed · surface/gate evidence pending doc sync |
| `pqa-audit-b-rpc-contract` | `[x]` DONE | — | YAML #170 completed · surface/gate evidence pending doc sync |
| `pqa-audit-c-surface-controls` | `[x]` DONE | — | YAML #171 completed · surface/gate evidence pending doc sync |
| `pqa-audit-d-config-state` | `[x]` DONE | — | YAML #172 completed · surface/gate evidence pending doc sync |
| `pqa-audit-report` | `[x]` DONE | — | YAML #173 completed · surface/gate evidence pending doc sync |
| `pqa-fix-error-mapping` | `[x]` DONE | — | YAML #174 completed · surface/gate evidence pending doc sync |
| `pqa-fix-client-gate-prechecks` | `[x]` DONE | — | YAML #175 completed · surface/gate evidence pending doc sync |
| `pqa-fix-dead-controls` | `[x]` DONE | — | YAML #176 completed · surface/gate evidence pending doc sync |
| `pqa-fix-types-regen` | `[x]` DONE | — | YAML #177 completed · surface/gate evidence pending doc sync |
| `launch-engine-e5-realtime-publication` | `[x]` DONE       | —          | YAML #178 completed · surface/gate evidence pending doc sync                                                                                                                                                                                |
| `pqa-gate-platform-audit` | `[x]` DONE | — | YAML #179 completed · surface/gate evidence pending doc sync |
| `r0-forensic-ssot-honesty-bundle` | `[x]` DONE | — | YAML #180 completed · surface/gate evidence pending doc sync |
| `r0-sports-launch-gate-wire` | `[x]` DONE | — | YAML #181 completed · surface/gate evidence pending doc sync |
| `r0-admin-rbac-ops-wire` | `[x]` DONE | — | YAML #182 completed · surface/gate evidence pending doc sync |
| `r0-staking-domain-sot-sync` | `[x]` DONE | — | YAML #183 completed · surface/gate evidence pending doc sync |
| `r0-gate-forensic-remediation` | `[x]` DONE | — | YAML #184 completed · surface/gate evidence pending doc sync |
| `da-w0-foundation-ssot-bundle` | `[x]` DONE | — | YAML #185 completed · surface/gate evidence pending doc sync |
| `da-w1-ds-foundation-bundle` | `[x]` DONE | — | YAML #186 completed · surface/gate evidence pending doc sync |
| `da-w1-gate-ds-2` | `[x]` DONE | — | YAML #187 completed · surface/gate evidence pending doc sync |
| `da-w2-shell-elevation-infra` | `[x]` DONE | — | YAML #188 completed · surface/gate evidence pending doc sync |
| `da-w2-gate-shell-elevation` | `[x]` DONE | — | YAML #189 completed · surface/gate evidence pending doc sync |
| `da-w3-ia-progressive-bundle` | `[x]` DONE | — | YAML #190 completed · surface/gate evidence pending doc sync |
| `da-w3-gate-ia-progressive` | `[x]` DONE | — | YAML #191 completed · surface/gate evidence pending doc sync |
| `da-w4-motion-system-bundle` | `[x]` DONE | — | YAML #192 completed · surface/gate evidence pending doc sync |
| `da-w4-gate-motion` | `[x]` DONE | — | YAML #193 completed · surface/gate evidence pending doc sync |
| `da-w5-cards-domain-variants` | `[x]` DONE | — | YAML #194 completed · surface/gate evidence pending doc sync |
| `da-w5-gate-domain-cards` | `[x]` DONE | — | YAML #195 completed · surface/gate evidence pending doc sync |
| `p10-sports-fiat-hint-wire` | `[x]` DONE | — | YAML #196 completed · surface/gate evidence pending doc sync |
| `p10-sports-hub-pages` | `[x]` DONE | — | YAML #197 completed · surface/gate evidence pending doc sync |
| `p10-sports-parity-contract-and-board` | `[x]` DONE | — | YAML #198 completed · surface/gate evidence pending doc sync |
| `p10-sports-live-surface-wire` | `[x]` DONE | — | YAML #199 completed · surface/gate evidence pending doc sync |
| `p10-sports-slip-advanced-wire` | `[x]` DONE | — | YAML #200 completed · surface/gate evidence pending doc sync |
| `p10-sports-layout-dedup-gate` | `[x]` DONE | — | YAML #201 completed · surface/gate evidence pending doc sync |
| `p10-sports-rules-and-vip-stub` | `[x]` DONE | — | YAML #202 completed · surface/gate evidence pending doc sync |
| `p10-page-casino` | `[x]` DONE | — | YAML #203 completed · surface/gate evidence pending doc sync |
| `p10-casino-replay-and-infra` | `[x]` DONE | — | YAML #204 completed · surface/gate evidence pending doc sync |
| `p10-casino-fiat-hint-session-lock` | `[x]` DONE | — | YAML #205 completed · surface/gate evidence pending doc sync |
| `p2-admin-table-primitive` | `[x]` DONE | — | YAML #206 completed · surface/gate evidence pending doc sync |
| `p2-gate-admin-table-dedup` | `[x]` DONE | — | YAML #207 completed · surface/gate evidence pending doc sync |
| `p10-games-batch-a` | `[x]` DONE | — | YAML #208 completed · surface/gate evidence pending doc sync |
| `p10-games-batch-b` | `[x]` DONE | — | YAML #209 completed · surface/gate evidence pending doc sync |
| `p10-games-batch-c` | `[x]` DONE | — | YAML #210 completed · surface/gate evidence pending doc sync |
| `p10-games-batch-d` | `[x]` DONE | — | YAML #211 completed · surface/gate evidence pending doc sync |
| `p10-page-casino-fairness` | `[x]` DONE | — | YAML #212 completed · surface/gate evidence pending doc sync |
| `p10-first-bet-education` | `[x]` DONE | — | YAML #213 completed · surface/gate evidence pending doc sync |
| `p10-gate-betting` | `[x]` DONE | — | YAML #214 completed · surface/gate evidence pending doc sync |
| `p10-operator-visual-signoff` | `[x]` DONE | — | YAML #215 completed · surface/gate evidence pending doc sync |
| `da-w6-brand-elevation-bundle` | `[x]` DONE | — | YAML #216 completed · surface/gate evidence pending doc sync |
| `da-w6-gate-brand-elevation` | `[x]` DONE | — | YAML #217 completed · surface/gate evidence pending doc sync |
| `p4-operator-visual-signoff` | `[x]` DONE | — | YAML #218 completed · surface/gate evidence pending doc sync |
| `p11-earn-side-surfaces` | `[x]` DONE | — | YAML #219 completed · surface/gate evidence pending doc sync |
| `p11-page-wallet-redeem` | `[x]` DONE | — | YAML #220 completed · surface/gate evidence pending doc sync |
| `p11-gate-side-income` | `[x]` DONE | — | YAML #221 completed · surface/gate evidence pending doc sync |
| `p12-trust-marketing-hub` | `[x]` DONE | — | YAML #222 completed · surface/gate evidence pending doc sync |
| `p12-community-support-hub` | `[x]` DONE | — | YAML #223 completed · surface/gate evidence pending doc sync |
| `p12-legal-pages` | `[x]` DONE | — | YAML #224 completed · surface/gate evidence pending doc sync |
| `p12-gate-marketing` | `[x]` DONE | — | YAML #225 completed · surface/gate evidence pending doc sync |
| `da-w8-signature-surfaces-bundle` | `[x]` DONE | — | YAML #226 completed · surface/gate evidence pending doc sync |
| `da-w8-sound-design-spec-defer` | `[x]` DONE | — | YAML #227 completed · surface/gate evidence pending doc sync |
| `da-w8-gate-signature-experience` | `[x]` DONE | — | YAML #228 completed · surface/gate evidence pending doc sync |
| `p13-prep-admin-canonical-docs` | `[x]` DONE | — | YAML #229 completed · surface/gate evidence pending doc sync |
| `p13-prep-admin-team-desk` | `[x]` DONE | — | YAML #230 completed · surface/gate evidence pending doc sync |
| `p13-admin-ops-push` | `[x]` DONE | — | YAML #231 completed · surface/gate evidence pending doc sync |
| `p13-ops-prod-preflight` | `[x]` DONE | — | YAML #232 completed · surface/gate evidence pending doc sync |
| `p13-soft-launch-bundle` | `[x]` DONE | — | YAML #233 completed · surface/gate evidence pending doc sync |
| `da-w7-enforcement-strict-tokens` | `[x]` DONE | — | YAML #234 completed · surface/gate evidence pending doc sync |
| `da-w7-operator-visual-dae-signoff` | `[x]` DONE | — | YAML #235 completed · surface/gate evidence pending doc sync |
| `p13-closeout-bundle` | `[x]` DONE | — | YAML #236 completed · surface/gate evidence pending doc sync |
| `launch-ramp-t1-feature-gates` | `[x]` DONE | — | YAML #237 completed · surface/gate evidence pending doc sync |
| `launch-scale-t2-triggers` | `[x]` DONE | — | YAML #238 completed · surface/gate evidence pending doc sync |
| `ew-e0-adr-approval` | `[x]` DONE | — | YAML #239 completed · surface/gate evidence pending doc sync |
| `ew-e1-decay-wave` | `[x]` DONE | — | YAML #240 completed · surface/gate evidence pending doc sync |
| `ew-e1-gate-decay` | `[x]` DONE | — | YAML #241 completed · surface/gate evidence pending doc sync |
| `ew-e2-missions-wave` | `[x]` DONE | — | YAML #242 completed · surface/gate evidence pending doc sync |
| `ew-e2-gate-missions` | `[x]` DONE | — | YAML #243 completed · surface/gate evidence pending doc sync |
| `ew-e3-viral-cms-wave` | `[x]` DONE | — | YAML #244 completed · surface/gate evidence pending doc sync |
| `ew-e3-gate-cms-promotions` | `[x]` DONE | — | YAML #245 completed · surface/gate evidence pending doc sync |
| `ew-e4-tier-option-b-wave` | `[x]` DONE | — | YAML #246 completed · surface/gate evidence pending doc sync |
| `ew-e4-gate-tier-option-b` | `[x]` DONE | — | YAML #247 completed · surface/gate evidence pending doc sync |
| `ew-e5-gap-surfaces-wire` | `[x]` DONE | — | YAML #248 completed · surface/gate evidence pending doc sync |
| `ew-e5-gate-gap-surfaces` | `[x]` DONE | — | YAML #249 completed · surface/gate evidence pending doc sync |
| `ew-e6-admin-desks-wave` | `[x]` DONE | — | YAML #250 completed · surface/gate evidence pending doc sync |
| `ew-e6-gate-admin-desks` | `[x]` DONE | — | YAML #251 completed · surface/gate evidence pending doc sync |
| `ew-e7-social-wave` | `[x]` DONE | — | YAML #252 completed · surface/gate evidence pending doc sync |
| `ew-e7-gate-engine-wave` | `[x]` DONE | — | YAML #253 completed · surface/gate evidence pending doc sync |
| `ew-e21-trade-parity-wave` | `[x]` DONE | — | YAML #254 completed · surface/gate evidence pending doc sync |
| `ew-e21-gate-trade-engine-parity` | `[x]` DONE | — | YAML #255 completed · surface/gate evidence pending doc sync |
| `ew-e21-ui-trade-engine-unlocks` | `[x]` DONE | — | YAML #256 completed · surface/gate evidence pending doc sync |
| `ew-e22-sports-parity-wave` | `[x]` DONE | — | YAML #257 completed · surface/gate evidence pending doc sync |
| `ew-e22-gate-sports-parity` | `[x]` DONE | — | YAML #258 completed · surface/gate evidence pending doc sync |
| `ew-e22-ui-sports-parity-unlocks` | `[x]` DONE | — | YAML #259 completed · surface/gate evidence pending doc sync |
| `ew-e23-casino-live-wave` | `[x]` DONE | — | YAML #260 completed · surface/gate evidence pending doc sync |
| `ew-e23-gate-casino-live` | `[x]` DONE | — | YAML #261 completed · surface/gate evidence pending doc sync |
| `ew-e23-ui-casino-live-unlocks` | `[x]` DONE | — | YAML #262 completed · surface/gate evidence pending doc sync |
| `ew-e8-financial-wave` | `[x]` DONE | — | YAML #263 completed · surface/gate evidence pending doc sync |
| `ew-e8-gate-financial` | `[x]` DONE | — | YAML #264 completed · surface/gate evidence pending doc sync |
| `ew-e9-identity-wave` | `[x]` DONE | — | YAML #265 completed · surface/gate evidence pending doc sync |
| `ew-e9-gate-identity-support` | `[x]` DONE | — | YAML #266 completed · surface/gate evidence pending doc sync |
| `ew-e9-page-admin-support` | `[x]` DONE | — | YAML #267 completed · surface/gate evidence pending doc sync |
| `ew-e10-platform-engine-wave` | `[x]` DONE | — | YAML #268 completed · surface/gate evidence pending doc sync |
| `ew-e10-page-admin-krw-proof-review` | `[x]` DONE | — | YAML #269 completed · surface/gate evidence pending doc sync |
| `ew-e10-wallet-settings-ui` | `[x]` DONE | — | YAML #270 completed · surface/gate evidence pending doc sync |
| `ew-e10-trust-support-ui` | `[x]` DONE | — | YAML #271 completed · surface/gate evidence pending doc sync |
| `ew-e10-growth-ui` | `[x]` DONE | — | YAML #272 completed · surface/gate evidence pending doc sync |
| `ew-e10-gate-platform-world-class` | `[x]` DONE | — | YAML #273 completed · surface/gate evidence pending doc sync |
| `p2-defer-admin-tier-benefits` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-promotions` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-cms` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-casino` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-staking` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-vip` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |
| `p2-defer-admin-support` | `[x]` cancelled | — | YAML cancelled · DEFER — 구현 금지 |

§AI Todo Sync · YAML canonical **273/280 completed** · **NEXT:** `null` (#null) · **preflight:** [`ACTIVE_WORK_SSOT.md`](SSOT/ACTIVE_WORK_SSOT.md)
