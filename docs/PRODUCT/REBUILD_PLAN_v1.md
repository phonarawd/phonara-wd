# Phase R — PrimeForge Super-App Rebuild (v1)

> **상태:** `[x] operator 승인` (2026-07-04) · **실행 중** — E21 GATE `#255` **`[x]` DONE** (2026-07-12) · **NEXT** `ew-e21-ui-trade-engine-unlocks` · E21 WAVE `#254` **`[x]`** · E7 GATE `#253` **`[x]`** · E7 WAVE `#252` **`[x]`** · E6 GATE `#251` **`[x]`** · E6 WAVE `#250` **`[x]`** · E5 GATE `#249` **`[x]`** · E5 WIRE `#248` **`[x]`** · E4 GATE `#247` **`[x]`** · E4 WAVE `#246` **`[x]`** · E3 GATE `#245` **`[x]`** · E3 WAVE `#244` **`[x]`** · E2 GATE `#243` **`[x]`** · E2 WAVE `#242` **`[x]`** · E1 GATE `#241` **`[x]`** · E1 wave `#240` **`[x]`** · E0 ADR `#239` **`[x]`** · T2 scale `#238` **`[x]`** · T1 ramp `#237` **`[x]`** · P13 closeout `#236` **`[x]`** · DA W7 VISUAL `#235` agent impl **`[x]`**
> **정본 큐:** Cursor Plan `phase_r_super-app_8bdf2c10` (YAML frontmatter · **280 ids** · §20.6.1: Track A **245** + Track B **35** · completed **204** · pending **69** · cancelled **7** · **52차** 2026-07-10 — §35 Forensic R0 · §34 DA W5 GATE · §22.2.5 Sports Parity · §23.2.1 Casino replay · E22/E23)
> **World-Class:** §32 · E0–**E10** · §32.5 operator trust pages  
> **Active SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md)

---

## 전제 (frozen · 재착수 금지)

| 항목               | 상태                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| Demolition         | `[x] DONE` — [`DEMOLITION_PLAN.md`](DEMOLITION_PLAN.md) (이력만)             |
| Engine Apex        | `[x] FULLY CLOSED` — [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) |
| Web presentation   | 최소 stub — `main.tsx` · `routes/__root.tsx` · PWA shell glue                |
| Engine glue (KEEP) | `apps/web/src/domain/` · `features/` · `hooks/` · `contracts/`               |
| Admin glue (KEEP)  | `apps/admin/src/hooks/admin/` · `domain/`                                    |

**Non-negotiable:** SQL/RPC = settlement authority · UI display only · `@phonara/money` · PG-less primary ([ADR-001](ADR/001-pg-less-funding-rails.md))

---

## 2-Track 모델

|               | Track A (Presentation)                 | Track B (Engine Wave)              |
| ------------- | -------------------------------------- | ---------------------------------- |
| **목표**      | 0원 출시 Soft Launch · exists RPC wire | gap 엔진 완성 · STUB→live          |
| **엔진 변경** | **금지** (glue only)                   | 허용 (operator RED STOP 해제 후)   |
| **마감**      | `p13-closeout-bundle`                  | `ew-e10-gate-platform-world-class` |

```text
P0 (DONE) → P1 Foundation → P2 Admin → P3 Auth → P4 Money → P5 Security
  → P6 Shell → P7 Growth → P8 Core UX → P9–P12 Product → P13 Soft Launch
  → E0–E10 Engine Wave (Platform World-Class · `ew-e10-gate-platform-world-class`)
```

**0원 출시 크리티컬 패스:** P2 Admin → P4 Money → **P7 Growth** → P8 `/home` → P13 Soft Launch

**플랫폼 심장 3페이지:** `/tier/me` · `/home/missions` · `/referral`

---

## Strict Perfect (non-waivable)

- **노출 = 동작** — IA에 보이는 CTA는 ENGINE exists(또는 E-Wave 후) + gate green
- **STUB/gap 미노출** — 엔진 없는 route는 등록만 · IA에서 숨김
- **프로덕션 문구만** — `check:release` · i18n key only · DEV 게이팅
- **한 Part green 전 다음 Part 금지** (G1)

---

## Part · Wave 게이트 (요약)

| Part       | Scope                                                                         | Implemented gate                                                                                     |
| ---------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **P1·W0**  | tokens · primitives · Router · brand · PWA · i18n · responsive · UX grammar   | `[x] GATE green` — `typecheck` · `check:i18n` · `check:pwa` · `check:release` · `gate:ai-impl` 34/34 |
| **P2·W1**  | **Admin 우선** — exception queues · deposits · withdrawals · §29 왕초보 정본  | `[x] GATE green` — `gate:ai-impl --test apps/admin` · vitest 38/38 · `check:ui-architecture` · §29.4 |
| **P3·W2**  | `/` landing · `/login` · `/signup` · `/legal/*` · admin auth funnel · §28 ads | `[x] GATE green` — `gate:ai-impl` web **87/87** · admin **90/90** · §28.6 · 2026-07-04               |
| **P4·W3**  | wallet · 3-rail deposit/withdraw · ledger                                     | `[x] GATE impl` — `gate:ai-impl` wallet 57/57 · §31.3 · `wallet-d3.spec.ts` (operator/CI Σ=0)        |
| **P5·W4**  | security · KYC · RG · bank accounts                                           | `[x] GATE green` — `gate:ai-impl` security **57/57** · `check:ai-reference` · 2026-07-05             |
| **P6–P13** | shell · growth · surfaces · soft launch                                       | 플랜 §8.1 표 정본                                                                                    |

Heavy gate (E2E · SQL · `check:full`) — operator 「gate 실행」 또는 CI only (G13).

---

## Presentation 구조 (P1+)

```text
apps/web/src/product/
  tokens/       — --ds-* SOT · fonts.css (§25.1)
  primitives/   — shadcn/Radix vendoring · CVA (§25.2)
  i18n/         — I18nShell · `@phonara/i18n/react` glue (§1)
  shell/        — AppShell · chrome owners (§12.19)
  surfaces/     — domain pages (kebab-case routes)
  bridge/       — engine hook/RPC display adapters
```

**금지:** `components/ui` · `@phonara/ui` · `theme.css` · parallel hub route

**Route 규약:** Earn hub `/home` only · 미션 `/home/missions/*` · 입출금 `/wallet/deposit/*` · `/wallet/withdraw/*` — §12.0α

---

## UX 의도 (실행 큐 아님)

- `docs/SSOT/*_UX_CANON.md` · `UX_REFERENCE_CANON.md` · `SURFACE_BLUEPRINTS.md`
- page todo 착수 전 §22.2 surface 체크리스트 (플랜 본문)

---

## 산출물 (Track A closeout)

1. 본 문서 + [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md) 동기화
2. [`docs/PRODUCT/ADR/ENGINE_GAP_ADR.md`](ADR/) — Track B E0 **`[x]` Accepted** 2026-07-11
3. Phase R ADR — component ownership · token SOT · route cardinality
4. `apps/web/src/product/bridge/` — surface별 bridge 타입

---

## 현재 큐 (2026-07-04)

| id                                            | 상태                  | 내용                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine-p0-*`                                 | `[x] DONE`            | Apex CLOSED · migration 신규 금지                                                                                                                                                                                                                                          |
| `p1-active-work-ssot-sync`                    | `[x] DONE`            | 본 v1 + ACTIVE_WORK_SSOT pointer sync                                                                                                                                                                                                                                      |
| `p1-foundation-tokens`                        | `[x] DONE`            | `product/tokens` · §25.1 폰트 3서체 · 2026-07-04 · `typecheck`                                                                                                                                                                                                             |
| `p1-foundation-primitives`                    | `[x] DONE`            | `product/primitives` · §25.2 CVA · §25.3 motion · 2026-07-04 · `typecheck` · vitest                                                                                                                                                                                        |
| `p1-foundation-router`                        | `[x] DONE`            | TanStack Router shell glue · 2026-07-04 · `typecheck`                                                                                                                                                                                                                      |
| `p1-foundation-redirects`                     | `[x] DONE`            | §12.17 redirect registry · 2026-07-04 · vitest                                                                                                                                                                                                                             |
| `p1-foundation-brand`                         | `[x] DONE`            | §25.9 brand pipeline · 2026-07-04 · `generate:brand`                                                                                                                                                                                                                       |
| `p1-foundation-pwa`                           | `[x] DONE`            | §25.10 manifest 완전체 · 2026-07-04 · `check:pwa`                                                                                                                                                                                                                          |
| `p1-foundation-i18n`                          | `[x] DONE`            | `product/i18n` I18nShell · shell chrome i18n · 2026-07-04 · `check:i18n` · vitest 2/2                                                                                                                                                                                      |
| `p1-foundation-responsive`                    | `[x] DONE`            | 4-tier viewport contract 390/768/1024/2560+ · 2026-07-04 · `gate:ai-impl` vitest 5/5                                                                                                                                                                                       |
| `p1-foundation-ux-grammar`                    | `[x] DONE`            | UNIFIED_UX_CANON primitives · HowItWorks · HelpTip · ToastZone mount · 2026-07-04 · vitest 8/8 · `check:i18n`                                                                                                                                                              |
| `p1-gate-foundation`                          | `[x] DONE`            | Part GATE — `typecheck` · `check:i18n` · `check:pwa` · `check:release` · `gate:ai-impl` vitest 34/34 · §3.0 4-tier smoke · 2026-07-04                                                                                                                                      |
| `p2-gate-admin`                               | `[x] DONE`            | P2 Admin Part GATE — 17 desks · §29.1–29.4 · 2026-07-04                                                                                                                                                                                                                    |
| `p2-admin-table-primitive`                    | `[x] DONE`            | §29.6 AdminTable · `@tanstack/react-table` · 18 desk migration · vitest 46/46 · 2026-07-11                                                                                                                                                                                 |
| `p2-gate-admin-table-dedup`                   | `[x] DONE`            | §29.6 dedup GATE · native `<table>` desk 0 · LoadingTable 0 · `admin-table-dedup-display-contract` · `gate:ai-impl` **8/8** · 2026-07-11                                                                                                                                   |
| `p2-closeout-*`                               | `[x] DONE`            | AdminNav · sports resume RPC · router navigate · user tier · doc sync · L5 migration gate · `gate:ai-impl` 40/40                                                                                                                                                           |
| `p2-closeout-migration-gate`                  | `[x] DONE`            | `test:sql` 99/99 · `stack:push-remote` · advisor 0 · 2026-07-04                                                                                                                                                                                                            |
| `p3-page-login`                               | `[x] DONE`            | `/login` password·passkey·magic · `pf.hasAccount` · `gate:ai-impl` vitest 7/7 · 2026-07-04                                                                                                                                                                                 |
| `p3-page-admin-login`                         | `[x] DONE`            | apps/admin `/login` password · profiles role gate · AuthProvider·signOut redirect · `gate:ai-impl` vitest 8/8 · 2026-07-04                                                                                                                                                 |
| `p3-page-admin-mfa-enroll`                    | `[x] DONE`            | apps/admin `/mfa/enroll` TOTP QR · AAL2 enroll · AuthShell · `gate:ai-impl` vitest 12/12 · 2026-07-04                                                                                                                                                                      |
| `p3-page-admin-mfa-challenge`                 | `[x] DONE`            | apps/admin `/mfa/challenge` TOTP step-up · AAL2 verify · login/enroll handoff · `gate:ai-impl` vitest 15/15 · 2026-07-04                                                                                                                                                   |
| `p3-page-admin-mfa-policy`                    | `[x] DONE`            | apps/admin `/mfa/policy` team MFA tier desk · `rpc_admin_set_mfa_policy` R3 · `gate:ai-impl` vitest 2/2 · 2026-07-04                                                                                                                                                       |
| `p3-gate-admin-auth`                          | `[x] DONE`            | Admin auth funnel gate — login→enroll→challenge→policy wire · profiles role gate · `admin-forbidden` · `useAdminRouteGate` · `gate:ai-impl` vitest 50/50 · E2E `tests/e2e/admin.spec.ts` advisory · 2026-07-04                                                             |
| `p3-page-signup`                              | `[x] DONE`            | `/signup` · `/r/$code`→`referral_code` · `rpc_register_referral` post-auth silent wire · `gate:ai-impl` vitest 5/5 · controller 4/4 · 2026-07-04                                                                                                                           |
| `p3-page-reset-password`                      | `[x] DONE`            | `/reset-password` · request link · recovery update · Supabase `resetPasswordForEmail`/`updateUser` · `gate:ai-impl` vitest 9/9 · 2026-07-04                                                                                                                                |
| `p3-page-auth-callback`                       | `[x] DONE`            | `/auth/callback` · OAuth/magic callback · `gate:ai-impl` · 2026-07-04                                                                                                                                                                                                      |
| `p3-page-verify-email`                        | `[x] DONE`            | `/verify-email` · resend signup confirmation · `gate:ai-impl` · 2026-07-04                                                                                                                                                                                                 |
| `p3-page-legal-terms`                         | `[x] DONE`            | `/legal/terms` · i18n `legal.terms.*` · `/terms` redirect · `gate:ai-impl` vitest 3/3 · contract 4/4 · 2026-07-04                                                                                                                                                          |
| `p3-page-legal-privacy`                       | `[x] DONE`            | `/legal/privacy` · i18n `legal.privacy.*` · `/privacy` redirect · s11 픽셀 고지 · `gate:ai-impl` vitest 3/3 · contract 6/6 · 2026-07-04                                                                                                                                    |
| `p3-page-legal-rg`                            | `[x] DONE`            | `/legal/responsible-gaming` · i18n `legal.rg.*` · `/responsible-gaming` redirect · `gate:ai-impl` vitest 3/3 · contract 8/8 · 2026-07-04                                                                                                                                   |
| `p3-page-legal-risk`                          | `[x] DONE`            | `/legal/risk-disclosure` · i18n `legal.risk.*` · `/risk-disclosure` redirect · `gate:ai-impl` vitest 3/3 · contract 10/10 · 2026-07-04                                                                                                                                     |
| `p3-page-landing`                             | `[x] DONE`            | `/` §28 campaign landing · ambient ticker · returning-user guard · legal footer · `gate:ai-impl` vitest 14/14 · `check:i18n` · 2026-07-04                                                                                                                                  |
| `p3-ads-attribution`                          | `[x] DONE`            | §28.5 TikTok/Meta/Google lazy pixels · consent Sheet · CSP `_headers` · signup conversion · vitest 19/19 · 2026-07-04                                                                                                                                                      |
| `p3-gate-auth`                                | `[x] DONE`            | P3 Part GATE — login+signup+admin-auth · legal · landing · §28.6 심사 체크 · `gate:ai-impl` web **87/87** · admin **90/90** · `check:i18n` · `check:release` · `check:ai-reference` · 2026-07-04                                                                           |
| `p4-preflight-design-sot-*`                   | `[x] DONE`            | P4 design SOT preflight bundle · `gate:ai-impl` 179/179 · 2026-07-04                                                                                                                                                                                                       |
| `p4-page-wallet` … `p4-page-rewards-history`  | `[x] DONE`            | P4 Money 10 surfaces · canonical `/wallet/*` · `/ledger` · `/rewards/history` · 2026-07-04                                                                                                                                                                                 |
| `p4-gate-money`                               | `[x]` impl partial    | P4 Part GATE — §31.3 deposit no-limit + withdraw tier limits · `wallet-money-policy-display` · `gate:ai-impl` wallet **57/57** · `tests/e2e/wallet-d3.spec.ts` 6 spec operator/CI Σ=0 (G13) · 2026-07-04                                                                   |
| `p4-operator-visual-signoff`                  | `[x]` agent impl      | **agent impl** · §20.12 · §22.2 Wallet · §25.12.6 · `/wallet/*` · `/ledger` · `/rewards/history` · preview https://preview.phonara-web.pages.dev · 390/768/1024 · axe critical 0 · dead control 0 · vitest **19/19** · **operator `VISUAL APPROVED` 대기** · 2026-07-11 |
| `p5-page-settings-security`                   | `[x] DONE`            | `/settings/security` · passkey + TOTP · `user-auth-security` · `/setup-2fa` redirect · `gate:ai-impl` vitest **14/14** · 2026-07-05                                                                                                                                        |
| `p5-page-settings-bank-accounts`              | `[x] DONE`            | `/settings/bank-accounts` · `withdrawal_address_whitelist` BANK chain · `rpc_list/add/remove_withdrawal_address` · `gate:ai-impl` vitest **17/17** · 2026-07-05                                                                                                            |
| `p5-page-account-kyc`                         | `[x] DONE`            | `/account/kyc` · compliance + KYC submit · `gate:ai-impl` vitest **4/4** · 2026-07-05                                                                                                                                                                                      |
| `p5-page-account-responsible-gaming`          | `[x] DONE`            | `/account/responsible-gaming` · RG limits read · `rpc_set_rg_limit` · `rpc_set_self_exclusion` · `gate:ai-impl` vitest **4/4** · 2026-07-05                                                                                                                                |
| `p5-gate-security`                            | `[x] DONE`            | P5 Part GATE — security 4 surfaces wire · `/setup-2fa`→`/settings/security` · `gate:ai-impl` security **57/57** · `check:i18n` · `check:release` · `check:ai-reference` · 2026-07-05 → **P6**                                                                              |
| `p3-refresh-auth-landing-design-sot`          | `[x]` DONE            | §25.12.4–5 · HeroMockup→`BrandMark` hero-3d · semantic tokens · `gate:ai-impl` landing **9/9** · login **5/5** · signup **5/5** · reset-password **6/6** · 2026-07-05                                                                                                      |
| `p3-refresh-auth-landing-appshell`            | `[x]` DONE            | §22.2 Landing+Auth · marketing shell · `gate:ai-impl` · 2026-07-05                                                                                                                                                                                                         |
| `p3-platform-narrative-i18n`                  | `[x]` DONE            | §3.5 platform narrative i18n ko+en · 2026-07-05                                                                                                                                                                                                                            |
| `p3-operator-visual-signoff`                  | `[x]` VISUAL APPROVED | **VISUAL APPROVED** · §20.12 · preview https://preview.phonara-web.pages.dev · axe 0 · dead control 0 · vitest **46/46** · 2026-07-05                                                                                                                                      |
| `p6-operator-visual-signoff`                  | `[x]` VISUAL APPROVED | **VISUAL APPROVED** · §20.12 · §12.19.5 AppShell · 5탭 IA · preview https://preview.phonara-web.pages.dev · axe 0 · dead control 0 · vitest **33/33** · `check:ui-architecture` green · 2026-07-05                                                                         |
| `p6-doc-platform-canon-sync`                  | `[x] DONE`            | §32 SSOT 3종 · display contracts · ENGINE_GAP_ADR index · i18n `onboarding.journey.*` · `gate:ai-impl` domain **10/10** · `check:ai-reference` · 2026-07-05                                                                                                                |
| `p6-shell-appshell` … `p6-gate-shell`         | `[x]` DONE            | P6 Shell impl — AppShell · install · onboarding · offline · `/home` stub · `gate:ai-impl` shell · `check:ui-architecture` · 2026-07-05                                                                                                                                     |
| `p7-page-referral` … `p7-page-share-earnings` | `[x]` impl partial    | P7 Growth 10 surfaces — canonical routes · manifest sync · ENGINE:partial where noted · 2026-07-05                                                                                                                                                                         |
| `p7-gate-growth`                              | `[x]` DONE            | P7 Part GATE — §12.19.6 earnSubnav dead link 0 · §13.5.5 reward_phon parity · §3.4.3 onboarding duplicate claim 0 · `gate:ai-impl` **82/82** · `check:ui-architecture` green · 2026-07-05 → **P8**                                                                         |
| `p8-page-home` … `p8-page-settings-api-keys`  | `[x]` impl partial    | P8 Core 10 surfaces — `/home` · `/notifications` · `/settings` hub+children · `/account` · `/account/profile` · ENGINE:gap api-keys STUB · 2026-07-05                                                                                                                      |
| `p8-gate-core`                                | `[x]` DONE            | P8 Part GATE — §12.19.6 P8 manifest 11 routes · §3.4.2 notification glue · `gate:ai-impl` **145/145** · `check:ui-architecture` green · 2026-07-05                                                                                                                         |
| `p8-operator-visual-signoff`                  | `[x]` VISUAL APPROVED | **VISUAL APPROVED** · §20.12 · §22.2 Earn+Home · `/home` · `/notifications` · `/settings/*` · `/account` · preview https://preview.phonara-web.pages.dev · 390/768/1024 · axe critical 0 · dead control 0 · vitest **24/24** · `check:design-tokens` advisory · 2026-07-05 |

| `p9-gate-trade` | `[x]` DONE | P9 Base Part GATE — §12.19.6 trade+staking manifest 5 routes · tradeSubnav dead link 0 · §3.4 `productToast` strict · §32.5 first-trade education · `gate:ai-impl` trade+staking bundle · 2026-07-05 → **P9 WORLD** |
| `p9-world-preflight` | `[x]` DONE | P9 WORLD preflight — margin-position-mode · trade-order-states contract sync · 2026-07-05 |
| `p9-trade-parity-matrix-sync` | `[x]` impl partial | §22.2.1·§22.2.3·§32.7 · §13.1.1 dual currency · §13.1.2 platform settlement · `trade-exchange-parity-display-contract` · vitest **21/21** · 2026-07-05 |
| `p9-trade-spot-pair-wire` | `[x]` impl partial | §13.1.1 spot stake per pair · `spot-stake-display-contract` · `use-spot-desk-wire` · header pair Select · vitest **10/10** · 2026-07-05 |
| `p9-trade-audit-remediation-a1` | `[x]` DONE | 2026-07-06 | spot whitelist filter+cancel · `cancel-spot-open-order` · §12.19 isolation · `trade_audit_a1_a2_fix` plan |
| `p9-trade-audit-remediation-a2` | `[x]` DONE | 2026-07-06 | `useTradeDeskViewport` · chart single mount · A2 desk tests · `trade_audit_a1_a2_fix` plan |
| `p11-earn-side-surfaces` | `[x]` DONE | 2026-07-11 | `/events` · `/earn/play` · `/earn/cashback` · `/referral/leaderboard` STUB · `gate:ai-impl` **45/45** |
| `p11-page-wallet-redeem` | `[x]` DONE | 2026-07-11 | `/wallet/redeem` · Payment Method Card · withdraw/deposit rails · `gate:ai-impl` **21/21** |
| `p11-gate-side-income` | `[x]` DONE | 2026-07-11 | §12.19.6 Side GATE · dead link 0 · `p11-gate-side-income-display-contract` · `gate:ai-impl` **39/39** |
| `p12-trust-marketing-hub` | `[x]` DONE | 2026-07-11 | `/tier` · `/features*` · `/fees` · `/security` · trust narrative · `gate:ai-impl` **36/36** |
| `p12-community-support-hub` | `[x]` DONE | 2026-07-11 | `/announcements` · `/status` STUB · `/support*` · `/feedback` · `gate:ai-impl` **40/40** |
| `p12-legal-pages` | `[x]` DONE | 2026-07-11 | `/legal/affiliate` · `/legal/cookies` · redirects · `gate:ai-impl` **40/40** |
| `p12-gate-marketing` | `[x]` DONE | 2026-07-11 | §32.5 FAQ·feedback·affiliate·cookies + marketing · footer/redirect/education · `gate:ai-impl` **59/59** |
| `da-w8-signature-surfaces-bundle` | `[x]` DONE | 2026-07-11 | §34.21–34.26 home·wallet·trade·casino·sports·vip · `gate:ai-impl` **36/36** |
| `da-w8-sound-design-spec-defer` | `[x]` DONE | 2026-07-11 | §34.27 mission·wallet·trade·vip 4톤 DOC · `SOUND_DESIGN_CANON` · `gate:ai-impl` **5/5** · 구현=E-Wave |
| `da-w8-gate-signature-experience` | `[x]` DONE | 2026-07-11 | §34.2 Emotion Map spot-check · da-w8 bundle · VISUAL: da-w8-signature advisory · `gate:ai-impl` **49/49** |
| `p13-prep-admin-canonical-docs` | `[x]` DONE | 2026-07-11 | §29.1·§29.5 · ADMIN_BEGINNER_LANGUAGE_CANON · correspondence · RBAC · §12.14 · `gate:ai-impl` **12/12** |
| `p13-prep-admin-team-desk` | `[x]` DONE | 2026-07-11 | `/admin/team` · AdminTable · owner-only nav · settings link · `rpc_admin_set_role_grant` · `gate:ai-impl` **22/22** |

**현재 NEXT:** **`ew-e1-decay-wave`** (#240) · E0 `#239` **`[x]` DONE** · T2 scale `#238` **`[x]` DONE** · T1 ramp `#237` **`[x]` DONE** · P13 closeout `#236` **`[x]` DONE** · DA W7 VISUAL `#235` agent impl **`[x]`** · W7 strict `#234` **`[x]`** · Soft Launch `#233` **`[x]`** · T0-A `#232` **`[x]`** · ops Web Push `#231` **`[x]`** · team desk `#230` **`[x]`** · Admin canonical docs `#229` **`[x]`** · W8 GATE `#228` **`[x]`** · W8 sound DOC `#227` **`[x]`** · W8 signature `#226` **`[x]`** · P12 GATE `#225` **`[x]`** · P12 legal pages `#224` **`[x]`** · P12 community hub `#223` **`[x]`** · P12 trust hub `#222` **`[x]`** · P11 GATE `#221` **`[x]`** · P11 wallet redeem `#220` **`[x]`** · P11 Earn side `#219` **`[x]`** · P4 VISUAL `#218` agent impl **`[x]`** · W6 GATE `#217` **`[x]`** · W6 BUNDLE `#216` **`[x]`** · P10 VISUAL `#215` agent impl **`[x]`** · P10 GATE `#214` **`[x]`** · first-bet education `#213` **`[x]`** · Fairness `#212` **`[x]`** · Batch D `#211` **`[x]`** · Batch C `#210` **`[x]`** · Batch B `#209` **`[x]`** · Batch A `#208` **`[x]`** · AdminTable GATE `#207` **`[x]`** · AdminTable `#206` **`[x]`** · Fiat#11 `#205` **`[x]`** · CasinoR#1 `#204` **`[x]`** · Casino lobby `#203` **`[x]`** · Sports#4 `#202` **`[x]`** · Sports#3 `#200` **`[x]`** · Sports#2 `#199` **`[x]`** · Sports#1 `#198` **`[x]`** · Sports#0 `#197` **`[x]`** · Fiat#10 `#196` **`[x]`** · DA W5 GATE `#195` **`[x]`** · DA W5 `#194` **`[x]`** · DA W4 GATE `#193` **`[x]`** · DA W4 `#192` **`[x]`** · DA W3 GATE `#191` **`[x]`** · DA W3 `#190` **`[x]`** / DA W2 GATE `#189` / DA W2 `#188` / DA W1 GATE `#187` / DA W1 `#186` / DA W0 `#185` / R0 `#180–184` / PQA / Fiat / `p10-page-sports` **`[x]`** · READ: [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md)

**Phase R money/trade 정본 (Plan §13.1):**

| §       | 내용                                                                                   | 코드 정본                                                                                                                |
| ------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| §13.1.1 | USDT·PHON dual settlement — Trade · Sports · Casino · Staking                          | `TRADE_DUAL_CURRENCY_MATRIX`                                                                                             |
| §13.1.2 | 플랫폼 독립 정산 · 거래소급 UX — chart/WS display-only · house fill · no external CLOB | `TRADE_PLATFORM_SETTLEMENT_MODEL` · `TRADE_REALTIME_MARKET_DATA_MATRIX` · `display-feed-contract.ts`                     |
| §13.1.3 | Trade·Staking 초등어 · 초보 가이드 — HowItWorks · HelpTip · subnav help                | `TRADE_BEGINNER_LANGUAGE_CANON.md` · `trade-beginner-language-display-contract.ts` · `p9-trade-beginner-help-layer`      |
| §13.1.4 | Fiat Reference Money Stack — display-only hint · 3-tier rate · Fiat#1–12               | `fiat-reference-display-contract.ts` · §20.13.2 · **`p4-gate-fiat-reference-world-class` `[x]`** (Fiat#9G · P10 unblock) |

**YAML todo 정본:** Cursor Plan `phase_r_super-app_8bdf2c10` frontmatter — repo에 복사하지 않음. **수치:** §20.6.1 (**280 ids**) · **P9 step:** §25.12.9.1-D + §25.12.9.2 remediation · **Fiat:** §20.13.2 · **실행 #N:** §20.13 · drift: §20.6.2 · **§29.5:** Admin 초등어 · **§32.5–32.6:** trust + Admin operator completeness

## 참고 (읽지 말 것)

- Engine evidence reports — 감사 이력만 ([`DEPRECATED_DOC_DENYLIST.md`](../SSOT/DEPRECATED_DOC_DENYLIST.md))
- v2 deleted SSOT (`UI_REBUILD_WAVE` · `MASTER_TODO` · …) — Batch 11 `git rm`
- [`REBUILD_PLAN_TBD.md`](REBUILD_PLAN_TBD.md) — superseded stub
