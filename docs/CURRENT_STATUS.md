# PHONARA Launch Status

> Derived dashboard only. The source of truth remains
> [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md), especially the Build
> Log. **압살 North Star:** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md). Update this file from the master plan; do not use it to override product,
> security, money, or launch decisions.

## Last Verified Green Gates

### Cursor C-track (2026-06-21 · current)

- **C-1 L2 E2E:** `bun run test:e2e` → **58/58 skip 0** · F1 dice confirm (`6840d0e`) · F2 plinko · F3 `/terms` visual smoke (`7646133`).
- **C-2 check:full 하위 gate (개별 green · 통합 1-shot defer):** standard check vitest **931** · `supabase db reset` **133** migrations · functions-mirror **309** · guard-coverage **118** rpc **0 gaps** · `test:sql` **66/66** · casino-sql-parity · E2E **60/60** · closeout fixes `e800bd5` (migration lock LF · lint · deepshaft LAW1).
- **Trade/security 토대 (C-2 세션):** launch funding/cross gates · futures UI/launch gate 정합 · migrations 138–140 freeze · guard-coverage CI (`96c435a` `6f26219` `3d0d509` `82f625b`).

### Historical (2026-06-12 and earlier)

- Full local RC gate (2026-06-12): `bun run check:full` → standard check, PWA, fresh DB reset, SQL 37/37, casino SQL parity, and browser E2E 41/41 passed.
- Remote migration apply: locked Supabase project `yocjhjsdwoijfdrehzoq` is aligned through **`20260615000098`** (casino 088–096, crypto 097, viral 098).
- Remote advisor/lint: `supabase db lint --linked --level error` green; MCP security/performance advisors show 0 ERROR.
- RC read-only production smoke: remote flags safe, web/admin login surfaces and PWA/offline assets boot with the remote publishable key.
- Launch-ops read-only check: cron jobs active; open ops alerts, pending queues, pending withdrawals, active risk flags, and open STR cases are all 0.
- Release cleanliness: `bun run check:release` green after the latest launch-plan and runbook updates.
- Focused wallet/admin E2E: `phase5-wave9.spec.ts` + `admin.spec.ts` → 15/15 passed after the KRW deposit confirmation closeout.
- Focused i18n/admin/casino UI E2E: `admin.spec.ts` + `casino.spec.ts` + `visual.spec.ts` → 16/16 passed after local Auth restart.

## Launch Plan Position

> **최종 목표 (Stake/Rollbit/Binance/Bybit/국내 앱테크):** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md)

Completed launch-plan closeout items:

- Backend invariant closeout.
- RLS/RPC grant closeout.
- Money-flow matrix closeout.
- Product UX hook pipeline.
- Casino hook pipeline.
- Wallet/Admin UX confirmation closeout.
- i18n UI closeout.
- E2E matrix.
- E2E green.
- Ops runbook.
- Current status doc.
- Incident drill.
- Release candidate readiness.

Current slice:

- **Cursor 전담 (2026-06-19):** Lovable canvas **종료** — 모든 UI/wiring/E2E는 PHONARA repo.
- **C-0 Wiring:** ✅ i18n/typecheck/vitest green · Earn 광고시청·설문 미션 **제거**.
- **C-1 L2 E2E:** ✅ **58/58 skip 0** · F1 dice · F2 plinko · F3 `/terms` · evidence `6840d0e` `7646133`.
- **C-2:** ✅ **개별 gate green** (vitest 931 · migrations 133 · mirror 309 · guard 118/0 gaps · sql 66/66 · E2E 60/60) · **통합 `check:full` 1-shot defer** (저사양) · closeout `e800bd5`.
- **ACTIVE HEAD C-3:** L1-20 K1 황금 지구 + L1-21 K3 생존 신고 — L1-20 **EXECUTE §GREEN** · L1-21 LOCK next.
- **Earn 제품 정책:** 광고 시청·설문조사 리워드 **금지** (앱테크 대체: 출석·미션·룰렛·추천·데일리 퀴즈).
- `rc-smoke`: read-only production smoke green; authenticated production flow smoke blocked until operator account exists.

Next slices:

- **C-3** L1-20/21 presentation — L1-20 **EXECUTE complete** · [`LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md) APPROVED D3=50.
- Launch operations loop.

## Operator Backlog (post-C-3)

> operator 약속 2026-06-21 · C-3 §GREEN 전 착수 **금지**.

- **Trade UI/UX 전면 재설계** (`/trade` · PC+모바일 최적화 · 장수 디자인).
- **시점:** C-3 (K1 황금 지구 + K3 생존 신고) §GREEN 후.
- **전제 완료:** 엔진·UI 정합·거래 안전 · funding/cross launch gates · guard-coverage (`96c435a`–`e800bd5`).

> **§9 정본 위치 (2026-06-21):** `docs/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md` active 경로 **없음**. 유일 사본: [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9. **active 복원 = operator 판단.** C-3 LOCK은 archive §9 근거로 작성 가능.

## Lovable Zenith UI (**CLOSED · 2026-06-19**)

> **operator:** Lovable 플랫폼 종료 — 이하 슬라이스는 **Cursor `apps/web` presentation**으로 이관.  
> **Lovable Zenith:** [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md) · handoff **v77** (archive)  
> **통합 백로그 (DONE/UPGRADE/NOT DONE):** [`PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md`](PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md)  
> **순차 실행 큐 head:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md)

| Item | Status (2026-06-15) |
|------|---------------------|
| Macro Phase 0–4 | ✅ **10/10 games** · P4 DONE · vitest **356/356** · Auto **6/6** |
| **§Phase 4.5** | **P1 CLOSE ✅** |
| **Phase 5 슬라이스** | **5-A–D + macro 4슬라이스 ✅** (tier · faq · footer-banner) |
| **Phase 5 macro** | **macro 슬라이스 완료** · Dashboard **후순위 defer** |
| **Phase 6** | **CLOSE ✅** (5슬라이스) |
| **Phase 7 · 7-earn-hub-i18n** | ✅ **§E v26 GREEN** (LOCK v1.2 · catalog **534→574**) |
| **Phase 7 · 7-earn-missions-route** | ✅ **§E v26-micro GREEN** (LOCK v0 · `/earn` + `/earn/missions` · catalog **574→578**) |
| **Phase 7 · 7-viral-referral-card-i18n** | ✅ **§E v27 GREEN** (LOCK v0 · catalog **578→587** · `referral.*` **16**) |
| **Phase 7 viral defer** | `7-viral-referral-route` · `7-viral-mission-expand` |
| **Phase 7 · 7-fomo-wheel-i18n** | ✅ **§E v28 GREEN** (LOCK v0 · catalog **577→584** keys · `fomo.*` **17**) |
| **Phase 7 · 7-fomo-streak-i18n** | ✅ **§E v29 GREEN** (LOCK v0 · catalog **584→585** keys · `fomo.*` **18**) |
| **Phase 7 · 7-fomo-leaderboard-i18n** | ✅ **§E v30 GREEN** (LOCK v0 FINAL · catalog **585→589** keys · `fomo.*` **22**) |
| **Phase 7 · 7-fomo-tier-i18n** | ✅ **§E v31 GREEN** (LOCK v0 FINAL · catalog **589→592** keys · `fomo.*` **25**) |
| **Phase 7 · mounted fomo** | ✅ **CLOSED** (wheel · streak · leaderboard · tier — 7 components) |
| **Phase 7 · 7-route-seo-head-i18n** | ✅ **§E v32 GREEN** (head() only · catalog **602→605**) |
| **Phase 7 · 7-phase7-closeout-i18n** | ✅ **§E v33 MEGA GREEN** (LOCK v0.1 · 14 files · mounted funnel 표면 **CLOSED**) |
| **Phase 7 · G6 catalog parity** | ✅ **RESOLVED** — reporting bug (line-count vs key-count) · **TRUE PARITY keys ko=en=678** · Phase 8 BLOCKER **cleared** |
| **Phase 7 · 7-phase7-defer-closeout** | ✅ **§E v34 MEGA GREEN** (LOCK v0.3 · 8 files · +110 keys · catalog **678→788**) |
| **Phase 7 defer body** | ✅ **CLOSED** (legal · account · settings · trade · games detail) |
| **Phase 7 defer (macro)** | viral UX/mission · **tier progression §E v35** |
| **Phase 8 · §P8-1** | ✅ **LOCK v0.1 FINAL · GREEN** (8 surfaces · catalog **788→862** · G1–G12+G+ · vitest **356/356**) |
| **Phase 8 · §P8-2** | ✅ **LOCK v0.1 · GREEN** (8 surfaces · catalog **862→935** · G1–G12+G+ · vitest **356/356**) |
| **Phase 8 · §P8-3** | ✅ **LOCK v0.1 · GREEN** (8 surfaces · catalog **935→949** · G1–G12+G+ · **24/32면**) |
| **Phase 8 · §P8-4** | ✅ **LOCK v0.1 · GREEN** (8 surfaces · catalog **949→982** · **Phase 8 32/32 COMPLETE**) |
| **Phase 8 macro** | ✅ **CLOSE** — 4 clusters P8-1~4 · Imported* **32/32** route pages |
| **Phase 9 · §P9 Admin** | ✅ **LOCK v0.1 · GREEN** (8 surfaces · catalog **982→1053** · `admin.*` +71 · `seo.admin*.*` +8 · admin ZIP **51 KB**) |
| **Phase 10 · FINAL** | ✅ **GREEN** (verify-only · catalog **1053/1053** · user ZIP **103 KB** · admin ZIP **51 KB** · G12 dry+real ✓) |
| **Phase 11-B · 표시 품질 sweep** | ✅ **GREEN** (LOCK v0.1 FINAL · route +0 · catalog **1053→1059** · `state.*` +6 · SEO·a11y·shell·PWA manifest 기초 · handoff **v61 baked**) |
| **Phase 11-C · PWA Supremacy** | ✅ **GREEN** (route +0 · `/install` head 갱신 · catalog **1059→1075** · `pwa.*` +16 · handoff **v65 baked**) |
| **Phase 12-E · Partner / 총판 Hub** | ✅ **GREEN** (E1 `/referral` + E2 `/partner` gated · catalog **1075→1099** · +24 `referral.partner.*` · sitemap **42** · JSON-LD **7→8** · ZIP user **104323 B** · admin **53109 B** · ReferralTree reuse · [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md)) |
| **Phase 12-B · Missions 6-Lane Full** | ✅ **GREEN** (EXECUTE v2.2 · 분기 A1 · catalog **1099→~1121** · [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md)) |
| **Phase 12-C · Home Hub scaffold** | ✅ **GREEN** (EXECUTE v0.2.2 FINAL · 1a·2a·3a · H1~H6 + Footer #19 · 9 신규 파일 · head Δ=0 · catalog **1121→1143** (Δ +22) · vitest **356/356** · sitemap **42** · JSON-LD **8** · FOMO/tier → **v0.3** · [`LOVABLE_ZENITH_PHASE12_C_LOCK.md`](LOVABLE_ZENITH_PHASE12_C_LOCK.md)) |
| **Phase 12-D · Trade Surface Pro** | ✅ **GREEN** (scaffold v0.2 + **v0.1.1 route split** · 8 components + Footer #20 · `/trade`=ImportedTradePage · `/trade/hub`=TradeHub · catalog **1143→1165** (Δ +22) · sitemap **43** · JSON-LD **8** · vitest **356/356** · FOMO/tier/depth → **v0.2 defer** · [`LOVABLE_ZENITH_PHASE12_D_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_LOCK.md)) |
| **Phase 12 · Product Depth** | 12-E/B/C/D ✅ · **끝판왕 12-F→12-A→12-G EXECUTE** ([`LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md`](LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md)) · target catalog **1229** · **12-Z paste 게이트** |
| **Lovable Zenith macro** | Phase 0–11-C ✅ · **12-E ✅** · **12-B ✅** · **12-C ✅** · **12-D ✅** · catalog **1165** · **ZIP = operator 「ZIP 발행」 명시 전까지 금지** ([`92-lovable-lock-execute.mdc`](../.cursor/rules/92-lovable-lock-execute.mdc) §ZIP 게이트) |
| **Phase 10 defer** | 13 carry files (`lib/useCountUp` · `lib/confetti` · `trade/*` 9 · `casino.hilo` · `casino.limbo`) — P8 NO-TOUCH · **post-paste E2E** |
| **casino-routing-hotfix** | ✅ GREEN · `casino.tsx` Outlet · `/casino/<game>` mount |
| **Paste map 메모** | Lovable `/risk` → **`/responsible-gaming`** (file+URL · SiteFooter · MorePage) |
| **품질 바** | SEO + Mission mandatory — North Star §**4.5** (Stake/Rollbit/Binance/Bybit) |
| Lovable i18n catalog | **1165** keys ko=en strict · G6 DIFF=0 · DUP=0 · `trade.*` +22 net · `scripts/i18n-parity.sh` |
| defer (Phase 6+) | scrim-soft · cva-base-dedup · toast-variants · tier §E v35 · viral UX |
| Lovable guards | shell ko=0 **10** · ui/ ko=0 **49** · ui `@/i18n` **2** |
| Backlog | 4.5-i18n · shortkey · e2e CI · Pixi 2.5 DEFER · Phase 10 i18n sync |
| e2e pending | 5 games WRITTEN → CI/local PASS · back smoke 3 spec |
| **§8-A rules i18n** | **✅ GREEN** · **§8-A-bis v3 ✅** (Lovable ko/en **134키** · mint/gold `?` wired) |
| **PHONARA paste + Crush v4** | ⏳ 12-Z + operator paste GO — [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) |
| **P2-Games Controls (Lovable canvas)** | ✅ **10/10 §GREEN** (2026-06-16) · [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md) |
| **§A Theme 12-H v0.1 (Lovable canvas)** | ✅ **§GREEN** · styles.css hex 0 · oklch SOT · checkpoint `theme-h/` |
| **§Y FOMO · §B Bento · 12-A · 12-G (canvas)** | ✅ 감사 §GREEN (12-G leaf 전수 별건) · INDEX §3 |
| **preview blackjack test fix** | ✅ **§GREEN** (2026-06-16) · vitest 82/2 files · 384/4 tests |
| **12-Z PRODUCT FINAL** | **다음** · verify-only plan--create |
| **Lovable canvas catalog (실측)** | **1454/1454** ko=en · (`1165` 행 = 구 Phase 12-E 시점 · **canvas는 1454가 정본**) |

### Operator 워크플로 (2026-06-16 · canvas 감사 반영)

> **ZIP 발행:** operator가 **Lovable 전체 100% 완료**로 판단 + **「ZIP 발행 GO」** 명시 시 1회. P2-Games 10/10만으로 ZIP GO **아님**.  
> **PHONARA paste:** ZIP 수령 후 operator **「PHONARA paste GO Wave-1」** 1회.  
> **Lovable 진행판 정본:** [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md) · [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md)

| 순서 | Lovable | PHONARA |
|------|---------|---------|
| 1–8 | ~~Phase 0–10~~ · **11-B** ✅ | handoff v60–**v61** |
| 9 | **Phase 11-C** ✅ GREEN (PWA Supremacy) | handoff **v65 baked** (11-C GREEN · paste adapter memo) |
| 10 | **12-E** Partner / **총판 Hub** ✅ GREEN | handoff **v67 baked** |
| 11 | **12-B** Missions 6-Lane Full ✅ GREEN | handoff **v69 baked** |
| 12 | **12-C** Home Hub scaffold ✅ GREEN | handoff **v71 baked** |
| 13 | **12-D** Trade Surface Pro ✅ GREEN (v0.1.1 route split) | handoff **v73 baked** |
| 14 | **12-H §A + 12-F.2 §B** | ✅ canvas §GREEN (2026-06-16) |
| 15 | **12-Z** PRODUCT FINAL verify-only | ✅ **§GREEN** (2026-06-16) · SEO 54 routes · vitest baseline |
| 16 | **12-A v0.2** TournamentStrip · RecentlyPlayed | ✅ **§GREEN** (2026-06-16) · catalog **1459** |
| 17 | **12-C v0.3** FOMO/tier | ✅ **§GREEN** (2026-06-16) · catalog **1470** |
| 18 | **12-D v0.2** Trade depth | **HEAD** · LOCK DRAFT |
| 17 | — | **PHONARA ZIP paste** 1회 (operator GO 후) |

**ZIP (historical · Phase 12-E):** `dist-phonara-package.zip` **104323 B** · admin **53109 B** — **신규 ZIP는 operator 「ZIP 발행」 전까지 발행하지 않음**

### Paste adapter memo (PHONARA paste 슬라이스 · **12-Z FINAL** 후)

| Lovable (ZIP) | PHONARA paste 시 |
|---------------|------------------|
| `public/og/*.jpg` 상대 경로 (`/og/root.jpg` 등) | head `og:image` · `twitter:image` **절대 URL** 치환 (`VITE_APP_ORIGIN` 또는 prod origin) |
| `public/icon-192.png` | `pwa-192x192.png` |
| `public/icon-512.png` | `pwa-512x512.png` |
| `public/icon-maskable-512.png` | `pwa-512x512.png` + manifest `purpose: maskable` |
| `public/apple-touch-icon.png` | `apple-touch-icon.png` (또는 `pwa-192x192.png` link) |
| `public/sitemap.xml` `BASE_URL=""` TODO | prod origin 주입 |
| JSON-LD · canonical · og:url 상대 경로 | paste 시 origin prefix (og:image/twitter:image 우선) |
| `shell/EmptyState` · `shell/LoadingShell` | `apps/web/src/components/shell/` 흡수 · carry wiring은 paste 후 별도 슬라이스 |
| `state.empty.*` · `state.loading.*` (+6) | `@phonara/i18n` merge |
| `pwa.*` (+16) | `@phonara/i18n` merge · flat `pwa.install.{title,description,action,dismiss}` vs Lovable `why.*`/`cta.*` **병존** |
| LS `pwa.install.dismissed=1` | `phonara.pwa.installDismissed` 통일 |
| `public/offline.html` (영문 fallback) | `@phonara/i18n` copy 치환 |
| `InstallPromptProvider` · `PwaInstallBanner` | **`PwaShell` ↔ merge 결정** (paste slice) · `__root` Provider wrap 흡수 · SW → PHONARA `sw.ts` |
| manifest shortcuts×4 · screenshots×4 | PHONARA manifest merge · start_url/scope/display **불변** |
| `/install` JSON-LD (WebApplication + BreadcrumbList) | head 흡수 · og 절대 URL swap |
| **12-E** `referral.partner.*` · E1/E2 `/referral`+`/partner` | `@phonara/i18n` merge · affiliate RPC wire · `affiliate_settlements.state` enum map · downline slice 12-Z 후 |
| **12-B** `mission.lane.subtitle.*` · `mission.footer.*` · C~F rows | `@phonara/i18n` merge · paste slice 12-Z 후 |
| **12-C** `home.hub.hero.*` · `home.section.*` · `home.footer.*` · `components/home/*` | `@phonara/i18n` merge · `HomeHub` route paste · 12-Z 후 |
| **12-D** `trade.hub.*` · `trade.section.*` · `trade.footer.*` · `components/trade/*` · `/trade/hub` | `@phonara/i18n` merge · `/trade` ImportedTradePage 유지 · TradeHub paste · 12-Z 후 |

## Current Evidence Map

- E2E ownership and coverage: [`QUALITY_GATES.md`](QUALITY_GATES.md#current-e2e-matrix).
- Operator incident flow: [`RUNBOOK.md`](RUNBOOK.md).
- Observability and secret policy: [`OBSERVABILITY_PRIVACY.md`](OBSERVABILITY_PRIVACY.md).
- Supabase access/RLS inventory notes: [`SUPABASE_ACCESS_MATRIX.md`](SUPABASE_ACCESS_MATRIX.md).

## World Crush Platform UI (L1-16~18 · C-3 scope · 2026-06-21)

> **정본:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) — active `docs/` **없음** · [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9 · sequential §3.1.4

| 슬라이스 | scope | 상태 |
|---------|--------|------|
| **L1-16** | Home tab IA · G-WC1 | **✅ §GREEN** · 529/533 · 2552 |
| **L1-17** | Trade Spot \| Futures \| Staking · G-WC2 | **✅ §GREEN** |
| **L1-18** | FOMO motion V2 · G-WC3 | **✅ §GREEN** |
| **L1-20** | K1 · 황금 지구 | **✅ §GREEN** · APPROVED D3=50 · [`LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md) |
| **L1-21** | K3 · 생존 신고 | **C-3 · operator 확정** |

**ZIP 게이트:** defer · operator 「ZIP 발행 GO」 명시 전 0.

**Post-C-3 backlog:** `/trade` UI/UX 전면 재설계 (operator 약속 · 엔진 토대 완료).

## Known Launch Notes

- Remote migration history is aligned through **`20260615000098`** (`yocjhjsdwoijfdrehzoq`). Includes casino 088–096, crypto rails 097, viral missions 098.
- `database.types.ts` regen from linked DB: **`game_code` 10 values**; `crypto_*` tables + `viral_mission_code` enum present.
- Local SQL integration: **`bun run test:sql` → 41/41** after ENGINE 100 migrations (crypto deposit Σ=0, viral conservation).
- Remote `db lint --linked --level error` and `check:advisors` → **0 ERROR** (2026-06-14).
- Production **`rpc_run_reconciliation()`** executed once via linked query → all 5 check families **`is_match=true`**, `system_readonly` not set.
- Local `check:advisors` still skips without `SUPABASE_ACCESS_TOKEN`, but MCP advisor checks currently show 0 ERROR.
- `db diff --linked` default-direction output includes reverse drift/noise (`pg_net`); the desired `linked -> local` diff produced no SQL, and the generated reverse migration attempt was rejected by local SQL gates and deleted.
- Production **`auth.users=2`** (2026-06-14 verify): one `profiles.role=admin`, one `profiles.role=user`. Authenticated prod smoke remains **no-mutation** until operator confirms MFA + checklist in `setup/MANUAL_TASKS.md`.
- Affiliate browser E2E and explicit locale-toggle E2E are not separate browser specs yet because the corresponding shipped user/admin UX is not exposed as a dedicated route. Current coverage is SQL/admin-pattern/check based and is documented in the E2E matrix.
- If local Playwright global setup fails with `createUser failed: {}`, check `http://127.0.0.1:54444/auth/v1/health`. In the latest run this was a local Auth upstream issue and recovered with `supabase stop && supabase start`.
- **Local manual signup/login**: `.env.local` must use `VITE_SUPABASE_URL=http://127.0.0.1:54444` and the publishable key from `supabase status`. Local `config.toml` disables email confirmation so signup goes straight to the dashboard. After `supabase db reset`, clear browser Local Storage (`sb-*` keys) once — stale refresh tokens otherwise spam `/auth/v1/token` with 400. Inbucket catches auth emails at http://127.0.0.1:54424 when testing magic links.
- **Performance backlog (not a code defect)**: Under full-gate load (`check:full`, ~20 prior E2E specs), `rpc_spot_market_buy` was observed exceeding 45s once while isolated `core-flow` runs completed in ~7s. `useSpotActions` busy/ref teardown is correct; E2E now polls `spot_trades` for RPC completion. **ENGINE 100 scope:** oracle-perp excellence + documented p95 SLO is sufficient; **full Binance-grade CLOB is a separate multi-month program**, not a launch blocker for current architecture (display order book, not matching engine).

## Spot RPC latency (isolated · local · 2026-06-14)

Measured via `scripts/measure-spot-rpc-p95.ts` against local stack (`http://127.0.0.1:54444`), **N=40**, spot rate limits temporarily disabled for probe only (`rate_limits_disabled_for_probe: true`).

| RPC | p50 | p95 | p99 | min | max |
|-----|-----|-----|-----|-----|-----|
| `rpc_spot_market_buy` | **349 ms** | **1847 ms** | **2221 ms** | 18 ms | 2221 ms |
| `rpc_spot_market_sell` | **404 ms** | **2776 ms** | **3110 ms** | 27 ms | 3110 ms |

**SLO note:** Isolated p95 under 3s for spot buy/sell on local Docker; production p95 should be re-measured after operator account exists. Full-gate contention can push tail latency higher (see backlog above).
