#!/usr/bin/env node
/**
 * repair-plan-encoding.ts — Cursor Plan UTF-8 한글 손상 복구
 * Usage: bun run scripts/repair-plan-encoding.ts [--dry-run]
 */

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, type PlanTodo } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);
const BACKUP_BODY_FALLBACK =
  'C:/Users/PC/.cursor/projects/c-Users-PC-Desktop-phonara-gb/uploads/c__Users_PC_.cursor_plans_phase_r_super-app_8bdf2c10.plan-L1-L6391-0.md';

/** merge-50/51/52 + P0/P1 canonical todo content */
const CANONICAL_TODO_CONTENT: Record<string, string> = {
  'engine-p0-apex-closed':
    '[ENGINE·DONE] Apex CLOSED — test:engine 275/275 · test:sql 99/99 · migration 191/191 · 신규 엔진 작업 금지',
  'engine-p0-no-migration':
    '[ENGINE·DONE] supabase/migrations 신규 금지 — 버그fix·Phase R wire 예외만 · 원격=stack:push-remote',
  'engine-p0-no-rpc':
    '[ENGINE·DONE] packages/*-engine RPC/RLS 신규 금지 — UI·glue presentation only',
  'p1-active-work-ssot-sync':
    '[P1·DOC] Plan 승인 직후 — ACTIVE_WORK_SSOT.md + REBUILD_PLAN_v1 pointer sync · check:ai-reference · 선행:engine-p0',
  'p1-foundation-tokens':
    '[P1·INFRA] product/tokens --ds-* SOT + §25.1 폰트 3서체/type scale · 선행:p1-active-work-ssot-sync · gate:typecheck',
  'p1-foundation-primitives':
    '[P1·INFRA] product/primitives shadcn/Radix · §25.2 CVA 계약 · §25.3 모션 토큰 · 선행:p1-foundation-tokens',
  'p1-foundation-router':
    '[P1·INFRA] TanStack Router shell + route tree · main.tsx 스텁 교체·__root RootLayout(PwaShell·SkipLink) 등 §27.2 · 선행:p1-foundation-primitives',
  'p1-foundation-redirects':
    '[P1·INFRA] §12.17 redirect + ?section=sports|casino on /trade 금지 · parallel hub 0 · 선행:p1-foundation-router',
  'p1-ssot-ia-canon-sync':
    '[P1·DOC] §12.19.2 — DESIGN_PRINCIPLES·SPORTS/CASINO/HOME_UX_CANON Bet hub embed 제거 · SSOT=§12.19 · 선행:p1-foundation-redirects',
  'p1-foundation-brand':
    '[P1·INFRA] 브랜드·로고·앱 아이콘 §25.9 — AI 제안 3안 → operator 승인 → SVG 정리 → assets-generator 파이프 · 선행:p1-foundation-router',
  'p1-foundation-pwa':
    '[P1·INFRA] vite-plugin-pwa 이미 연결(문서 §26) · §25.10 manifest 완전체·업그레이드 PrimeForge·/home start_url·shortcuts4·screenshots·아이콘 brand 노출 · 선행:p1-foundation-brand · gate:check:pwa',
  'p1-foundation-i18n':
    '[P1·INFRA] i18n provider shell · 선행:p1-foundation-router · gate:check:i18n',
  'p1-foundation-responsive':
    '[P1·INFRA] 4-tier viewport contract 390/768/1024/2560+ · fluid type · max-width shell · 선행:p1-foundation-tokens',
  'p1-foundation-ux-grammar':
    '[P1·INFRA] UNIFIED_UX_CANON primitives — StatusBadge·MoneyDisplay·ConfirmDialog·ToastZone(warm|strict)·HowItWorks·HelpTip(§30.2) · 선행:p1-foundation-primitives · §3.2',
  'p1-gate-foundation':
    '[P1·GATE] Foundation — typecheck+check:i18n+check:pwa+check:release · §3.0/§9 responsive smoke · 82 doc sync · 선행:p1-foundation-ux-grammar → P2',
  'p2-page-admin-home':
    '[P2·UI] /admin — ENGINE:exists useAdminOverview · 1 surface · §29 초등어·언어전+버튼 매핑 독립 · 선행:p1-gate-foundation · gate:ai-impl admin',
  'da-w0-foundation-ssot-bundle':
    '[DA·W0·BUNDLE] §34 W0 Foundation — ADR-004 brand DNA 5문법(Aurora Mesh·Quad Stream·Orbit Grid·Signal Pulse·Neural Glow) · elevation ladder · motion tier L0/L1/L2 · PC 12-col · §34.2–34.5 · §35.1 Tech Stack SSOT · docs/SSOT/PRODUCT_EXPERIENCE_CANON.md · UNIFIED_UX_CANON · DESIGN_PRINCIPLES §7 · **동일 PR 필수**(52차 · SSOT drift 0) · 선행:r0-gate-forensic-remediation · gate:check:ai-reference',
  'da-w1-ds-foundation-bundle':
    '[DA·W1·BUNDLE] §34.6–34.9 DS Foundation — Text primitive · elevation.css · Card CVA(default|raised|glass|mission|wallet-hero|vip|trade-dense|casino-play) · 8pt spacing ratchet · product/tokens+primitives · parallel card 0 · **동일 PR 필수**(50차 merge) · 선행:da-w0-foundation-ssot-bundle',
  'da-w1-gate-ds-2':
    '[DA·W1·GATE] DS 2.0 bundle — gate:ai-impl primitives+tokens · typecheck · check:i18n · check:design-tokens advisory · 82 ACTIVE_WORK_SSOT NEXT=da-w2 · 선행:da-w1-ds-foundation-bundle',
  'da-w2-shell-elevation-infra':
    '[DA·W2·BUNDLE] §34.10–34.11 Shell elevation — aurora-background.tsx+css · floating BottomNav(blur+shadow-2) · layout.css 12-col · ds-shell-panel-grid col-span-8/4 · Earn lg+ side rails · prefers-reduced-motion static · **동일 PR 필수**(50차 merge) · 선행:da-w1-gate-ds-2',
  'da-w2-gate-shell-elevation':
    '[DA·W2·GATE] Shell elevation — check:ui-architecture · gate:ai-impl shell · 390/768/1024 smoke · 5탭 IA unchanged · 선행:da-w2-shell-elevation-infra → da-w3',
  'da-w3-ia-progressive-bundle':
    '[DA·W3·BUNDLE] §34.12–34.14 Progressive IA — /home fold 1~5 · wallet-hero accordion · trade mobile ticket collapse · CollapsibleSection · HOME_UX_CANON · **동일 PR 필수**(51차 merge) · 선행:da-w2-gate-shell-elevation',
  'da-w4-motion-system-bundle':
    '[DA·W4·BUNDLE] §34.15–34.16 Motion system — interaction grammar wire · useCountUp balance·XP·PnL · reduced-motion instant · **동일 PR 필수**(51차 merge) · 선행:da-w3-gate-ia-progressive',
  'da-w5-gate-domain-cards':
    '[DA·W5·GATE] §34 domain card variants — gate:ai-impl domain cards · check:ui-architecture · 선행:da-w4-gate-motion',
  'da-w6-brand-elevation-bundle':
    '[DA·W6·BUNDLE] §34.18–34.20 Brand elevation — BrandMark aurora · domain empty states · loading signature · **동일 PR 필수**(51차 merge) · 선행:p10-operator-visual-signoff',
  'da-w8-signature-surfaces-bundle':
    '[DA·W8·BUNDLE] §34.21–34.26 Signature surfaces — home·wallet·trade·casino·sports·vip (6 surface 체크리스트) · **동일 PR 필수**(51차 merge) · 선행:p12-gate-marketing',
  'p10-sports-hub-pages':
    '[P10·BUNDLE] Sports hub pages — /sports/prematch · /sports/fixture/$fixtureId · /sports/my-bets · ENGINE:exists · **동일 PR 필수**(51차 merge) · 선행:p10-sports-fiat-hint-wire',
  'p10-sports-parity-contract-and-board':
    '[P10·BUNDLE] §22.2.5 Sports parity+board — `sports-exchange-parity-display-contract.ts`+test · SPORTS_UI_ZONE_OWNERS·COMPLAINT_RISKS·ACTION_PATH_REGISTRY · fixture 멀티마켓 `rpc_get_fixture_markets` wire · totals·spread·handicap·asian_handicap·btts·props · **동일 PR 필수**(50차 merge · contract drift 0) · 선행:p10-sports-hub-pages',
  'p10-sports-live-surface-wire':
    '[P10·UI] /sports/live surface — ENGINE:exists live markets · `useLiveFixtureState`+`sports-realtime-cache` in-play wire · goal/market suspend 배너 · live delay · score 갱신 · **기존 route 확장만·신규 route 0** · **동일 PR 필수**(50차 merge) · 선행:p10-sports-parity-contract-and-board',
  'p10-sports-slip-advanced-wire':
    '[P10·BUNDLE] Sports slip advanced — **전액 cashout UI**(`rpc_cashout_sports_bet` EXISTS)·SGP·system 탭 · stake cap·odds-changed UX · slip 확장만 · **partial=E22** · **동일 PR 필수**(52차 honesty) · 선행:p10-sports-live-surface-wire',
  'p10-sports-rules-and-vip-stub':
    '[P10·BUNDLE] Sports rules+vip stub — /sports/rules · /sports/vip STUB · **동일 PR 필수**(51차 merge) · 선행:p10-sports-layout-dedup-gate',
  'p10-casino-replay-and-infra':
    '[P10·BUNDLE] §23.2.1 Casino replay+shell — `casino-outcome-replay-contract.ts`+test · 12종 one-shot · CasinoGameShell·AutoBet · PF strip · §34.17 casino-play · **USDT/PHON stake toggle**(matrix `casino-stake-currency` → live) · **동일 PR 필수**(52차) · 선행:p10-page-casino',
  'p10-casino-fiat-hint-session-lock':
    '[P10·UI] Casino fiat hint session-lock — bet open 시 rate snapshot 고정 · spin 간 hint drift 0 · `CasinoFiatRateSession` · **Fiat#11** · 선행:p4-fiat-money-display-hint+p10-casino-replay-and-infra',
  'p11-earn-side-surfaces':
    '[P11·BUNDLE] Earn side surfaces — /events · /earn/play · /earn/cashback · /referral/leaderboard STUB · **동일 PR 필수**(51차 merge · Wallet redeem 단독) · 선행:p10-operator-visual-signoff',
  'p12-trust-marketing-hub':
    '[P12·BUNDLE] Trust+marketing hub — /tier · /features · /fees · /security · trust narrative · **동일 PR 필수**(51차 merge) · 선행:p11-gate-side-income',
  'p12-community-support-hub':
    '[P12·BUNDLE] Community+support hub — /announcements · /status STUB · /support/ticket STUB · /support · /support/faq · /feedback · **동일 PR 필수**(51차 merge) · 선행:p12-trust-marketing-hub',
  'p12-legal-pages':
    '[P12·BUNDLE] Legal pages — /legal/affiliate · /legal/cookies · **동일 PR 필수**(51차 merge) · 선행:p12-community-support-hub',
  'p13-prep-admin-canonical-docs':
    '[P13·DOC] Admin canonical docs — §29.1·§29.5 ADMIN_BEGINNER_LANGUAGE_CANON · admin-beginner-language-display-contract.ts · PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX · ADMIN_TEAM_RBAC_CANON · §12.14↔§29.2 · **동일 PR 필수**(50차 merge) · 선행:da-w8-gate-signature-experience',
  'p13-soft-launch-bundle':
    '[P13·BUNDLE] Soft launch — ko/en QA·multi-viewport·axe 0 · closed beta CB-01~06 · **동일 PR 필수**(51차 merge) · 선행:p13-ops-prod-preflight',
  'p13-closeout-bundle':
    '[P13·BUNDLE] Launch closeout — legacy class purge · docs sync · CI gate · **동일 PR 필수**(51차 merge) · 선행:da-w7-operator-visual-dae-signoff',
  'ew-e1-decay-wave':
    '[E·WAVE] E1 Tier Decay — ADR + decay RPC/cron · 45일 grace · max 1-tier drop · **동일 PR 필수**(51차 merge) · 선행:ew-e0-adr-approval',
  'ew-e2-missions-wave':
    '[E·WAVE] E2 Missions — ADR + mission catalog CRUD · admin write path · **동일 PR 필수**(51차 merge) · 선행:ew-e1-gate-decay',
  'ew-e3-viral-cms-wave':
    '[E·WAVE] E3 Viral+CMS — ADR + leaderboard RPC + promotions/CMS schema · **동일 PR 필수**(51차 merge) · 선행:ew-e2-gate-missions',
  'ew-e4-tier-option-b-wave':
    '[E·WAVE] E4 Tier Option B — ADR + tier summary RPC + Prime Elite + admin tier write · **동일 PR 필수**(51차 merge) · 선행:ew-e3-gate-cms-promotions',
  'ew-e5-gap-surfaces-wire':
    '[E·WIRE] E5 gap surfaces — /tier/me decay · /referral/leaderboard · /sports/vip live · **동일 PR 필수**(51차 merge) · 선행:ew-e4-gate-tier-option-b',
  'ew-e6-admin-desks-wave':
    '[E·WAVE] E6 admin desks — promotions · cms · tier-benefits · casino · staking · earn-activity · audit export · **동일 PR 필수**(51차 merge) · 선행:ew-e5-gate-gap-surfaces',
  'ew-e7-social-wave':
    '[E·WAVE] E7 Social — ADR + co-mission engine · **동일 PR 필수**(51차 merge) · 선행:ew-e6-gate-admin-desks',
  'ew-e21-trade-parity-wave':
    '[E·WAVE] E21 Trade parity — ADR + **신규만** hedge·reduce-only·TP/SL amend · **spot limit/stop=`rpc_place_limit_order`/`rpc_place_stop_order` EXISTS → UI unlock only(migration 0)** · trailing=`rpc_set_trailing_stop` EXISTS · **동일 PR 필수**(52차 rescope) · 선행:ew-e7-gate-engine-wave',
  'ew-e22-sports-parity-wave':
    '[E·WAVE] E22 Sports parity — ADR + **partial cashout 신규만** · odds acceptance · market catalog · **전액 cashout=`rpc_cashout_sports_bet` EXISTS → `p10-sports-slip-advanced-wire` UI** · **동일 PR 필수**(52차 rescope) · 선행:ew-e21-ui-trade-engine-unlocks',
  'ew-e23-casino-live-wave':
    '[E·WAVE] E23 Casino live — ADR + progressive rounds · live crash · PF seed controls · **동일 PR 필수**(51차 merge) · 선행:ew-e22-ui-sports-parity-unlocks',
  'ew-e8-financial-wave':
    '[E·WAVE] E8 Financial — ADR + P2P transfer · API keys · points shop reverse · **동일 PR 필수**(51차 merge) · 선행:ew-e23-ui-casino-live-unlocks',
  'ew-e9-identity-wave':
    '[E·WAVE] E9 Identity+Support — ADR + SIWE · support tickets · analytics · app-install · tier leaderboard · **동일 PR 필수**(51차 merge) · 선행:ew-e8-gate-financial',
  'ew-e10-platform-engine-wave':
    '[E·WAVE] E10 Platform engine — ADR + KRW proof · mission chains · co-bet · ML missions · **동일 PR 필수**(51차 merge) · 선행:ew-e9-gate-identity-support',
  'ew-e10-wallet-settings-ui':
    '[E·UI] E10 wallet+settings — /wallet/transfer · /settings/api-keys · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-platform-engine-wave',
  'ew-e10-trust-support-ui':
    '[E·UI] E10 trust+support — /support/ticket · /status · /tier/leaderboard · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-wallet-settings-ui',
  'ew-e10-growth-ui':
    '[E·UI] E10 growth — Kakao share SDK · app-install mission · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-trust-support-ui',
  'p2-gate-admin':
    '[P2·GATE] Admin 전 페이지 wire — gate:ai-impl apps/admin green · §29.4 용어·버튼·3초 검증 · 82 doc sync · 선행:p2-page-admin-viral-stats → P2 closeout',
  'p2-page-admin-sports':
    '[P2·UI] /admin/sports — ENGINE:exists useAdminSports · 미정·경기 연동 정산(quorum)·마켓 중단·무효 §29.2 · 선행:p2-page-admin-risk',
  'p3-page-landing':
    '[P3·UI] / 캠페인 랜딩 — §28 부제·일 친구 · 3패 hero+CTA · §28.7 cold-start social proof(ambient 티커·0명 표시 금지) · returning-user 우선(§28.4) · legal footer · 선행:p3-page-legal-risk',
  'p3-ads-attribution':
    '[P3·INFRA] 광고·동의 §28.5 — TikTok/Meta/Google tag lazy load·auth chunk lazy · rpc_record_consent 퍼사드 · CSP _headers allowlist · signup 전환 이벤트 · 선행:p3-page-landing',
  'p3-refresh-auth-landing-appshell':
    '[P3·VISUAL] Auth+랜딩 AppShell polish — `/` · `/login` · `/signup` · marketing zone(§12.19.5 AppShell 내 standalone) · §22.2 Landing+Auth · cold-start §28.7 · motion §25.3 · gate:ai-impl login+landing · 선행:p6-doc-platform-canon-sync+p3-refresh-auth-landing-design-sot',
  'p4-page-wallet-withdraw-krw':
    '[P4·UI] /wallet/withdraw/krw — ENGINE:exists · §30.3 통화 환율·예상 수령 KRW 미표시 · 출금 비활성 · 선행:p4-page-wallet-withdraw',
  'p7-gate-growth':
    '[P7·GATE] Growth smoke · earnSubnav manifest P7 routes dead link 0(§12.19.6) · §13.5.5 표시=지표 parity · onboarding·hub mission id 중복 claim 0(§3.4) · 82 doc sync · 선행:p7-page-share-earnings → P8',
  'p8-page-settings-preferences':
    '[P8·UI] /settings/preferences — ENGINE:ui_only locale/theme · §25.8.2 P8 theme toggle(color-scheme root SOT·class=dark orphan 제거·transition) · 선행:p8-page-settings-account',
  'p8-page-settings-api-keys':
    '[P8·STUB] /settings/api-keys — ENGINE:gap trading bot API · IA 미노출·Strict Perfect · E10 live · 선행:p8-page-settings-preferences',
  'p8-operator-visual-signoff':
    '[P8·VISUAL] Core hub operator sign-off — `/home` · `/notifications` · `/settings/*` · `/account` · §22.2 Earn+Home · §20.12 · preview · 390/768/1024 시안 APPROVED(앱스·프로그램 미니 턴) · 선행:p8-gate-core · P13 착수',
  'p9-first-trade-education':
    '[P9·INFRA] Trade first-visit education — §32.5 Financial tone · fee·liquidation·RG risk i18n · localStorage dismiss · trade surfaces only(신규 route 0) · 선행:p9-page-staking-positions',
  'p9-gate-trade':
    '[P9·GATE] Trade+Staking wire · tradeSubnav manifest dead link 0 · `use-trade-error-toast`→productToast strict(§3.4) · first-trade education wired · manifest+=/staking·/trade/* · 82 doc sync · 선행:p9-first-trade-education → P9 WORLD',
  'p9-trade-parity-matrix-sync':
    '[P9·DOC] §22.2.1+§22.2.3+§32.7 Parity·Ownership·ComplaintRisk — Binance·Bybit·OKX 매트릭스 · `trade-exchange-parity-display-contract.ts`+test · `TRADE_UI_ZONE_OWNERS`+`TRADE_USER_COMPLAINT_RISKS`(버튼·RPC·disabled reason) · margin-position-mode·trade-order-states sync · 선행:p9-world-preflight',
  'p9-trade-spot-pair-wire':
    '[P9·UI] Spot pair selection wire — header Select — `use-spot-desk-wire` trading pair (PHON_USDT hardcode 제거) · **§13.1.1 stake_currency per pair** (buy=USDT quote · sell=base qty · engine rule) · balance/ticket/market hook 연동 · 선행:p9-trade-parity-matrix-sync',
  'p9-trade-ticker-header-wire':
    '[P9·UI] 24h market header — `useMarketTicker`+`format-ticker-display` — spot/futures header change/high/low/vol(OI futures) · collapsible advanced row · i18n `trade.change24` — ~130 unwired to header subset · 선행:p9-trade-spot-pair-wire',
  'p9-trade-chart-pro-lwc':
    '[P9·UI] Chart interaction core (LWC v5 OSS) — **§13.1.2 표시§** crosshair·magnet·wheel zoom/pan·fitContent·touch drag·auto-resize·volume histogram · interval 1m–1d · majors=Binance/Bybit WS display-only · PHON=oracle `rpc_get_candles` · **settlement≠chart** · `product/surfaces/trade/chart/*` · 선행:p9-trade-ticker-header-wire',
  'p9-trade-chart-overlays-lwc':
    '[P9·UI] Chart overlays — **기존 `chart/*` 확장§** · candle/line · crosshair legend · MA7·EMA21 · oracle/liq priceLine · fullscreen · **TradeChartPanel 2nd instance 0** · display-only feed boundary · 선행:p9-trade-chart-pro-lwc',
  'p9-trade-terminal-bottom-dock':
    '[P9·UI] Bottom dock single owner(lg+) — mount `trade-desk-bottom-dock` · positions close+orders cancel+fills **앱스 shell 1개** · **futures-desk lg+ inline panel 제거** · mobile=tabs only·dock 0 · §32.7 H2 toss — 분산 섹션 0 · 선행:p9-trade-fills-history-wire',
  'p9-trade-recent-trades-rail':
    '[P9·UI] Recent trades rail — order book — collapsible **1개** · `trade-recent-trades-rail.tsx` · full-width duplicate tape 0 · 선행:p9-trade-terminal-bottom-dock',
  'p9-trade-orderbook-parity':
    '[P9·UI] Order book — **`spot-order-book-panel.tsx` 확장§** · grouping·spread·click→ticket · second book component 0 · 선행:p9-trade-recent-trades-rail',
  'p9-trade-futures-partial-close-ui':
    '[P9·UI] Partial close — **`futures-positions-panel.tsx` props§** · dock+positions page 동일 panel · second table 0 · ConfirmDialog · 선행:p9-trade-orderbook-parity',
  'p9-trade-futures-unrealized-pnl':
    '[P9·UI] Unrealized PnL·ROE — **`futures-positions-panel.tsx` column§** · mark display · client recompute 금지 · 선행:p9-trade-futures-margin-adjust-ui',
  'p9-trade-order-ticket-density':
    '[P9·UI] Ticket density — **`futures-order-ticket`+`spot-order-ticket` 확장** · est fee/liq/margin·balance % · **§13.1.1 futures margin_currency USDT/PHON selector → p_margin_currency` · avail switch · open orders same currency column** · **fee 숫자 row owner=本todo** · 선행:p9-trade-leverage-slider-ux',
  'p9-trade-beginner-help-layer':
    '[P9·UI] Trade·Staking 초보 가드 — §13.1.3 · §30.2 `HowItWorks`(spot·futures·staking) · `HelpTip` 13곳· subnav `trade.subnav.help.*` · TRADE_BEGINNER_LANGUAGE_CANON · `trade-beginner-language-display-contract` test green · 선행:p9-trade-order-ticket-density',
  'p9-trade-oracle-circuit-banner':
    '[P9·UI] Status banner — **`trade-market-status-banner.tsx` 1개** · desk header 아래 1줄 · AppShell duplicate 0 · stale/circuit/kill · 선행:p9-trade-tier-fee-display',
  'p9-trade-mobile-history-tab':
    '[P9·UI] Mobile tabs — chart|trade|positions|history **4탭** · **lg+ dock 0** · sticky CTA 1개· panel=desktop**동일 component import** · 선행:p9-trade-ultra-layout',
  'p9-trade-mobile-futures-book-tab':
    '[P9·UI] Mobile futures book — **5탭 중 trade 탭 1개** · chart/ticket duplicate mount 0 · spot book 별도 · 선행:p9-trade-mobile-history-tab',
  'p9-trade-settings-prefs-wire':
    '[P9·UI] Settings prefs — one-click·confirm toggles — **기존 ticket submit§** · duplicate confirm layer 0 · preferences read only · 선행:p9-trade-mobile-futures-book-tab',
  'p9-trade-i18n-surface-audit':
    '[P9·DOC] i18n audit — trade surfaces 미사용 0(defer=C) · **신규 key only if owner todo** · check:i18n · 선행:p9-trade-layout-dedup-gate',
  'p9-trade-audit-remediation-a1':
    '[P9·REMEDIATION·High] Trade QA audit A1 — **이식 서브트(동일 PR):** spot openOrders domain filter + cancel wire + TRADE_ACTION_PATH_REGISTRY spot row + mobile history props · §12.19 isolation · **wire 필독 merge 금지** · **선행 SSOT:** `trade_audit_a1_a2_fix_837aab3e.plan.md` · 근거: audit A1 · 선행:p9-trade-i18n-surface-audit',
  'p9-trade-audit-remediation-a2':
    '[P9·REMEDIATION·Medium] Trade QA audit A2 — lg+ `TradeChartPanel` single mount (viewport conditional render) · §22.2.3 H1 side-effect · **선행 SSOT:** `trade_audit_a1_a2_fix_837aab3e.plan.md` (a2-* todos) · 근거: audit A2 · **`p9-trade-chart-overlays-lwc` DoD gap** (2nd instance 0) · 선행:p9-trade-audit-remediation-a1',
  'p9-operator-visual-signoff':
    '[P9·VISUAL] Trade+Staking operator sign-off — `/trade*` · `/staking*` · §22.2·§22.2.1·§22.2.2 · **§13.1.1 USDT/PHON selector·column spot-check** · §32.7 operator 시안(버튼·앱스·잔액·체결) · §25.12.9 · §20.12 · preview · 390/768/1024/2560 APPROVED · axe 0 · dead control 0 · 선행:p9-trade-audit-remediation-a2 · P13 착수',
  'p9-gate-trade-world-class':
    '[P9·GATE] Trade World-Class — §22.2.1 Tier-A · §22.2.2 · §22.2.3 dedup 0 · **§13.1.1 dual currency trade PASS** · §32.7 H1~H4 trade PASS · layout-dedup-gate green · gate:ai-impl trade bundle · check:release · 82 doc sync · 선행:p9-operator-visual-signoff → P10',
  'launch-engine-e1-liquidation-notify':
    '[LAUNCH·ENGINE] liquidated 분기 _enqueue_notification · outbox trade_position · i18n · RED-first SQL · engine-p0-no-migration bugfix/ops 제외 · 게이트 test:sql→stack:push-remote→advisor 0 · 선행:p9-gate-trade-world-class',
  'launch-engine-e2-admin-halt-market':
    '[LAUNCH·ENGINE] rpc_admin_halt_market + Admin ops desk · immutable audit + reason mandatory + before/after snapshot · engine-p0-no-migration bugfix/ops 제외 · 게이트 test:sql→stack:push-remote→advisor 0 · 선행:launch-engine-e1-liquidation-notify',
  'launch-engine-e3-ops-telegram-webhook':
    '[LAUNCH·ENGINE] ops_alerts — edge ops-notify (Telegram) · OPS_TELEGRAM_* · HMAC signing + replay protection + fallback · engine-p0-no-migration bugfix/ops 제외 · 게이트 test:sql→stack:push-remote→advisor 0 · 선행:launch-engine-e2-admin-halt-market',
  'launch-engine-e4-concurrent-race-test':
    '[LAUNCH·ENGINE] dual-session wallet/position race · concurrent_wallet_race_test.sql · ledger=0 보장 · engine-p0-no-migration bugfix/ops 제외 · 게이트 test:sql→stack:push-remote→advisor 0 · 선행:launch-engine-e3-ops-telegram-webhook',
  'p4-fiat-reference-preflight':
    '[P4·PREFLIGHT·INFRA] §13.1.4 Fiat Reference preflight — `fiat-reference-display-contract.ts`+test · ComplaintRisk `fiat-hint-*` 5종 · ledger/RPC fiat leak grep gate · **display_only boundary** · 선행:launch-engine-e4-concurrent-race-test · YAML **#158** (Launch E1~E4 #154~#157 직후 · 직선)',
  'p4-fiat-reference-rates-hook':
    '[P4·INFRA] §13.1.4.2 `useFiatReferenceRates` — Primary snapshot · Secondary median-of-N(display) · Tertiary last-known-good · pair·stale TTL(PHON_USDT 5m·USDT/KRW 15m) · wallet queryKey 공유 · 선행:p4-fiat-currency-precision-ssot',
  'p4-fiat-hint-display-contract':
    '[P4·INFRA] §13.1.4.3 `toFiatHint(amount,sourceCurrency,targetFiat,snapshot)` · LOCALE_FIAT_MAP(ko→KRW·en→OFF·ja slot) · **krwHint 재계산금지** · i18n `trade.fiatHint.*` · 선행:p4-fiat-reference-rates-hook',
  'p4-page-wallet-fiat-hint':
    '[P4·UI] Wallet/Ledger fiat hint — balance·ledger rows · **secondary hint** · KRW deposit rate card· hook 공유 · settlement primary unchanged · 선행:p4-fiat-money-display-hint',
  'p7-earn-fiat-hint-co-primary':
    '[P7·UI] Earn fiat hint co-primary — mission/referral/tier cards PHON+fiat **동등 visual weight** · 완화 UX · 60s refresh · client reward recompute 0 · 선행:p4-fiat-money-display-hint',
  'p4-gate-fiat-reference-world-class':
    '[P4·GATE] §13.1.4 Fiat Reference **core** — Fiat#1~10 (infra+Wallet·Trade·Earn·Settings) · ComplaintRisk fiat-hint-* (core) PASS · gate:ai-impl fiat bundle · **P10 page 착수 허용** · Fiat#11~12(Sports/Casino)=P10 surface **이후** · §20.13.2 · 선행:p4-page-wallet-fiat-hint+p9-trade-fiat-hint-wire+p7-earn-fiat-hint-co-primary+p5-page-settings-fiat-reference',
  'pqa-audit-a-db-guards':
    '[PQA·AUDIT·DONE] A. live RPC pg_get_functiondef + balance-moving guard(_assert_system_live·_enforce_rate_limit·auth.uid) + admin _is_admin/_assert_admin_aal2 + GRANT/REVOKE 스냅↔grants_rls_inventory — (원격 전용 SELECT · 30-audit-discipline · G13) · 근거: 감사 섹션 A 실측 · 선행:p10-page-sports',
  'pqa-audit-b-rpc-contract':
    '[PQA·AUDIT] B. web 58+admin 44 RPC 추출 맵·live 처 1:1 — PGRST202/300 400 차단) + RAISE EXCEPTION 코드 이식·translate-error needle 매칭 없이 — 미매·오매핑 0·market_not_found 중복) + client .from(table)·RLS SELECT + realtime 구독·pg_publication_tables 조회 — · 초기 전용 · 선행:pqa-audit-a-db-guards',
  'pqa-audit-c-surface-controls':
    '[PQA·AUDIT] C. 65 route·54 surface 버튼/CTA/입력 — 수·법적 — · dead control·요구 disabled·soon stub 목록 + route·surface-domain-boundary 등록·§12.19 도메인 격리 일반 + i18n JSX 하드코딩·ko/en parity(check:i18n 미션 영역) · 초기 전용 · 선행:pqa-audit-b-rpc-contract',
  'pqa-audit-d-config-state':
    '[PQA·AUDIT] D. app_config — ↔서버 게이트 매트 + 원격 MCP get_advisors 0 ERROR·migration parity·execute_sql(read) + reconciliation_log·hash-chain·통계 — Σ 상태 조회 · project yocjhjsdwoijfdrehzoq only · 초기 전용 · 선행:pqa-audit-c-surface-controls',
  'pqa-audit-report':
    '[PQA·DOC] E. P0(보안)·P1(기능/400)·P2(UX/미매핑)·P3(부분 stub) 등급 — 국문 — 보고 — 결·근거 동일:재현·재현조건·확정방향·UNVERIFIED 구분 · 선행:pqa-audit-d-config-state',
  'pqa-fix-error-mapping':
    '[PQA·FIX] translate-error web+admin 매핑 보강 — Phase E 14건(order_not_found·post_only_would_cross·invalid_time_in_force 등·sports(market_hedge_blocked·sports_user_banned)·출금(withdrawal_address_not_whitelisted·geo_blocked)·affiliate_self_forbidden 매핑 확정 · error.* i18n keys ko/en · trade-rpc-error-display registry sync · gate:ai-impl · 선행:pqa-audit-report',
  'pqa-fix-client-gate-prechecks':
    '[PQA·FIX] server-gate·client precheck 정합 — consent_gate_enabled·withdrawal_mfa_step_up_enabled·geo_block_enabled·per-game feature_game_*_enabled 반영 — 전 거부/오류 매핑 · UI hide-only 금지·서버 authoritative — · 선행:pqa-fix-error-mapping',
  'pqa-fix-dead-controls':
    '[PQA·FIX] dead control 승리 — casino orphan(use-casino-round·/casino stub)·settings api-keys STUB·sports VIP coming-soon: 명시 defer(ew-*/§ 참조) 또는 제거 · empty state·disabled+reason 문법 · **48차 추론:** `tier-keepStatus` claim 불가(§13.10.3 확정)·disabled+reason(E1 참조) · BEP20 i18n 존재 제거 · `user_reward_tickets` 0-발급 직접 — · 선행:pqa-fix-client-gate-prechecks',
  'pqa-fix-types-regen':
    '[PQA·INFRA] database.types.ts 재생성 — 라우트 gen:types 스크립트 + drift gate · 하락 RPC(rpc_run_stop_orders·rpc_run_open_order_fills 등) 반영 · 선행:pqa-fix-dead-controls',
  'launch-engine-e5-realtime-publication':
    '[LAUNCH·ENGINE] trade/wallet 구독 레이어·realtime 정합 — oracle_prices·price_ticks·wallets·wallet_ledger·spot/trading_open_orders·futures_positions·staking_positions supabase_realtime publication 추가(RED-first SQL·test:sql·stack:push-remote·advisor 0) 또는 poll-only 계약 문서화 · engine-p0-no-migration ops 제외 · 선행:pqa-fix-types-regen',
  'r0-forensic-ssot-honesty-bundle':
    '[R0·DOC·BUNDLE] §35 Forensic SSOT 정직화 — overview Casino dual 허위 삭제·sibling plan 정직화·§20.6/§20.6.1/§20.6.2 수치=frontmatter ±0·§20.13 #180=da-w0·§33.2 PQA 전건 completed·Apex snapshot(191/99) vs current(211/117) 분리·ACTIVE_WORK/REBUILD/AGENTS NEXT 단일화 · **동일 PR 필수**(52차) · 선행:pqa-gate-platform-audit · gate:check:plan-yaml+check:plan-doc-sync',
  'r0-sports-launch-gate-wire':
    '[R0·WIRE] Sports LAUNCH_GATES 강제 — `use-sports-page-controller`에 `LAUNCH_GATES.sportsBetting` 적용 · `canPlaceBet`/`built_disabled` = contract `resolveSportsLaunchGateExposure` · kill-switch `feature_sports_enabled`와 AND · vitest controller+contract · **기존 p10-page-sports 확장만·신규 route 0** · 선행:r0-forensic-ssot-honesty-bundle · gate:ai-impl sports',
  'r0-admin-rbac-ops-wire':
    '[R0·WIRE] Admin RBAC+kill-switch — `useAdminOperatorRbac`/`canPerformAdminAction`를 high-risk desk(queues·withdraw·rewards·ops halt)에 연결 · `confirmKillSwitch` ops page 마운트 또는 dead-control 명시 · `admin-security-display-contract` stale route(`/casino`·`/cms`) 정정 · **신규 admin route 0** · 선행:r0-sports-launch-gate-wire · gate:ai-impl apps/admin',
  'r0-staking-domain-sot-sync':
    '[R0·INFRA] Staking domain SOT 단일화 — `surface-domain-boundary.ts` Earn vs Trade 충돌 해소 · Earn subnav(`/staking`) 유지 시 boundary=`earn` · rule `97` 표 동기화 · `check:phase-r-guards --strict` green · **신규 surface 0** · 선행:r0-admin-rbac-ops-wire',
  'r0-gate-forensic-remediation':
    '[R0·GATE] Forensic remediation 마감 — R0 4건 green · check:plan-yaml --track-a-only · check:plan-doc-sync · check:phase-r-guards --strict · typecheck · 82 ACTIVE_WORK NEXT=`da-w0-foundation-ssot-bundle` · 선행:r0-staking-domain-sot-sync → da-w0',
  'p10-sports-fiat-hint-wire':
    '[P10·UI] Sports slip fiat hint — **RPC potential return 이후** toFiatHint · stake+return secondary · odds client multiply 0 · **Fiat#10** · 선행:da-w5-gate-domain-cards+p4-fiat-money-display-hint+p10-page-sports',
  'p10-gate-betting':
    '[P10·GATE] Sports+Casino 12종· subnav manifest dead link 0 · first-bet education · §32.7 H5 bet slip 표시=정산(RPC) · §22.2.4 money path · casino E2E operator/CI · §31.4 · 82 doc sync · 선행:p10-first-bet-education → P10 VISUAL',
  'p10-operator-visual-signoff':
    '[P10·VISUAL] Sports+Casino operator sign-off — `/sports/*` · `/casino` · `/games/*` · §22.2 Sports+Casino · §34 domain cards · §20.12 · preview · 390/768/1024 APPROVED · axe 0 · dead control 0 · 선행:p10-gate-betting · P13 착수',
  'p9-trade-funding-history-display':
    '[P9·UI] Funding — header **current rate only** · history **dock history tab 1개** · full history table duplicate 0 · `funding_rates` read · 선행:p9-trade-cross-margin-canary',
  'p9-trade-tier-fee-display':
    '[P9·UI] Tier fee — **VIP badge/HelpTip only** · est fee 숫자=ticket-density owner · duplicate fee row 0 · 선행:p9-trade-funding-history-display',
  'p13-prep-admin-team-desk':
    '[P13·UI] /admin/team 직원 권한 주기 · §29.5 초등어 · rpc_admin_set_role_grant · owner 전용 메뉴 · settings에서 링크 · 선행:p13-prep-admin-canonical-docs',
  'da-w7-enforcement-strict-tokens':
    '[DA·W7·GATE] §34.28 strict design tokens — check:design-tokens --strict repo-wide · text-[10px]→text-tiny utility · legacy token purge · 선행:da-w6-gate-brand-elevation',
  'launch-ramp-t1-feature-gates':
    '[P13·OPS] T1 live ramp 주간 feature gate (spot·futures isolated·casino·sports) · cap 설정 · Admin daily loop (09:00 queues / ops) · 선행:p13-soft-launch-bundle',
  'launch-scale-t2-triggers':
    '[P13·OPS] T2 scale — DAU/접속 trigger matrix (500~2K / 2K~10K / 10K+) · per-user notional cap · read replica · hedge 검토 · 선행:launch-ramp-t1-feature-gates',
  'ew-e0-adr-approval':
    '[E·GATE] docs/PRODUCT/ADR/ENGINE_GAP_ADR.md operator 승인(E1~E10 index) · RED STOP 강제 · 광고·설문 미션 친구 제외 승인 · **선행:** `check:plan-yaml` green',
  'ew-e5-gate-gap-surfaces':
    '[E·GATE] STUB→live gap surfaces gate:ai-impl · 선행:ew-e5-gap-surfaces-wire → E6',
  'ew-e21-gate-trade-engine-parity':
    '[E·GATE] E21 Trade engine parity — 신규 hedge/reduce-only/tpsl SQL·test:sql Σ=0 · stack:push-remote · advisor 0 · spot limit/stop UI unlock 증거(기존 RPC) · 선행:ew-e21-trade-parity-wave',
  'ew-e22-gate-sports-parity':
    '[E·GATE] E22 sports parity — partial cashout SQL Σ=0 · stack:push-remote · advisor 0 · unlock 부분 cashout·odds policy·correct score UI · 선행:ew-e22-sports-parity-wave',
  'ew-e22-ui-sports-parity-unlocks':
    '[E·UI] Sports E22 UI unlock — 부분 cashout 헤더 · odds 하락 정책 고정 · correct score 마켓 · display contracts live · gate:ai-impl sports · 선행:ew-e22-gate-sports-parity',
  'ew-e23-ui-casino-live-unlocks':
    '[E·UI] Casino E23 UI unlock — live crash stage·단계형 mines/hilo/blackjack·fairness seed 고정 UI · §23.2.1 replay 계약→live 전환 · gate:ai-impl casino · 선행:ew-e23-casino-live-wave',
  'ew-e10-gate-platform-world-class':
    '[E·GATE] Platform World-Class DONE — test:engine · test:sql · stack:push-remote · advisor 0 · §12.18 gap 0(광고·설문 제외) · §32 completeness · 선행:ew-e10-growth-ui',
  'p2-defer-admin-support':
    '[DEFER·EW] /admin/support — 선행:ew-e9-page-admin-support · Track B (33차 SKIP 제외)',
};

/** 52차 overview 정본 (손상 복구 불가 구간) */
const CANONICAL_OVERVIEW =
  '세계 지존급 1위 = Track A(P1~P13) + **§34 Digital Aurora Design Elevation(W0~W8 · 18 ids · 50차 merge)** + Track B(E0~E21) + §20.12 VISUAL(6종) + §13.1.1 USDT·PHON dual settlement + **§13.1.4 Fiat Reference Money Stack** + §22.2.1~§22.2.4 Trade Parity·Ownership·Dedup0·MoneyTruth + **§22.2.5 Sports Parity(48종)** + **§23.2.1 Casino one-shot replay(48종)** + §25.12.9.1 Playbook + §32.7 Operator Zero-Complaint + **§20.14 Launch·Engine Ops (단일 큐)** + **§33 Platform Zero-Defect Audit(PQA A~F · `[x]` DONE)** + **§35 Forensic Remediation(R0 · 52차)** · P9 WORLD **28 steps + 26a~26b remediation** · **278 ids** (+18 DA W0~W8 (51차 merge →0) · +7 Launch · +11 PQA §33 · +20 48차 · **51차→3 bundle · 52차+5 R0 forensic**) · **§20.6.2~§20.6.3 `check:plan-yaml`** · Fiat Reference Fiat#1~12 · Trade·Sports·Staking·Earn USDT+PHON live · Casino dual=`p10-casino-replay-and-infra` · 결함0·오차0·중복UI0·유저불만0 · **orchestration SSOT=본 plan** · execute sibling=`trade_desk_*`·`phonara_수렴_*`(§35) · world-class_design_elevation 흡수·삭제. YAML=§20.6.1 · 위치=§20.6.1.';

const PHRASE_FIXES: Array<[RegExp, string]> = [
  [/Admin\s+—\s*\?페이지/g, 'Admin 전 페이지'],
  [/미정 — 경기 연동 \?산\(quorum\)/g, '미정·경기 연동 정산(quorum)'],
  [/마켓 중·무효/g, '마켓 중단·무효'],
  [/§29\.4 \?어·버튼·3\? 검/g, '§29.4 용어·버튼·3초 검증'],
  [/AdminNav \?바/g, 'AdminNav 사이드바'],
  [/모바 — 링 —/g, '모바일 링크 '],
  [/모바 — 링/g, '모바일 링크'],
  [/\?마켓/g, '스포츠 마켓'],
  [/파격 \?기/g, '파격 원격'],
  [/reason — ·audit/g, 'reason+audit'],
  [/Temporal금지/g, 'Temporal 금지'],
  [/\?페이지/g, '페이지'],
  [/\?어/g, '용어'],
  [/\?산/g, '정산'],
  [/중\?(?=·)/g, '중단'],
  [/\?기/g, '원격'],
  [/3\? 검/g, '3초 검증'],
  [/검\?(?=·|$)/g, '검증'],
  [/\?바/g, '사이드바'],
  [/\?동/g, '연동'],
  [/\?포/g, '스포'],
  [/\?딩/g, '랜딩'],
  [/login\?enroll\?challenge/g, 'login→enroll→challenge'],
  [/canonical route 1\?/g, 'canonical route 1개'],
  [/· \? MFA/g, '· 팀 MFA'],
  [/·\?개=/g, '· 모달='],
  [/P2\?P5/g, 'P2~P5'],
  [/Tab1=\?벌\?/g, 'Tab1=돈벌기·'],
  [/1\?일/g, '1파일'],
  [/\?금무제/g, '입금무제한'],
  [/\?환/g, '환율'],
  [/\?전/g, '환전'],
  [/\?율/g, '환율'],
  [/\?냅/g, '스냅'],
  [/\?고\?/g, '고지+'],
  [/\?상/g, '예상'],
  [/\?거\?/g, '제거→'],
  [/\?시/g, '표시'],
  [/\?정/g, '확정'],
  [/\?작/g, '시작'],
  [/\?일/g, '동일'],
  [/\?함/g, '포함'],
  [/\?스/g, '앱스'],
  [/\?수/g, '필수'],
  [/\?우/g, '우선'],
  [/\?커/g, '티커'],
  [/\?태/g, '상태'],
  [/\?벤/g, '이벤트'],
  [/\?사/g, '퍼사'],
  [/\?의/g, '동의'],
  [/\?딩/g, '로딩'],
  [/4\?expected/g, '4필드 expected'],
  [/3\?hero/g, '3패 hero'],
  [/검· agent/g, '검증 · agent'],
  [/출 비활 —/g, '출금 비활성'],
  [/· 광고 — ·\?의/g, '· 광고·동의'],
  [/Legal\+\?딩/g, 'Legal+Landing'],
  [/Auth\+\?딩/g, 'Auth+Landing'],
  [/AppShell \?standalone/g, 'AppShell 내 standalone'],
  [/product\/shell \?수/g, 'product/shell 이식'],
  [/check:ui-architecture \?작/g, 'check:ui-architecture 통과'],
  [/components\/ stub — product/g, 'components/ stub → product'],
  [/test:sql\?stack:push-remote\?advisor 0/g, 'test:sql→stack:push-remote→advisor 0'],
  [/H1\?H4/g, 'H1~H4'],
  [/chunk\?lazy/g, 'chunk lazy'],
  [/표시=지\?parity/g, '표시=지표 parity'],
  [/onboarding\?hub/g, 'onboarding·hub'],
  [/미노\?Strict/g, '미노출·Strict'],
  [/only\(\?규/g, 'only(신규'],
  [/`\?productToast/g, '`→productToast'],
  [/test:sql\?test:sql/g, 'test:sql'],
];

function readBackupBody(): string {
  const text = readFileSync(BACKUP_BODY_FALLBACK, 'utf8');
  if (!text.includes('14섹션') || (text.match(/\?\?/g) ?? []).length > 10) {
    throw new Error('정상 한글 백업 본문을 찾을 수 없음 (uploads L6391)');
  }
  return text;
}

function splitFrontmatter(raw: string): {
  fmLines: string[];
  body: string;
} {
  const lines = raw.split(/\r?\n/);
  const fmStart = lines.findIndex((l) => l.trim() === '---');
  const fmEnd = lines.findIndex((l, i) => i > fmStart && l.trim() === '---');
  if (fmStart === -1 || fmEnd === -1) {
    throw new Error('frontmatter 블록을 찾을 수 없음');
  }
  return {
    fmLines: lines.slice(fmStart + 1, fmEnd),
    body: lines.slice(fmEnd + 1).join('\n'),
  };
}

function buildKoreanVocabulary(cleanText: string): string[] {
  const words = cleanText.match(/[가-힣]{2,12}/g) ?? [];
  return [...new Set(words)];
}

function repairHangulToken(token: string, vocabulary: string[]): string {
  if (!token.includes('?') && !token.includes('\uFFFD')) return token;
  const cleaned = token.replace(/\uFFFD/g, '');

  const prefixMatch = cleaned.match(/^([가-힣]+)[?]+([가-힣]*)$/);
  if (prefixMatch) {
    const [, prefix, suffix] = prefixMatch;
    const candidates = vocabulary.filter(
      (w) => w.startsWith(prefix) && (suffix ? w.endsWith(suffix) : w.length > prefix.length),
    );
    if (candidates.length >= 1) return candidates.sort((a, b) => a.length - b.length)[0];
  }

  const suffixMatch = cleaned.match(/^[?]+([가-힣]+)$/);
  if (suffixMatch) {
    const suffix = suffixMatch[1];
    const candidates = vocabulary.filter((w) => w.endsWith(suffix));
    if (candidates.length === 1) return candidates[0];
    const byLen = candidates.filter((w) => w.length === suffix.length + 1);
    if (byLen.length === 1) return byLen[0];
    if (candidates.length >= 1) return candidates.sort((a, b) => a.length - b.length)[0];
  }

  return token;
}

function repairYamlContent(content: string, vocabulary: string[]): string {
  let out = content
    .replace(/\?�행:/g, '선행:')
    .replace(/금�\?/g, '금지')
    .replace(/\uFFFD/g, '');

  // ?? between technical / route tokens (YAML only — not body)
  out = out.replace(/([A-Za-z0-9_./)`]|])[?]{2}([A-Za-z/`(])/g, '$1 — $2');
  out = out.replace(/([가-힣])[?]{2}([A-Za-z가-힣(])/g, '$1 — $2');

  out = out
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim() || !part.includes('?')) return part;
      if (part.includes('?section=')) return part;
      return repairHangulToken(part, vocabulary);
    })
    .join('');

  out = out
    .replace(/\?�행:/g, '선행:')
    .replace(/금�\?/g, '금지')
    .replace(/\?\?ENGINE/g, '— ENGINE')
    .replace(/([A-Za-z0-9_./)]|\])\?\?([A-Za-z/])/g, '$1 — $2')
    .replace(/([?]{2,})/g, ' — ')
    .replace(/([가-힣])\?([·\s])/g, '$1$2')
    .replace(/([가-힣])\?(?=[가-힣])/g, '');

  for (const [pattern, replacement] of PHRASE_FIXES) {
    out = out.replace(pattern, replacement);
  }

  return out;
}

function parseFrontmatterMeta(fmLines: string[]): {
  name: string;
  overview: string;
  isProject: boolean;
} {
  let name = 'Phase R World-Class Platform';
  let overview = '';
  let isProject = false;
  for (const line of fmLines) {
    const nameMatch = line.match(/^name:\s*(.+)$/);
    if (nameMatch) name = nameMatch[1].trim();
    const overviewMatch = line.match(/^overview:\s*"(.*)"\s*$/);
    if (overviewMatch) overview = overviewMatch[1];
    if (line.trim() === 'isProject: false') isProject = false;
    if (line.trim() === 'isProject: true') isProject = true;
  }
  return { name, overview, isProject };
}

function yamlEscapeContent(content: string): string {
  return content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function serializeFrontmatter(
  meta: { name: string; overview: string; isProject: boolean },
  todos: PlanTodo[],
): string {
  const lines: string[] = [
    '---',
    `name: ${meta.name}`,
    `overview: "${yamlEscapeContent(meta.overview)}"`,
    'todos:',
  ];
  for (const todo of todos) {
    lines.push(`  - id: ${todo.id}`);
    lines.push(`    content: "${yamlEscapeContent(todo.content)}"`);
    lines.push(`    status: ${todo.status}`);
  }
  lines.push(meta.isProject ? 'isProject: true' : 'isProject: false');
  lines.push('---');
  return lines.join('\n');
}

function repairBody(_corruptBody: string, cleanBackupBody: string): string {
  return `\n${cleanBackupBody.trimStart()}`;
}

function countCorruption(text: string): number {
  const withoutQueryRoutes = text.replace(/\?section=[a-z|]+/g, '');
  return (
    (withoutQueryRoutes.match(/\?\?/g) ?? []).length +
    (withoutQueryRoutes.match(/\uFFFD/g) ?? []).length
  );
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = readFileSync(PLAN_PATH, 'utf8');
  const cleanBackupBody = readBackupBody();
  const { fmLines, body: corruptBody } = splitFrontmatter(raw);
  const meta = parseFrontmatterMeta(fmLines);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const vocabulary = buildKoreanVocabulary(cleanBackupBody);

  const repairedBody = repairBody(corruptBody, cleanBackupBody);
  const repairedOverview = CANONICAL_OVERVIEW;

  const repairedTodos = todos.map((todo) => {
    const canonical = CANONICAL_TODO_CONTENT[todo.id];
    if (canonical) return { ...todo, content: canonical };
    return { ...todo, content: repairYamlContent(todo.content, vocabulary) };
  });

  const output = `${serializeFrontmatter({ ...meta, overview: repairedOverview }, repairedTodos)}${repairedBody}`;

  const beforeBad = countCorruption(raw);
  const afterBad = countCorruption(output);

  console.log(`vocabulary: ${vocabulary.length} words`);
  console.log(`corruption markers (excl. ?section=): ${beforeBad} → ${afterBad}`);
  console.log(`todos: ${repairedTodos.length}`);

  if (dryRun) {
    console.log('\n[dry-run] overview:', repairedOverview.slice(0, 160));
    console.log('[dry-run] first todo:', repairedTodos[0]?.content);
    const badTodos = repairedTodos.filter((t) =>
      /[?\uFFFD]/.test(t.content.replace(/\?section=/g, '')),
    );
    if (badTodos.length) {
      console.log(`[dry-run] todos with residual corruption: ${badTodos.length}`);
      console.log(
        badTodos
          .slice(0, 5)
          .map((t) => `${t.id}: ${t.content.slice(0, 100)}`)
          .join('\n'),
      );
    }
    console.log('[dry-run] body start:', repairedBody.trimStart().slice(0, 120));
    return;
  }

  const bakPath = `${PLAN_PATH}.bak-${Date.now()}`;
  copyFileSync(PLAN_PATH, bakPath);
  writeFileSync(PLAN_PATH, output, { encoding: 'utf8' });
  console.log(`✅ repaired → ${PLAN_PATH}`);
  console.log(`   backup → ${bakPath}`);
}

main();
