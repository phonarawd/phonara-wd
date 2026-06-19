# Lovable Zenith — 잔여 작업 로드맵 (정본)

> **갱신:** 2026-06-15 · handoff **v35** · NEW_CHAT **v36** · **Phase 6 CLOSE ✅** · §E **v25**
> **정본 체인:** [`LOVABLE_ZENITH_MASTER_PLAN.md`](LOVABLE_ZENITH_MASTER_PLAN.md) → 이 파일(잔여·슬라이스 ID) → [`LOVABLE_ZENITH_NEW_CHAT.md`](LOVABLE_ZENITH_NEW_CHAT.md) §RED NOW  
> **North Star (압살 목표):** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md)  
> **PHONARA:** paste/ZIP 전 **코드 0줄** · §E 수신 시 handoff만 갱신

---

## 1. 완료 ✅ (Lovable 실측 · handoff 반영)

| 묶음 | 내용 |
|------|------|
| Macro **0–2** | Foundation · Crash 템플릿 |
| Macro **3** | Plinko · Limbo · Mines · HiLo · Dice |
| Macro **4** | 게임 **10/10** · MintReels · GoldRush · Blackjack · Roulette |
| **§8-A / bis** | GameRules i18n **134키** ko/en |
| **§Phase 4.5** | Auto P1 **6/6** CLOSE · vitest **356/356** |
| **Phase 5-A** | Casino preview AppShell **10/10** (`.lovableignore` · ZIP 미반출) |
| **Phase 5 core** (Lovable 로컬) | BottomNav 5탭 · AccountSheet · TierBadge — **operator 실측 GREEN** (handoff v17 반영) |
| **Phase 5-B-shell** | SupportChatFab · LoginModal · shell ko=0 **7파일** · i18n **63=63** · vitest **356/356** |
| **Phase 5-C-density** | trade density tokens · route head() **5** · canonical/og:url ×5 · vitest **356/356** |
| **Phase 5-D-overflow** | BottomNav MoreMenu · shell ko=0 **8파일** · i18n **65=65** · vitest **356/356** |
| **handedness-persist** | `useHandedness` · SupportChatFab FAB 좌/우 · settings Segment · i18n **65=65** · vitest **356/356** |
| **5-macro-tier-i18n** | `TierBadge` `TIER_KEY` + `t()` · `tier.*` 5키 · shell\|nav **65=65** · catalog **494=494** · L9 **0** · vitest **356/356** |
| **5-macro-faq-shortcut** | `TradeRulesSheet` · `trade.rules.*` **14키** · catalog **508=508** · vitest **356/356** |
| **5-macro-footer-banner** | `SiteFooter` + `GlobalCountdownBanner` · catalog **516=516** · shell ko=0 **10파일** · vitest **356/356** |
| **6-ds-overlay-errorstate** | overlay 토큰 · error-state i18n · ui/ ko=0 **49** · catalog **517=517** · vitest **356/356** |
| **6-ds-toast-token** | SKIP · sonner 사전 토큰화 · toast.tsx 부재 · diff plan.md only |
| **6-ds-ring-offset** | ring-offset arbitrary 1-form · **5파일 / 6occ** · catalog **517=517** · vitest **356/356** · tsc clean |
| **6-ds-welcomesheet** | welcome.* **7** + common.close **1** · WelcomeSheet ko=0 · catalog **525=525** · `bg-black/60` defer |
| **Phase 6 macro** | **5슬라이스 CLOSE** — overlay-errorstate · toast SKIP · ring-offset · welcomesheet · cva SKIP |
| **6-ds-cva** | SKIP · 8 cva semantic-clean (`rg -l "cva(" ui/`) · diff plan.md only · §E v25 |

---

## 2. Phase 5 슬라이스 ID (이름 충돌 해소)

| ID | 내용 | 상태 |
|----|------|------|
| **5-A** | Casino preview `casino.*` → `<AppShell density="app" hideMobileNav>` | ✅ GREEN |
| **5-core** | BottomNav 5 route · AccountSheet · TierBadge | ✅ GREEN (Lovable 로컬) |
| **5-B-shell** | SupportChatFab · LoginModal · shell 5파일+신규2 ko=0 | ✅ GREEN §E v17 |
| **5-C-density** | `density="trade"` 분기 · route `head()` meta | ✅ GREEN §E v17 |
| **5-D-overflow** | BottomNav MoreMenu Sheet | ✅ GREEN §E v17 |
| **handedness-persist** | `useHandedness` · SupportChatFab FAB 좌/우 · settings Segment | ✅ GREEN §E v18 |
| **5-macro-tier-i18n** | `TierBadge` → `tier.*` i18n 5키 · fomo only | ✅ GREEN §E v19 |
| **5-macro-faq-shortcut** | trade-only `TradeRulesSheet` · `trade.rules.*` 14키 | ✅ GREEN §E v20 |
| **5-macro-footer-banner** | `SiteFooter` + `GlobalCountdownBanner` → `footer.*`/`banner.*` 8키 | ✅ GREEN §E v21 |
| **Dashboard hub** | 4-panel · NextActionBar | ⏳ **후순위** (Phase 6 GO 가능) |

**Macro PHASE 5** = **5-A–D + macro 4슬라이스 ✅** · Dashboard defer · **Phase 6 GO 가능**.

> **shell ko=0 정본 (v21~):** AppShell · TopBar · AccountSheet · SideNav · BottomNav · SupportChatFab · LoginModal · MoreMenu · SiteFooter · GlobalCountdownBanner — **10파일**

### 5-B-shell LOCK (구현 정본)

| ID | LOCK |
|----|------|
| L1 | 본 슬라이스 = **5-B-shell** · density = **5-C** |
| L2 | TopBar 한글 100% → `t()` (TITLES · aria · toast · `PHONARA` 브랜드 literal 유지) |
| L3 | AccountSheet `고객센터` = SupportChatFab **동일 Sheet** (`AppShell` `supportOpen` 단일 state) |
| L4 | Google CTA = `toast(t('shell.login.googleSoon'))` · TopBar Login = `md:` only · 모바일 = AccountSheet "3초 가입" only |
| L5 | **shell ko=0 가드 = 7파일** (AppShell · TopBar · AccountSheet · SideNav · BottomNav · **SupportChatFab · LoginModal**) |

**신규:** `SupportChatFab.tsx` (controlled) · `LoginModal.tsx` (Dialog mock)  
**수정:** `AppShell` · `TopBar` · `AccountSheet` · `SideNav` · `i18n/ko.ts` · `en.ts`  
**no-touch:** `games/**` · `routes/**` · `BottomNav` · `GlobalCountdownBanner` · `SiteFooter` · PHONARA

**§E (2026-06-15):** GREEN — LOCK L1–L5 · shell ko=0 7파일 · i18n 63=63 · vitest 356/356 · AppShell props 무변동.

---

### 5-C-density LOCK (구현 정본 · operator GO)

**확정 옵션:** A (density + head 둘 다) · head i18n = 한글 리터럴 (`seo.*` = Phase 10 defer).

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **5-C-density** · **5-D-overflow** 후속 |
| L2 | `styles.css` `[data-density="trade"]` 토큰 확장만 — `data-density` API/AppShell props 시그니처 **무변동** |
| L3 | head() 풀세트 **5파일:** `account` · `settings` · `wallet` · `leaderboard` · `referral` (한글 리터럴 · `about.tsx` 선례) |
| L4 | **no-touch:** `games/**` · `routes/casino.*` · `shell/**` · `i18n/**` · PHONARA |
| L5 | `tsc` clean · vitest **356/356** delta 0 |

**1. styles.css** — 기존 2줄 trade 블록 확장:

- 토큰: `--density-pad-x/y` · `--density-gap` · `--density-radius` · `--density-row-h` · `line-height: 1.35`
- opt-in: `.row-tight` · `.cell-tight` · `.grid-tight` · `table`/`th`/`td` (tabular-nums)
- **no-touch:** `earn`/`app` 스코프 · trade.tsx 인라인 Tailwind 자동 적용 없음 → 회귀 0

**2. routes head()** — 5파일 각각 title · description · og:title/desc/url · canonical:

| 파일 | path | description 요지 |
|------|------|------------------|
| `account.tsx` | `/account` | 계정 · 프로필 · 보안 · 세션 |
| `settings.tsx` | `/settings` | 알림 · 언어 · 테마 환경설정 |
| `wallet.tsx` | `/wallet` | 입출금 · 자산 · 거래 내역 |
| `leaderboard.tsx` | `/leaderboard` | PnL 랭킹 · 시즌 보상 |
| `referral.tsx` | `/referral` | 초대 코드 · 리워드 트리 |

**검증:**
```bash
bunx tsc --noEmit && bunx vitest run
rg -n "canonical" src/routes/{account,settings,wallet,leaderboard,referral}.tsx  # 5
rg -n "og:url"    src/routes/{account,settings,wallet,leaderboard,referral}.tsx  # 5
git diff --stat src/games src/routes/casino.*.tsx src/components/shell src/i18n  # empty
```

스폿: `/trade` density 회귀 0 · 5라우트 head DOM.

**§E (2026-06-15):** GREEN — LOCK L1–L5 · trade tokens · head 5 · canonical/og:url ×5 · vitest 356/356 · games/shell/i18n no-touch.

---

### 5-D-overflow LOCK (구현 정본 · §E 2026-06-15)

**LOCK A:** BottomNav 5th = More → Sheet · SideNav no-touch · Support = FAB/AccountSheet · ImportedMorePage defer.

| 검증 | 실측 |
|------|------|
| 산출 | `MoreMenu.tsx` · `BottomNav.tsx` · `shell.more.*` i18n 2키 |
| shell ko=0 | **8파일** |
| i18n | **65=65** |
| vitest | **356/356** delta 0 |

**§E:** GREEN — LOCK L1–L9 · MoreMenu · BottomNav More · 5-core 5th earn supersede.

---

### handedness-persist LOCK (구현 정본 · §E 2026-06-15)

**확정:** handedness only · 영향 = **SupportChatFab FAB 좌/우 swap만** · Sheet `side="right"` 무변동.

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **handedness-persist** only (FAQ · tier.* · Footer/Banner 후속) |
| L2 | `phonara.handed` ∈ {`right`,`left`} · localStorage · 기본 `right` |
| L3 | `SupportChatFab.tsx` — FAB `fixed` 좌/우만 swap · Sheet `side="right"` **무변동** |
| L4 | `routes/settings.tsx` — "조작 손" Segment (routes 한글 리터럴 패턴 · LANG_KEY) |
| L5 | **no-touch:** BottomNav · SideNav · TopBar · AppShell · AccountSheet · LoginModal · MoreMenu · density · `games/**` · `routes/casino.*` · PHONARA |
| L6 | `src/hooks/useHandedness.ts` 신규 — SSR-safe · `storage` event sync · v1 hydrate 깜빡임 허용 |
| L7 | shell ko=0 가드 **8파일** 유지 · i18n 신규 **0** (**65=65** 무변동) |
| L8 | `bunx tsc --noEmit` clean · vitest **356/356** delta 0 |

**허용 diff:** `useHandedness.ts` · `SupportChatFab.tsx` · `settings.tsx` · `.lovable/plan.md`

**검증:**
```bash
bunx tsc --noEmit && bunx vitest run
rg -n "phonara\\.handed" src/hooks/useHandedness.ts src/components/shell/SupportChatFab.tsx src/routes/settings.tsx
git diff --stat src/components/shell/BottomNav.tsx src/components/shell/SideNav.tsx src/components/shell/AppShell.tsx src/i18n  # empty
```

**§E (2026-06-15):** GREEN — LOCK L1–L8 · useHandedness 신규 · SupportChatFab 좌/우 swap · settings "조작 손" Segment · shell ko=0 8파일 · i18n 65=65 무변동 · vitest 356/356 delta 0.

---

### 5-macro-tier-i18n LOCK (구현 정본 · operator GO v2 · 2026-06-15)

**확정:** `TierBadge` 라벨 5종 → `tier.*` i18n · prop `tier="bronze"` 등 시그니처 무변동 · 5-core 계약 유지.

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **5-macro-tier-i18n** only · FAQ · Footer/Banner · Dashboard 후속 |
| L2 | 단일 관심사 = `TierBadge` 라벨 → `t("tier.<tier>")` |
| L3 | i18n 신규 5키 × 2 locale = `tier.bronze` · `tier.silver` · `tier.gold` · `tier.platinum` · `tier.diamond` |
| L4 | 사용처 호출 시그니처 무변동 — `account` / `home` / `AccountSheet` / `MobileTradeView` no-diff |
| L5 | 허용 diff = `i18n/ko.ts` · `i18n/en.ts` · **`components/fomo/TierBadge.tsx` only** · `.lovable/plan.md` |
| L6 | no-touch = shell 8파일 · density · games · casino routes · PHONARA · useHandedness · MoreMenu |
| L7 | shell ko=0 **8파일** · shell\|nav i18n **65=65** · 전체 catalog **+5/+5** (ko=en parity) |
| L8 | vitest **356/356** delta 0 · tsc clean |
| L9 | **TierBadge 외** tier 하드코드 라벨 **0건** (rg 가드) |

**TierBadge 타입 패턴:** `TIER_KEY: Record<Tier, \`tier.${Tier}\`>` → `t(TIER_KEY[tier])` · `as const` template narrowing 회피.

**허용 diff:** `src/i18n/ko.ts` (+5) · `src/i18n/en.ts` (+5) · `src/components/fomo/TierBadge.tsx` · `.lovable/plan.md`

**검증:**
```bash
bunx tsc --noEmit && bunx vitest run
rg -n "[가-힣]" src/components/shell/{AppShell,TopBar,AccountSheet,SideNav,BottomNav,SupportChatFab,LoginModal,MoreMenu}.tsx  # 0
rg -n "브론즈|실버|골드|플래티넘|다이아|BRONZE|SILVER|GOLD|PLATINUM|DIAMOND" src -g '!src/i18n/*' -g '!**/*.test.*'  # TierBadge.tsx 외 0
```

**§E (2026-06-15):** GREEN — LOCK L1–L9 · `TIER_KEY` + `t()` · ko/en +5 `tier.*` · shell\|nav **65=65** · catalog **494=494** · L9 하드코드 **0** · vitest **356/356** delta 0 · Phase 10 memo: `@phonara/i18n` tier.* 5키 동기.

---

### 5-macro-faq-shortcut LOCK (구현 정본 · trade-only · operator GO · 2026-06-15)

**확정:** A1 trade-only — `TradeRulesSheet` (GameRulesSheet 미러) · `/trade` HUD `?` trigger · **전역 FAQ · MoreMenu/AccountSheet 진입 금지**.

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **5-macro-faq-shortcut** (trade-only) · shell FAQ 진입점 추가 **금지** |
| L2 | 패턴 = `GameRulesSheet` 미러 (vaul · `collectKeyedLines` step/tip) · fairness 링크 **제외** |
| L3 | 진입 = mobile 1 + desktop 1 · `data-testid="trade-rules"` · `TradeRulesTrigger` aria `t("trade.rules.cta")` |
| L4 | i18n = **`trade.rules.*` only** · `casino.rules.common.*` 재사용 **금지** · step≥4 · tip≥2 |
| L5 | no-touch = shell 8파일 · `games/**` · `GameRulesSheet.tsx` · `casino.*` · MoreMenu · AccountSheet · handedness · density |
| L6 | 허용 diff = `TradeRulesSheet.tsx` (신규) · mobile trigger 1파일 · `routes/trade.tsx` (DesktopTrade) · `i18n/ko.ts` · `en.ts` · `.lovable/plan.md` |
| L7 | shell ko=0 **8파일** · shell\|nav **65=65** · catalog ko=en parity diff=∅ |
| L8 | vitest **356/356** · tsc clean |
| L9 | `TradeRulesSheet.tsx` JSX 한글 **0** · rules 본문 i18n 경유만 |

**§E (2026-06-15):** GREEN — LOCK L1–L9 · `TradeRulesSheet` 신규 · `MobileTradeView` + `routes/trade.tsx` trigger 각 1 · `trade.rules.*` **14키×2** · shell ko=0 **8파일** · `TradeRulesSheet` ko=0 · shell\|nav **65=65** · catalog **508=508** · vitest **356/356** · Phase 10 memo: `@phonara/i18n` `trade.rules.*` 14키 동기.

---

### 5-macro-footer-banner LOCK (구현 정본 · i18n 완성 · operator GO v2 · 2026-06-15)

**확정:** `SiteFooter` + `GlobalCountdownBanner` 한글 → `footer.*`/`banner.*` · 신규 와이어 없음 · AppShell 구조 무변동.

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **5-macro-footer-banner** — i18n만 · 신규 라우트/컴포넌트/AppShell 구조 변경 **금지** |
| L2 | `SiteFooter` 5건 → `footer.*` · `LINKS` labelKey + `t()` |
| L3 | `GlobalCountdownBanner` 3건 → `banner.*` · default `t("banner.prelaunch")` · **호출부 `message=` 한글 금지** · AppShell diff ∅ |
| L4 | i18n +8 · en `banner.dayUnit = "d"` (`14d 23:59:59`) |
| L5 | **shell ko=0 가드 8→10** (+SiteFooter +GlobalCountdownBanner) — GREEN 시 handoff 전역 갱신 |
| L6 | no-touch = AppShell 구조 · Nav/TopBar/Account/MoreMenu · games · casino · trade · TradeRulesSheet · PHONARA |
| L7 | `<SiteFooter />` · `<GlobalCountdownBanner endsAt={...} />` 시그니처 무변동 |
| L8 | 허용 diff = `SiteFooter.tsx` · `GlobalCountdownBanner.tsx` · `i18n/ko.ts` · `en.ts` · `.lovable/plan.md` |
| L9 | footer/banner 텍스트 = 두 컴포넌트 + i18n만 · shell\|nav **65=65** · catalog **508→516** |

**§E (2026-06-15):** GREEN — LOCK L1–L9 · SiteFooter + GlobalCountdownBanner i18n · `footer.*` +5 · `banner.*` +3 · shell ko=0 **10파일** · shell\|nav **65=65** · catalog **516=516** · vitest **356/356** · Phase 10 memo: `@phonara/i18n` footer/banner 8키 동기.

---

### 6-ds-overlay-errorstate LOCK (Phase 6 첫 슬라이스 · operator GO v3 · 2026-06-15)

**확정:** overlay 토큰 + `error-state.tsx` i18n · ui/ **49** 전수 감사 잔여 2종 · **pair-condition** 마감 rg.

| ID | LOCK |
|----|------|
| L1 | 슬라이스 = **6-ds-overlay-errorstate** — 토큰 + i18n only |
| L2 | `styles.css` `--overlay` :root + `--color-overlay` @theme inline · density 미override |
| L3 | ui/ `bg-black/80` → **`bg-(--color-overlay)`** 동일 문자열 · 4파일(dialog/alert-dialog/drawer/sheet) · **횟수 비고정** |
| L4 | `error-state.tsx` defaults → `t(common.error.*)` |
| L5 | i18n +1 `common.error.desc` · title/retry 재사용 · catalog **516→517** |
| L6 | **ui/ ko=0 가드 신설** (`src/components/ui/**`) |
| L7 | ui dumb `@/i18n` 예외 = **2파일** (`error-state.tsx` · `gate-banner.tsx` 사전 존재) · chart recharts no-touch |
| L8 | prop/export 무변동 |
| L9 | 허용 diff **9파일** (styles + 4 ui + error-state + ko/en + plan) |

**마감 pair-condition (정본):**
```bash
rg "bg-black/80" src/components/ui/           # 0
rg "bg-\(--color-overlay\)" src/components/ui/ # N≥1 · 4파일 범위만
rg "bg-overlay\b" src/                          # 0
```

**§E (2026-06-15):** GREEN — LOCK L1–L9 · `--overlay` :root + @theme inline · 4 modal overlay pair-condition · error-state t() · ui/ ko=0 **49** · ui `@/i18n` **2파일** (error-state + gate-banner) · shell ko=0 **10** · catalog **517=517** · vitest **356/356** · Phase 10 memo: `common.error.desc` + overlay paste 매핑.

> **ui dumb `@/i18n` 정본 (v22~):** `error-state.tsx` · `gate-banner.tsx` — **2파일만** · 신규 ui/ 컴포넌트 `@/i18n` import 금지(예외 승인 전).

---

### 6-ds-toast-token SKIP (2026-06-15 · §E v23)

**기록:** sonner semantic tokens 사전 적용 · `toast.tsx` 부재 · pre-verify hardcoded color/ko=0 · **diff = plan.md only**.

**Phase 10 memo:** `6-ds-toast-variants` (success/error/warning surface) operator GO **후순위**.

---

### 6-ds-ring-offset LOCK v1.3 (2026-06-15 · §E v23)

**확정:** focus ring offset arbitrary 1-form · i18n 0 · **pre-GO `rg -l` = 정본** (스냅샷 7파일 ≠ 실측 5).

| ID | LOCK |
|----|------|
| L1 | Slice = **6-ds-ring-offset** — ring-offset 1-form · i18n 0 |
| L2 | `styles.css` 무변 (`--color-ring-offset-background` @theme inline 사전 존재) |
| L3 | `ring-offset-background` → `ring-offset-(--color-ring-offset-background)` · 변형 none (실측) |
| L4–L6 | i18n 0 · catalog **517=517** · ui/ ko=0 **49** |
| L7 | `@/i18n` **2파일** 유지 (error-state · gate-banner) |
| L9 | allowlist = pre-GO `rg -l` **N파일** + plan.md |

**§E (2026-06-15):** GREEN — **5파일 / 6occ** (sheet · dialog · switch · tabs · select) · 변형 **none** · overlay 회귀 PASS · shell ko=0 **10** · vitest **356/356** · tsc clean · 시각 스폿 5면 PASS.

**Phase 10 memo:** PHONARA paste 시 ring-offset 토큰명 매핑 (비블로커).

---

### 6-ds-welcomesheet LOCK v1.1 (2026-06-15 · §E v24)

**Scope:** i18n only · `components/welcome/WelcomeSheet.tsx` · welcome.* **7** + common.close **1** · catalog **517→525**.

**defer:** `bg-black/60`=1 유지 → **6-ds-scrim-soft** (별도 micro-slice).

**§E (2026-06-15):** GREEN — WelcomeSheet ko=0 · welcome namespace **7** · shell ko=0 **10** · ui `@/i18n` **2** · ring-offset/overlay 회귀 PASS.

**Phase 10 memo:** `@phonara/i18n` common.close + welcome.* 8키 동기.

---

### 6-ds-cva SKIP · Phase 6 · 5슬라이스 CLOSE (2026-06-15 · §E v25)

**N (정본):** `rg -l "cva(" src/components/ui/` = **8** (toggle · sidebar · button · sheet · badge · navigation-menu · alert · label · toggle-group은 import-only).

**§E:** SKIP — semantic-clean · hardcoded color/ko=0 · diff **plan.md only** · catalog **525=525** · vitest **356/356** · tsc clean.

**Phase 6 · 5슬라이스 CLOSE:** overlay-errorstate (v22) · toast SKIP (v23) · ring-offset (v23) · welcomesheet (v24) · cva SKIP (v25).

**Defer:** `6-ds-cva-base-dedup` · `6-ds-scrim-soft` · `6-ds-toast-variants`.

---

## 3. Macro Phase 7–10 잔여 ⏳

### Phase 6 — Design System — **CLOSE ✅**

ui/ **49** · welcome/ · catalog **525=525** · 정본 가드: shell ko=0 **10** · ui `@/i18n` **2** · ui/ ko=0 **49**.

### Phase 7 — Earn · viral · FOMO · Tier ⏳ **NEXT (operator GO)**

> **North Star:** ⑤ 불끼기 — 앱테크(Earn·viral) + 베팅(Rollbit/Stake FOMO·Tier). **Earn first** · Trade last · 엔진 no-touch.

**금지 (operator 확정):** **영상 광고 · 설문 광고 미션 0** — UI·i18n·mock·엔진 슬라이스 모두. `mission.ad.*` · `mission.survey.*` 금지. · `rpc_*` / `@phonara` / `@supabase` in earn/fomo paths.

| 순서 | ID | 벤치 | 상태 |
|------|-----|------|------|
| 1 | **7-earn-hub-i18n** | 국내 앱테크 · WelcomeSheet→/earn | ✅ **§E v26 GREEN** (LOCK v1.2 · 2026-06-15) |
| 2 | **7-viral-referral-card-i18n** | ReferralQuickCard · `/earn` 홈 | ✅ **§E v27 GREEN** (LOCK v0 · card only · 2026-06-15) |
| 2b defer | `7-viral-referral-route` · `7-viral-mission-expand` | `/referral` · mission.viral 2행 | ⏳ |
| 3 | **7-fomo-wheel-i18n** | `WheelOfFortune` · `/earn` | ✅ **§E v28 GREEN** (LOCK v0 · partial · 2026-06-15) |
| 3c | **7-fomo-streak-i18n** | `StreakRing` · `/earn` | ✅ **§E v29 GREEN** (LOCK v0 · partial · 2026-06-15) |
| 3d | **7-fomo-leaderboard-i18n** | Leaderboard · LiveActivityFeed | ✅ **§E v30 GREEN** (LOCK v0 FINAL · 2026-06-15) |
| 3e | **7-fomo-tier-i18n** | BonusTier · LimitedDropCard · ReferralTree | ✅ **§E v31 GREEN** (LOCK v0 FINAL · 2026-06-15) |
| 3f | **mounted fomo** | 7 components i18n | ✅ **CLOSED** |
| 3h | **7-route-seo-head-i18n** | leaderboard · referral · games.index head() | ✅ **§E v32 GREEN** |
| 3i | **7-phase7-closeout-i18n** | MEGA 14 files · mounted funnel 표면 | ✅ **§E v33 MEGA GREEN** |
| 3j | **7-phase7-defer-closeout** | defer 8 files + G6 hotfix | ✅ **§E v34 GREEN** (catalog **788**) |
| 3k | **§P8-1** | Phase 8 cluster 1/4 | ✅ **GREEN** (catalog **862**) |
| 3l | **§P8-2** | Phase 8 cluster 2/4 | ✅ **GREEN** (catalog **935**) |
| 3m | **§P8-3** | Phase 8 cluster 3/4 | ✅ **GREEN** (catalog **949**) |
| 3n | **§P8-4** | Phase 8 cluster 4/4 | ✅ **GREEN** (catalog **982** · **32/32 COMPLETE**) |
| 3o | **casino-routing-hotfix** | `casino.tsx` Outlet + `casino.index.tsx` | ✅ **GREEN** (2026-06-15) |
| 3p | **§P9 Admin** | Phase 9 · 8 admin surfaces | ✅ **GREEN** (catalog **1053**) |
| 4 | **Phase 10** | sweep · verify · ZIP | ✅ **GREEN** (catalog **1053** · user **103 KB** · admin **51 KB**) |
| 4b | **Phase 11-B** | 표시 품질 sweep | ✅ **GREEN** (catalog **1059** · user **100.7 KB** · admin **50.6 KB**) |
| 4c | **Phase 11-C** | PWA Supremacy | ✅ **GREEN** (catalog **1075** · ZIP **101.2+51.2 KB**) |
| 4d | **Phase 12-A** | Games World-Class Pass | ⏳ **PLANNED** |
| 4e | **Phase 12-B** | Missions 6-Lane Full | ✅ **GREEN** (2026-06-15 · EXECUTE v2.2 · A1) |
| 4f | **Phase 12-C** | Home Hub Supremacy | ⏳ **PLANNED** |
| 4g | **Phase 12-D** | Trade Surface Pro | ⏳ **PLANNED** |
| 4h | **Phase 12-E** | Partner / 총판 Hub | ⏳ **PLANNED** |
| 4i | **Phase 12-F** | Admin Affiliate Ops (선택) | ⏳ defer OK |
| 4z | **Phase 12-Z** | Lovable PRODUCT FINAL | ⏳ **paste 게이트** |
| 5 | **PHONARA paste** | ZIP → web + admin · i18n · E2E | ⏳ **12-Z GREEN 후 1회** |
| 3g defer | viral UX · tier **§E v35** | — | ⏳ post-P8 or 병행 |

**Phase 7 마감 게이트 (매 슬라이스):** vitest **356/356** · catalog ko=en parity · Phase 6 회귀 rg · shell/ui/welcome ko=0 · ui `@/i18n` **2**.

---

### 7-earn-hub-i18n LOCK v1 (Phase 7 첫 슬라이스 · operator GO · 2026-06-15)

**North Star bar:** 들어오자마자 “벌었다” — **48px+ 터치 · 저밀도 · JSX ko=0** · WelcomeSheet CTA → `/earn` **1-hop** · **6레인 미션 taxonomy** (§10).

| ID | LOCK |
|----|------|
| **L1** | Slice = **7-earn-hub-i18n** — `/earn` + `components/earn/` **i18n + mock 표시 only** |
| **L2** | **Earn first** — trade/casino 고밀도 문법 `/earn` 침범 금지 · `[data-density="app"]` 유지 |
| **L3** | pre-GO `rg -l` 정본: `src/routes/*earn*` · `src/components/earn/**` · 한글 잔존 → `earn.*` (+ 필요 시 `mission.*`) 키 |
| **L4** | i18n 신규 키 = pre-GO diff 집합 · catalog **525→N** ko=en parity diff=∅ |
| **L5** | **엔진 no-touch** — `rpc_*` · `@phonara` · `@supabase` · `@phonara/game-engine` **0** · mock/callback only |
| **L6** | shell ko=0 **10** · ui/ ko=0 **49** · welcome ko=0 · ui `@/i18n` **2** 유지 |
| **L7** | **operator LOCK** — **영상 광고 · 설문 광고 미션 금지** (UI/i18n/mock/엔진) · `mission.ad.*` · `mission.survey.*` · offer wall · rewarded video · floating point money · UI payout 재계산 |
| **L7b** | **MissionChecklist 6레인 taxonomy** — North Star §10: A daily + B growth **완전 i18n** · C–F **preview 1행+** (`mission.*` 키) · 탭/섹션 빈칸 0 |
| **L8** | WelcomeSheet `welcome.cta` / home mount → `/earn` **동선 유지 또는 명시 연결** |
| **L9** | 허용 diff = pre-GO `rg -l` **N파일** + `i18n/ko.ts` · `en.ts` + `.lovable/plan.md` |

**Pre-verify (GO 직전 · Lovable 실측):**
```bash
rg -l "earn" src/routes/ src/components/earn/ 2>/dev/null
rg -n "[가-힣]" src/routes/*earn* src/components/earn/ 2>/dev/null
rg -o '"earn\.[^"]+"' src/i18n/ko.ts | sort -u
rg -o '"earn\.[^"]+"' src/i18n/en.ts | sort -u
rg "rpc_|@phonara|@supabase" src/components/earn/ src/routes/*earn* 2>/dev/null  # 0
rg -n "welcome\.cta|/earn" src/components/welcome/ src/routes/home.tsx
```

**§E v26 GREEN template:**
```text
7-earn-hub-i18n GREEN · CORE 4 · earn.* + mission.* + earn.spin.title + earn.feed.* · catalog 525→N
MissionChecklist 6레인 · routes/earn ko=0 · WelcomeSheet→/earn PASS
operator LOCK 준수(영상/설문 광고 0) · vitest 356/356 · Phase 6 회귀 PASS
```

### 7-earn-hub-i18n operator 결정 (LOCK v1.1 · 2026-06-15 세션)

| # | 확정 |
|---|------|
| 범위 | **CORE 4** — earn route · DailyCheckIn · SpinTicketStrip · MissionChecklist |
| defer | RewardWalletCard → wallet micro · ReferralQuickCard → 7-viral-referral |
| DAYS/MISSIONS | EarnPage 내부 + t() 직접 (useMemo ❌) |
| SpinTicketStrip | **earn.spin.title** 신규 · earn.wheel.title 분리 |
| LiveActivityFeed | **earn.feed.* 6키** · empty state ❌ · full feed → 7-fomo |
| MissionChecklist | §10 6레인 · A+B full · C~F preview |
| 광고 | **영상/설문 미션 0** (operator LOCK) |

### 7-earn-hub-i18n LOCK v1.2 FINAL (operator GO · EXECUTE · 2026-06-15)

> **§E v26 GREEN** (2026-06-15) — 4-check 전부 통과 · LOCK v1.2 EXECUTE 완료.

**Scope (CORE 4):** `routes/earn.tsx` · `DailyCheckIn` · `SpinTicketStrip` · `MissionChecklist`  
**Defer:** `RewardWalletCard` 14 ko → `7-earn-wallet-card-i18n` · `ReferralQuickCard` 11 ko → `7-viral-referral`  
**부수효과:** `home.tsx` — `MissionItem` 시그니처 동기화 · `adWatch` 제거

**Catalog 실측 (GREEN):** 534 → **574** (+40) ko=en · `earn.*` **40** · `mission.*` **23** (신규 namespace)

**4-check (GREEN):**
1. CORE 4 `[가-힣]` = **0**
2. `earn.*` = **40** (ko=en)
3. `mission.*` = **23** (ko=en)
4. operator LOCK rg = **0** (`광고` · `adWatch` · `watchAd` · `rewarded` 없음)

**UI:** MissionChecklist **6 세로 섹션** · A daily 2 + B growth 4 full · C~F preview 각 1 locked · `lane: MissionLane`

**NEXT:** `7-fomo-components` — operator GO 대기 (viral route/mission defer 유지)

**§E v26 GREEN (baked):**
```text
7-earn-hub-i18n GREEN (v1.2 · 6레인 리팩터 + operator LOCK)
· CORE 4 ko=0 · earn.* 40 · mission.* 23 · catalog 534→574 ko=en
· MissionChecklist 6 세로 섹션 · operator LOCK rg=0
· 부수: home.tsx MissionItem + adWatch 제거
· defer: RewardWalletCard 14 ko · ReferralQuickCard 11 ko
· vitest 356/356 · Phase 6 회귀 PASS
```

**PHONARA:** handoff bake 완료 · paste/ZIP 전 **코드 0줄**

### 7-earn-missions-route LOCK v0 FINAL+ (§E v26-micro · SEO · 2026-06-15)

> **§E v26-micro GREEN** — §E v26 자산 보존 · 4-check 전부 통과 · vitest **356/356**.

**라우트:** `/earn` 홈 루프 · `/earn/missions` MissionChecklist 6레인 only  
**파일:** `earn.tsx` (layout) · `earn.index.tsx` · `earn.missions.tsx` · sticky **Link** segment  
**i18n:** `earn.tab.*` + `earn.missions.head.*` +4 · catalog **574→578** · `earn.*` **40→44** · `mission.*` **23** 무변

**§E v26-micro GREEN (baked):**
```text
7-earn-missions-route GREEN (LOCK v0 · §E v26-micro · SEO 분리)
· routes: earn layout + earn.index + earn.missions · sticky Link segment
· earn.tab.* + earn.missions.head.* +4 · earn.* 40→44 · mission.* 23 unchanged
· /earn 홈 루프 · /earn/missions MissionChecklist 6레인 only
· operator LOCK rg=0 · CORE+routes ko=0 · vitest 356/356
```

**NEXT:** §E v27 ✅ → viral defer · `7-fomo-components`

### 7-viral-referral-card-i18n LOCK v0 FINAL (§E v27 partial · 2026-06-15)

> **§E v27 GREEN** (2026-06-15) — ReferralQuickCard ko=0 · vitest **356/356** · 4-check 전부 통과.

**Scope:** `ReferralQuickCard.tsx` i18n only  
**Catalog 실측:** **578→587** (+9) ko=en · `referral.*` namespace **16** (이번 슬라이스 +9) · `earn.*` **44** · `mission.*` **23** 무변

**§E v27 GREEN (baked):**
```text
7-viral-referral-card-i18n GREEN (LOCK v0 · §E v27 · card only)
· ReferralQuickCard ko=0 · @/i18n import 1 · referral.* +9 (namespace total 16)
· earn.* 44 · mission.* 23 unchanged · catalog 578→587 ko=en
· defer: /referral route · mission.viral 2행 → 다음 micro
· operator LOCK rg=0 · vitest 356/356
```

**NEXT:** `7-viral-referral-route` 또는 `7-viral-mission-expand` — operator GO 대기 · 이후 `7-fomo-components`

**PHONARA:** handoff bake 완료 · paste/ZIP 전 **코드 0줄**

---

---

### 7-fomo-wheel-i18n LOCK v0 FINAL (§E v28 partial · 2026-06-15)

> **§E v28 GREEN** — 5-check ✅ · vitest **356/356** · WheelOfFortune ko=0.

**Scope:** `WheelOfFortune.tsx` · `fomo.wheel.*` +7  
**Catalog:** **577 → 584** keys ko=en · `fomo.*` **10→17** · earn **44** · mission **23** · referral **16** 무변

**§E v28 GREEN (baked):**
```text
7-fomo-wheel-i18n GREEN (LOCK v0 · §E v28 partial · WheelOfFortune only)
· WheelOfFortune ko=0 · @/i18n import 1 · fomo.wheel.* +7 · fomo.* 10→17
· earn.* 44 · mission.* 23 · referral.* 16 unchanged
· catalog ko=en=584 · operator LOCK rg=0 · vitest 356/356
· defer: streak · leaderboard · tier · unmounted fomo · viral route/mission
```

**NEXT:** `7-fomo-leaderboard-i18n` — Leaderboard + LiveActivityFeed defaults

**PHONARA:** handoff bake 완료 · **코드 0줄**

### 7-fomo-streak-i18n LOCK v0 FINAL (§E v29 partial · 2026-06-15)

> **§E v29 GREEN** — 6-check ✅ · vitest **356/356** · StreakRing ko=0.

**Scope:** `StreakRing.tsx` · `fomo.streak.aria.daysActive` +1 · `fomo.streak.dayN` 재사용  
**Catalog:** **584 → 585** keys ko=en · `fomo.*` **17→18** · earn **44** · mission **23** · referral **16** 무변

**§E v29 GREEN (baked):**
```text
7-fomo-streak-i18n GREEN (LOCK v0 · §E v29 partial · StreakRing only)
· StreakRing ko=0 · @/i18n import 1 · fomo.streak.* +1 (3 total) · fomo.* 17→18
· earn.* 44 · mission.* 23 · referral.* 16 unchanged
· catalog ko=en=585 · operator LOCK rg=0 · vitest 356/356
· defer: leaderboard · tier · unmounted fomo · viral route/mission
```

**NEXT:** `7-fomo-leaderboard-i18n`

**PHONARA:** handoff bake 완료 · **코드 0줄**

### 7-fomo-leaderboard-i18n LOCK v0 FINAL (§E v30 partial · 2026-06-15)

> **§E v30 GREEN** — 10-check ✅ · vitest **356/356** · Leaderboard · LiveActivityFeed ko=0.

**Scope (CORE 2):** `Leaderboard.tsx` empty defaults · `LiveActivityFeed.tsx` empty + notice badge  
**Scope 밖:** `routes/leaderboard.tsx` KR 3건 → route SEO/head i18n defer

**Catalog:** **585 → 589** keys ko=en · `fomo.*` **18→22** · earn **44** · mission **23** · referral **16** 무변

**§E v30 GREEN (baked):**
```text
7-fomo-leaderboard-i18n GREEN (LOCK v0 FINAL · §E v30 partial · Leaderboard+LiveActivityFeed)
· Leaderboard ko=0 · LiveActivityFeed ko=0 · @/i18n import 1/1
· fomo.leaderboard.* +2 · fomo.activity.* +2 (3 total) · fomo.* 18→22
· earn.* 44 · mission.* 23 · referral.* 16 unchanged
· catalog ko=en=589 · operator LOCK rg=0 · vitest 356/356
· defer: tier · unmounted fomo · route SEO/head i18n · viral route/mission
```

**PHONARA:** handoff bake 완료 · **코드 0줄**

### 7-fomo-tier-i18n LOCK v0 FINAL (§E v31 partial · 2026-06-15)

> **§E v31 GREEN** — 11-check ✅ · vitest **356/356** · CORE 3 ko=0 · **mounted fomo CLOSED**.

**Scope (CORE 3):** `BonusTier.tsx` · `LimitedDropCard.tsx` · `ReferralTree.tsx`  
**Catalog:** **589 → 592** keys ko=en · `fomo.*` **22→25** · earn **44** · mission **23** · referral **16** 무변

**§E v31 GREEN (baked):**
```text
7-fomo-tier-i18n GREEN (LOCK v0 FINAL · §E v31 partial · BonusTier+LimitedDropCard+ReferralTree)
· BonusTier ko=0 · LimitedDropCard ko=0 · ReferralTree ko=0 · @/i18n import 1/1/1
· fomo.tier.* 2→3 (rank 재사용) · fomo.limited.* +1 · fomo.tree.* +1 · fomo.* 22→25
· earn.* 44 · mission.* 23 · referral.* 16 unchanged
· catalog ko=en=592 · operator LOCK rg=0 · vitest 356/356
· mounted fomo 전체 i18n ✅
· defer: unmounted fomo · route SEO/head i18n · viral route/mission
```

**NEXT:** unmounted fomo micro · route SEO/head · `7-tier-progression` (§E v34)

**PHONARA:** handoff bake 완료 · **코드 0줄**

### 7-route-seo-head-i18n LOCK v0 FINAL (§E v32 partial · 2026-06-15 · GREEN)

> **§E v32 GREEN** — head() ko=0/0/0 · `@/i18n` 1/1/1 · `seo.*` 3/3 · ad pattern 0 · vitest **356/356**.

**Scope (CORE 3 · head() only):** `leaderboard.tsx` · `referral.tsx` · `games.index.tsx`  
**Scope 밖 (defer):** games 본문 17 → `7-games-body-i18n` · referral 본문 7 → `7-referral-body-i18n` · title/og:title → `7-seo-title-i18n`

**Catalog:** 실측 pre-v32 **602** (+10 handoff drift) → **605** keys ko=en · `seo.*` **0→3** · earn **44** · mission **23** · referral **16** · fomo **25** 무변

**+3 keys:** `seo.leaderboard.description` · `seo.referral.description` · `seo.games.description`

**§E v32 GREEN (baked):**
```text
7-route-seo-head-i18n GREEN (LOCK v0 FINAL · §E v32 partial · 3 routes · head() only)
· head ko=0/0/0 · @/i18n 1/1/1 · seo.* 3/3
· earn 44 · mission 23 · referral 16 · fomo 25 unchanged · ad pattern 0
· catalog ko=en=605 (pre-v32 실측 602 +3)
```

**NEXT:** `7-games-body-i18n` 또는 `7-referral-body-i18n`

**PHONARA:** handoff bake v49 완료 · **코드 0줄**

### 7-phase7-closeout-i18n LOCK v0.1 FINAL (§E v33 MEGA · 2026-06-15 · GREEN)

> **§E v33 MEGA GREEN** — 14 files · 1-shot + resume · mounted funnel 표면 **CLOSED** · vitest **356/356**.

**Scope (4 묶음):** body 3 (games.index · referral · RewardWalletCard) · unmounted fomo 3 · head sweep 12 · __root boundary  
**Pre-GO:** risk.tsx · root 4줄/3키 · wallet callers=0 · v32 desc 3/3 · baseline 605  
**Mid-execute:** catalog dedup (games.title collision) · bulk ko=en post **687** → final **802/791**

**G7 strict carry ✅:** earn 44 + wallet 14 · referral 16 + demo 6 · fomo 37 · mission 23  
**G6 (v50 reporting):** line-count ko 802 / en 791 — **false alarm** · TRUE PARITY **678 keys** (key-count strict)

**§E v33 GREEN (baked):**
```text
7-phase7-closeout-i18n GREEN (LOCK v0.1 · §E v33 MEGA · 14 files)
· mounted funnel 표면 CLOSED · vitest 356/356
· G6 reporting bug: line-count ≠ key-count · true parity 678/678
```

**PHONARA:** handoff bake v52 · G6 key-strict · **코드 0줄**

### 7-phase7-defer-closeout LOCK v0.3 (§E v34 MEGA · GREEN · 2026-06-15)

> **§E v34 MEGA GREEN** — P0 G6 hotfix + 8 files · Phase 7 defer body **CLOSED** · vitest **356/356**.

**Scope (8 files · +110 keys):**
- **A Legal (4):** terms · privacy · risk · about → `legal.*` **56**
- **B (2):** account · settings → `account.*` **20** · `settings.*` **31**
- **C (2):** trade (`trade.order.*` +2 · trade.* total **19**) · games.$gameId (`games.*` total **17**)
- **❌ D DROP:** BonusTier · LimitedDropCard · LiveActivityFeed · WheelOfFortune (KR=0)

**Catalog:** 678 → **788** · G6 `scripts/i18n-parity.sh` KO=788 EN=788 DIFF=0

**G7 carry:** v33 namespace NO-TOUCH (earn 58 · referral 22 · fomo 37 · mission 23 · seo 33)

**§E v34 GREEN (baked v52):**
```text
7-phase7-defer-closeout GREEN (LOCK v0.3 · §E v34 MEGA · 8 files)
· legal/account/settings/trade/games detail ko=0 · G6 KO=788 EN=788 DIFF=0
· Phase 7 defer body CLOSED · defer: viral · tier v35 · Phase 8 NEXT
PHONARA bake v52 완료
```

**PHONARA:** handoff bake v52 · **코드 0줄**

### 7-viral-referral · 7-fomo · 7-tier-progression (LOCK v0 · §E v27–v35)

> **7-fomo mounted micro** (§E v28–v31) **CLOSED** — wheel · streak · leaderboard · tier. Defer: unmounted · route SEO · viral · tier-progression.

| ID | 범위 | §E | North Star bar |
|----|------|-----|----------------|
| **7-viral-referral-card-i18n** | `ReferralQuickCard` i18n | **v27 ✅** | 바이럴 카드 `/earn` 홈 |
| **7-viral-referral-route** (defer) | `/referral` · SEO meta | — | 딥링크·공유 |
| **7-viral-mission-expand** (defer) | `mission.viral.*` 2행 | — | §10 C 레인 확장 |
| **7-fomo-wheel-i18n** | `WheelOfFortune` i18n | **v28 ✅** | `/earn` 룰렛 FOMO |
| **7-fomo-streak-i18n** | StreakRing | **v29 ✅** | `/earn` streak ring |
| **7-fomo-leaderboard-i18n** | Leaderboard · LiveActivityFeed | **v30 ✅** | 랭킹 · 활동 피드 |
| **7-fomo-tier-i18n** | BonusTier · LimitedDropCard · ReferralTree | **v31 ✅** | referral · games FOMO |
| **7-fomo-unmounted** | DailyBox · EarlyAccess · RewardPromise | **v33 ✅** | §E v33 MEGA에 포함 |
| **7-route-seo-head-i18n** | 3 routes head() desc | **v32 ✅** | SEO description |
| **7-phase7-closeout-i18n** | MEGA 14 files | **v33 ✅** | mounted funnel 표면 |
| **7-phase7-defer-closeout** | defer 8 + G6 hotfix | **v34 ✅** | Phase 7 body defer **CLOSED** |
| **7-tier-progression** | tier 혜택·진행 UI | **v35** | Stake tier 체감 |

**Phase 7 CLOSE 조건:** 4슬라이스 §E GREEN · catalog N=N · Phase 6 회귀 · defer 유지.

---

### Phase 8 — 사용자 페이지 **32면** (4×8 cluster · SEO/mission bar mandatory)

> **품질 바:** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) §**4.5** — Stake/Rollbit/Binance/Bybit **압살급** SEO+미션. **매 슬라이스 LOCK footer**에 SEO bar + Mission bar 복붙.

- Stake-clone style **32 imported route pages** (`Imported*Page` + wrapper ≤30 LOC)
- **1 cluster/턴** (8면 · ~30min · AI-safe mega slice)
- Trade · Wallet(Deposit default) · Ledger · Staking · Games catalog · FAQ · Support · PWA …
- **URL paste 정합:** `/ledger` `/staking` flat (PHONARA `PRESENTATION_IMPORT.md` 정본)
- 게이트: 32/32 export · JSX `[가-힣]` 0 · G6 key-strict · vitest **356/356**

**4 cluster map:**

| Cluster | 8 surfaces |
|---------|--------------|
| **P8-1** ✅ | Trade · Wallet · Ledger · Staking · GamesCatalog · FAQ · Support · PWAInstall |
| **P8-2** ✅ | Landing · Home · Earn · Dashboard · Login · Signup · ResetPassword · More |
| **P8-3** ✅ | Account · Settings · Referral · About · Terms · Privacy · RG · ShareRound |
| **P8-4** ✅ | GamesHistory · Fairness · Tournaments · Casino · Leaderboard · Notifications · WalletWithdraw · WalletDeposit |

### §P8-1 LOCK v0.1 FINAL (Phase 8 cluster 1 of 4 · EXECUTE · 2026-06-15)

> **§P8-1 FINAL EXECUTE** — operator GO 확정 · P3 baseline paste → G10 근거.

**Scope (8 surfaces · flat URL):**

| # | Component | URL | Status | i18n |
|---|-----------|-----|--------|------|
| 1 | `ImportedTradePage` | `/trade` | refactor (body only · **trade.* +0**) | carry |
| 2 | `ImportedWalletPage` | `/wallet` | refactor (Deposit default · L17 KR) | `wallet.*` +deposit |
| 3 | `ImportedLedgerPage` | `/ledger` | new/stub refactor | `wallet.ledger.*` |
| 4 | `ImportedStakingPage` | `/staking` | new/stub refactor | `wallet.staking.*` |
| 5 | `ImportedGamesCatalogPage` | `/games` | refactor | `games.catalog.*` +3 |
| 6 | `ImportedFAQPage` | `/faq` | new | `faq.*` |
| 7 | `ImportedSupportChatPage` | `/support` | new | `support.*` · **G+ FAB import** |
| 8 | `ImportedPWAInstallPage` | `/install` | new | `pwa.install.*` |

**Contract:** page `src/components/pages/Imported*.tsx` · route body ≤30 LOC · `*.meta.ts` co-locate · 16-file G3 KR=0

**i18n:** +~80 · catalog **788→~868** · seo 12키 · `trade.*` +0 기대

**G1–G12 + G+:** SupportChatFab/AccountSheet import diff 가시 · P3 baseline in plan.md/CHANGELOG

**Operator GO (baked):**

```text
§P8-1 LOCK v0.1 GO · EXECUTE · ledger=/ledger · staking=/staking · §E v35=tier defer · SEO/mission §4.5
```

**§P8-1 GREEN template:**

```text
§P8-1 GREEN (LOCK v0.1 FINAL · 8 surfaces · catalog N/N)
· G1-G12+G+ · vitest 356/356
PHONARA bake v55 부탁드립니다.
```

**PHONARA:** handoff bake v55 완료 · **코드 0줄** · ZIP 전 paste 금지

### §P8-1 LOCK v0.1 FINAL GREEN (Phase 8 cluster 1 of 4 · 2026-06-15)

> **§P8-1 GREEN** — 8 Imported*Page · route body 13 LOC × 8 · vitest **356/356** · G1–G12+G+ ALL GREEN.

**Catalog:** 788 → **862** (+74) · G6 KO=862 EN=862 DIFF=0 · DUP=0/0

**Gates:** G1 body=13 LOC × 8 ✓ · G3 16-file KR=0 ✓ · G6 OK ✓ · G7 ns match ✓ · G9 vitest 356/356 ✓ · G10 carry DIFF=0 ✓ · G12 export dry exit 0 ✓ · **G+** SupportChatFab import L5 + render L51 ✓

**i18n delta:** `trade.*` +0 (body extract) · `games.catalog` +3 · `wallet.*` +18 · `seo.*` +12 · new `faq`=15 · `support`=12 · `pwa`=14

**§P8-1 GREEN (baked v55):**
```text
§P8-1 LOCK v0.1 GREEN — Phase 8 cluster 1 of 4 완료
· catalog ko=en=862 (+74) · G1-G12+G+ · vitest 356/356
· trade.* +0 · games.catalog +3 · wallet.* +18 · seo.* +12
PHONARA bake v55 완료
```

**NEXT:** **§P8-2** LOCK (Landing · Home · Earn · Dashboard · Login · Signup · ResetPassword · More)

**PHONARA:** handoff bake v55 완료 · **코드 0줄**

### §P8-2 LOCK v0.1 FINAL (Phase 8 cluster 2 of 4 · EXECUTE · 2026-06-15)

> **§P8-2 FINAL EXECUTE** — operator GO 확정 · P3 baseline captured → G10 근거.

**Operator GO (baked):**
```text
§P8-2 LOCK v0.1 GO · EXECUTE · SEO/mission §4.5 · earn/mission/fomo carry NO-TOUCH
```

**Scope (8 surfaces · flat URL):**

| # | Component | URL | Start LOC | Shell | i18n |
|---|-----------|-----|----------:|-------|------|
| 1 | `ImportedLandingPage` | `/` | **519** | AppShell `bare` | `landing.*` +0 · `seo.root.*` |
| 2 | `ImportedHomePage` | `/home` | 222 | AppShell | `home.*` +0 |
| 3 | `ImportedEarnPage` | `/earn` | 77 | AppShell · **Outlet** | `earn.*` +0 |
| 4 | `ImportedDashboardPage` | `/dashboard` | NEW | AppShell display-only | `dashboard.*` +16 |
| 5 | `ImportedLoginPage` | `/login` | NEW | no AppShell · LoginModal | `auth.login.*` +11 |
| 6 | `ImportedSignupPage` | `/signup` | NEW | no AppShell | `auth.signup.*` +9 |
| 7 | `ImportedResetPasswordPage` | `/reset-password` | NEW | no AppShell | `auth.reset.*` +7 |
| 8 | `ImportedMorePage` | `/more` | NEW | AppShell | `more.*` +14 |

**Contract:** page `Imported*.tsx` · route body ≤30 LOC · inline `head()` (Landing 초과 시 `index.meta.ts`) · G4 `@/i18n` 8 route+8 page · G3 16-file KR=0

**P3 baseline (captured):**
```text
legal 56 · account 20 · settings 31 · fomo 38 · earn 56 · referral 26 · mission 23 · seo 47
trade 50 · games 86 · wallet 31 · faq 15 · support 12 · pwa 14 · landing 26 · home 8
dashboard 0 · more 0 · auth 0 · catalog KO=862 EN=862 DIFF=0
```

**i18n:** +71 → catalog **933** · `seo.*` +14 (new routes) · `auth.*` +27 · `dashboard.*` +16 · `more.*` +14 · carry +0

**G1–G12 + G+:** LoginModal import · Supabase/RPC 0 in 3 auth pages · Earn `<Outlet />` preserved

**§P8-2 GREEN template:**
```text
§P8-2 GREEN (LOCK v0.1 · 8 surfaces · catalog 862/933)
· G1–G12 + G+ · vitest 356/356
· seo.* +14 (new) · auth.* +27 · dashboard.* +16 · more.* +14
· earn/mission/referral/fomo/landing/home +0
PHONARA bake v56 부탁드립니다.
```

**PHONARA:** handoff v56 baked (EXECUTE sync) · **코드 0줄** · ZIP 전 paste 금지

### §P8-2 LOCK v0.1 GREEN (Phase 8 cluster 2 of 4 · 2026-06-15)

> **§P8-2 GREEN** — 8 Imported*Page · route body **13 LOC × 8** · vitest **356/356** · G1–G12+G+ ALL GREEN.

**Catalog:** 862 → **935** (+73) · G6 KO=935 EN=935 DIFF=0 · DUP=0/0

**Gates:** G1 13 LOC×8 ✓ · G3 16-file KR=0 ✓ · G4 16/16 ✓ · G6 935/935 ✓ · G9 vitest 356/356 ✓ · G10 carry DIFF=0 ✓ · G12 dry exit 0 ✓ · **G+** LoginModal import · Supabase/RPC=0 (3 auth) ✓

**i18n delta:** `seo.*` +14 (new) · `auth.*` +27 · `dashboard.*` +16 · `more.*` +16 · carry `landing/home/earn/mission/referral/fomo` +0 (extract-only)

**§P8-2 GREEN (baked v56):**
```text
§P8-2 GREEN (LOCK v0.1 · 8 surfaces · catalog 862/935)
· G1–G12 + G+ · vitest 356/356
· seo.* +14 · auth.* +27 · dashboard.* +16 · more.* +16
· landing/home/earn/mission/referral/fomo +0
PHONARA bake v56 완료
```

**NEXT:** **§P8-3** (Account · Settings · Referral · About · Terms · Privacy · RG · ShareRound)

**PHONARA:** handoff bake v56 완료 · **코드 0줄**

### §P8-3 LOCK v0.1 GREEN (Phase 8 cluster 3 of 4 · 2026-06-15)

> **§P8-3 GREEN** — 8 Imported*Page · route body **14 LOC × 8** · vitest **356/356** · G1–G12+G+ ALL GREEN · **24/32면**.

**Catalog:** 935 → **949** (+14) · G6 KO=949 EN=949 DIFF=0

**Gates:** G1 body=14×8 ✓ · G2 8 exports ✓ · G3 16-file KR=0 ✓ · G4 16/16 ✓ · G9 vitest 356/356 ✓ · G12 dry exit 0 ✓ · **G+** display-5면 Supabase/RPC=0 · hook-3면 no NEW Supabase ✓

**i18n delta:** `legal/account/settings/referral` +0 (carry) · `share.*` +12 (new ns) · `seo.*` +2 (`seo.shareRound.*` incremental)

**URL 정합:** `/risk` → **`/responsible-gaming`** (route file + URL · SiteFooter · ImportedMorePage)

**§P8-3 GREEN (baked v57):**
```text
§P8-3 GREEN (LOCK v0.1 · 8 surfaces · catalog 935/949 · DIFF=0)
· G1–G12 + G+ · vitest 356/356
· legal/account/settings/referral +0 · share.* +12 · seo.* +2
· /risk → /responsible-gaming
PHONARA bake v57 완료
```

**PHONARA:** handoff v58 baked (EXECUTE sync) · **코드 0줄**

### §P8-4 LOCK v0.1 GREEN (Phase 8 cluster 4/4 · 2026-06-15 · **32/32 COMPLETE**)

> **§P8-4 GREEN** — Phase 8 **CLOSE** · 8 Imported*Page · route body **14 LOC × 8** · vitest **356/356** · G1–G12+G+ ALL GREEN.

**Catalog:** 949 → **982** (+33) · G6 KO=982 EN=982 DIFF=0 · DUP=0/0

**Gates:** G1 14×8 ✓ · G2 8 exports ✓ · G3 16-file KR=0 ✓ · G4 16/16 ✓ · G9 356/356 ✓ · G12 exit 0 ✓ · **G+** all 8 display-only · Supabase/RPC=0 · pipeline=0 · `src/games/` import=0 ✓

**i18n delta:** `games/trade` +0 · `wallet.*` +0 (P8-1 carry · deposit/withdraw thin) · `casino.*` +5 (`casino.landing.*`) · `notifications.*` +10 · `games.*` +4 (`games.history.*`) · `leaderboard.*` +0 · `seo.*` +14 · 8th `/wallet/deposit`

**§P8-4 GREEN (baked v58):**
```text
§P8-4 GREEN (LOCK v0.1 · 8 surfaces · catalog 949/982 · DIFF=0 · DUP=0) · Phase 8 32/32 COMPLETE
· games/trade +0 · wallet.* +0 · casino.* +5 · notifications.* +10 · games.* +4 · seo.* +14
PHONARA bake v58 완료
```

### Lovable hotfix — casino routing ✅ GREEN (2026-06-15)

> `/casino/<game>` 마운트 복구 · `casino.tsx` Outlet · `casino.index.tsx` · catalog **982** 유지 · i18n +0 · vitest **356/356**

**NEXT:** **Phase 10** (i18n sweep · QA · FINAL UPGRADE · `export:phonara` ZIP)

**PHONARA:** handoff bake v59 완료 · **코드 0줄** · ZIP 전 paste 금지

### §P9 Admin LOCK v0.1 GREEN (Phase 9 · 2026-06-15)

> **§P9 Admin GREEN** — 8 ImportedAdmin*Page · `ImportedAdminShell` · catalog **982→1053** · vitest **356/356** · G1–G12+G+ ALL GREEN.

**Catalog:** 982 → **1053** (+71) · G6 KO=1053 EN=1053 DIFF=0 · DUP=0/0

**Gates:** G1 layout 1 + surface 8 body≤30 ✓ · G2 8 page + 1 shell ✓ · G3 17-file KR=0 ✓ · G4 17/17 ✓ · G9 356/356 ✓ · G12 exit 0 (user+admin ZIP) ✓ · **G+** display-only · Supabase/RPC=0 · nav admin=0 · bare `settings.*` 신규=0 ✓

**i18n delta:** `admin.*` +71 (`admin.nav.*` 재사용 5 + 신규 3 · `admin.settings.*` 포함) · `seo.admin*.*` +8 · 그 외 carry **+0**

**산출:**
- 라우트 9: `admin.tsx` (Outlet) + `admin.index.tsx` + 7 surface
- 페이지 8: `ImportedAdmin{Overview,Alerts,Queues,Audit,Operations,Mfa,Users,Settings}Page`
- shell 1: `components/admin/ImportedAdminShell.tsx`
- 패키징: `scripts/export-phonara-admin.mjs` · `.lovableignore` admin 제외 · `dist-phonara-admin-package.zip` (**51 KB**)

**Admin 리빌드:** 구 `apps/admin` UI/UX 전량 Lovable 정본 · paste는 Phase 10 ZIP 후 · 엔진 `domain/`·`hooks/`·RPC NO-TOUCH

**§P9 Admin GREEN (baked v59):**
```text
Phase 9 Admin GREEN (LOCK v0.1 · 8 surfaces · catalog 982/1053 · DIFF=0 · DUP=0)
admin.* +71 · seo.admin*.* +8 · ImportedAdminShell OK · dist-phonara-admin-package.zip OK (51 KB)
PHONARA bake v59 완료
```

### Phase 9 — Admin **8면** (✅ GREEN · reference)

> **Operator 확정:** 기존 PHONARA `apps/admin` UI/UX **전량 Lovable 리빌드** · 엔진만 유지.

**8면:** Overview · Alerts · Queues · Audit · Operations · MFA · Users+Roles · Settings+FeatureFlags

### Phase 10 — ✅ GREEN (FINAL · verify-only · ZIP · 2026-06-15)

> **§Phase 10 GREEN** — Lovable Zenith **CLOSE** · catalog **1053/1053** · vitest **356/356** · G1–G12+G+ ALL GREEN.

**Catalog:** **1053/1053** 동결 · G6 KO=1053 EN=1053 DIFF=0 · DUP=0 · G7 Lovable ns **+0**

**Gates:** G1 carry Δ=0 ✓ · G3 KR new=0 ✓ · G9 356/356 ✓ · G12 user **103 KB** + admin **51 KB** dry+real ✓ · **G+** nav admin=0 · user ZIP admin=0 · admin ZIP 8+1+9 ✓

**ZIP:**
- `dist-phonara-package.zip` **103 KB** (user 32/32)
- `dist-phonara-admin-package.zip` **51 KB** (admin 8/8)

**defer (post-paste E2E · P8 NO-TOUCH):** 13 carry — `lib/{useCountUp,confetti}` · `trade/*` 9 · `routes/casino.{hilo,limbo}`

**§Phase 10 GREEN (baked v60):**
```text
Phase 10 GREEN · catalog 1053/1053 · user ZIP 103 KB · admin ZIP 51 KB · defer 13 carry
@phonara/i18n merge = ZIP paste 슬라이스 · PHONARA bake v60 완료
```

**NEXT:** **PHONARA ZIP paste** (`apps/web` + `apps/admin` · adapter · `@phonara/i18n` · `check:full` · E2E)

**paste 메모:** MFA `/admin/mfa` → `/mfa/enroll` + `/mfa/challenge` · `/responsible-gaming` · casino Outlet layout

---

## 4. 병행 백로그 (매크로와 독립)

| ID | 내용 |
|----|------|
| **4.5-i18n** | BetConfirm `{lines}` · `secondaryLabel` 하드코드 · mint/gold |
| **4.5-shortkey** | MintReels `?` → rules (gold ✅) |
| **2.5** | Pixi nebula — **DEFER / MANUAL** |
| **e2e** | crash/plinko/limbo WRITTEN → CI PASS · `casino-game-back` smoke 3 spec |
| **chunk/60fps** | MANUAL |

---

## 5. 권장 실행 순서

```
✅ 게임 10 + Auto P1 + 5-A + 5-core + 5-B-shell + 5-C-density + 5-D-overflow
✅ handedness-persist GREEN
✅ 5-macro-tier-i18n GREEN
✅ 5-macro-footer-banner GREEN · Phase 5 macro **closed** (Dashboard defer)
✅ 6-ds-overlay-errorstate · 6-ds-toast-token SKIP · 6-ds-ring-offset GREEN
✅ Phase 6 CLOSE (5슬라이스)
✅ **7-earn-hub-i18n §E v26 GREEN** (LOCK v1.2 · catalog **574**)
✅ **7-earn-missions-route §E v26-micro GREEN** (LOCK v0 · catalog **578** · `/earn/missions`)
✅ **7-viral-referral-card-i18n §E v27 GREEN** (LOCK v0 · catalog **587** · `referral.*` **16**)
✅ **7-fomo-wheel-i18n §E v28 GREEN** (LOCK v0 · catalog **584** keys · `fomo.*` **17**)
✅ **7-fomo-streak-i18n §E v29 GREEN** (LOCK v0 · catalog **585** keys · `fomo.*` **18**)
✅ **7-fomo-leaderboard-i18n §E v30 GREEN** (LOCK v0 FINAL · catalog **589** keys · `fomo.*` **22**)
✅ **7-fomo-tier-i18n §E v31 GREEN** (LOCK v0 FINAL · catalog **592** keys · `fomo.*` **25** · mounted fomo **CLOSED**)
✅ **7-route-seo-head-i18n §E v32 GREEN** (catalog **605** · head desc only)
✅ **7-phase7-closeout-i18n §E v33 MEGA GREEN** (mounted funnel CLOSED)
✅ **G6 reporting bug cleared** (keys 678/678 · Phase 8 blocker cleared)
✅ **7-phase7-defer-closeout §E v34 GREEN** (LOCK v0.3 · catalog **678→788**)
✅ **§P8-1 LOCK v0.1 FINAL GREEN** (8 surfaces · catalog **788→862** · G+)
✅ **§P8-2 LOCK v0.1 GREEN** (8 surfaces · catalog **862→935** · G+ · Earn Outlet)
✅ **§P8-3 LOCK v0.1 GREEN** (8 surfaces · catalog **935→949** · `/responsible-gaming`)
✅ **§P8-4 LOCK v0.1 GREEN** (8 surfaces · catalog **949→982** · Phase 8 **32/32 COMPLETE**)
✅ **casino-routing-hotfix GREEN** (`casino.tsx` Outlet · `/casino/<game>` mount fix)
✅ **§P9 Admin LOCK v0.1 GREEN** (8 surfaces · catalog **982→1053** · admin ZIP **51 KB**)
✅ **Phase 10 GREEN** (verify-only · catalog **1053** · user ZIP **103 KB** · admin ZIP **51 KB**)
✅ **Phase 11-B GREEN** (표시 품질 sweep · catalog **1053→1059** · user ZIP **100.7 KB** · admin ZIP **50.6 KB**)
✅ **Phase 11-C GREEN** (PWA Supremacy · catalog **1059→1075** · user ZIP **~101.2 KB** · admin ZIP **~51.2 KB** · route +0)
⏳ **Phase 12-A~E** (Product Depth · [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md))
⏳ **Phase 12-Z PRODUCT FINAL** → **PHONARA paste 1회**
```

**PHONARA Cursor:** **11-C ✅ v65 baked** · **Phase 12 NEXT** · paste는 **12-Z GREEN 후**

### Phase 11-C · PWA Supremacy (✅ GREEN · 2026-06-15)

> **§Phase 11-C GREEN** — route +0 · `/install` 기존 route head 갱신 · catalog **1059→1075** · vitest **356/356** · handoff **v65 baked**.

**Catalog:** 1059 → **1075** (+16 `pwa.*`) · G6 KO=1075 EN=1075 DIFF=0 · DUP=0

**Gates:** G1 carry 32+8 본문 Δ=0 ✓ · G9 356/356 ✓ · G12 user **~101.2 KB** (103609 B) + admin **~51.2 KB** (52395 B) dry+real ✓

**G+ PWA:** shortcuts **4** · categories ✓ · screenshots **4** (form_factor/type/sizes/label) · offline.html ✓ · OfflineIndicator ✓ · PwaInstallBanner ✓ · InstallPromptProvider 단일 캡처 ✓ · SW=0 ✓

**G+ SEO:** `/install` JSON-LD WebApplication + BreadcrumbList · leaf **7** routes + root inline · sitemap **41** public (admin/mfa=0)

**§Phase 11-C GREEN (baked v65):**
```text
Phase 11-C GREEN · catalog 1059→1075 · pwa.* +16 · ZIP 101.2+51.2 KB · route +0
InstallPromptProvider 1파일 · preventDefault ✓ · manifest start_url/scope/display 불변
PHONARA bake v65 완료 · paste = 12-Z 후 · Phase 12 NEXT
```

**paste adapter (11-C):** LS key 통일 · offline.html copy · PwaShell↔PwaInstallBanner merge · og 절대 URL

**NEXT:** **Phase 12** — 권장 **12-E 총판 Hub** → 12-B → 12-A → 12-C → 12-D → **12-Z**

### Phase 12 · Product Depth (operator 확정 · NEXT)

> **paste 게이트 = 12-Z** · Phase 10 CLOSE ≠ 제품 완성 · Lovable에서 압살급 UI 후 Cursor 1회 paste.

**정본:** [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md)

| ID | 슬라이스 | 압살 bar |
|----|----------|----------|
| 11-C | PWA Supremacy | ✅ GREEN |
| 12-A | Games World-Class | Stake/Rollbit 연출 · `src/games/**` |
| 12-B | Missions 6-Lane Full | ✅ GREEN · North Star §10 · C~F full |
| 12-C | Home Hub | ⏳ NEXT · Earn first · FOMO · tier §E v35 |
| 12-D | Trade Surface Pro | Binance/Bybit display grammar (MVP) |
| 12-E | Partner / 총판 Hub | ✅ GREEN · affiliate mock · `/referral`+`/partner` |
| 12-F | Admin Affiliate Ops | 선택 · defer OK |
| 12-Z | PRODUCT FINAL | verify · ZIP · **paste OK** |

**총판:** PHONARA Supabase affiliate 엔진 ✅ · Lovable UI ✅ (12-E GREEN) → **12-C NEXT**

### Phase 11-C LOCK reference (archive · EXECUTE 완료)

> LOCK v0.1 FINAL · InstallPromptProvider · SW=0 · 실측: route +0 · sitemap 41 · catalog +16 `pwa.*`

### Phase 11-B · 표시 품질 sweep (✅ GREEN · archive)

> **§Phase 11-B GREEN** — route +0 · catalog **1053→1059** · vitest **356/356** · G1–G12+G+ ALL GREEN · handoff **v61 baked**.

**Catalog:** 1053 → **1059** (+6 `state.*`) · G6 KO=1059 EN=1059 DIFF=0 · DUP=0 · G3 KR new=0 (`seo.earn.description` 단어 1건 교체)

**Gates:** G1 carry 본문 Δ=0 ✓ · G9 356/356 ✓ · G12 user **100.7 KB** (103076 B) + admin **50.6 KB** (51862 B) dry+real ✓

**G+ SEO:** JSON-LD 6 leaf + root inline · robots.txt ✓ · sitemap **41 public** (admin/mfa/reset-password=0) · OG×4 ✓

**G+ a11y:** h-dvh 4/4 (games 제외) · icon-only aria-label 100% · `<main>`=1 ✓

**G+ PWA:** manifest icons 4 (maskable 1) · SW=0 · vite-plugin-pwa 미설치 ✓

**G+ shell:** `shell/EmptyState` · `shell/LoadingShell` · ui/ErrorState 신규=0 · ui/ 신규 `@/i18n`=0 (P6 grandfathered 2건만)

**ZIP:**
- `dist-phonara-package.zip` **100.7 KB** (103076 B · user 32/32)
- `dist-phonara-admin-package.zip` **50.6 KB** (51862 B · admin 8/8)

**§Phase 11-B GREEN (baked v61):**
```text
Phase 11-B GREEN · catalog 1053→1059 · user ZIP 100.7 KB · admin ZIP 50.6 KB · route +0
state.* +6 · SEO JSON-LD≥7 · sitemap 41 public · OG×4 · shell state 2종 · PWA manifest 기초
PHONARA bake v61 완료 · paste adapter memo baked · 11-C / paste 보류
```

**paste adapter memo:** og:image/twitter:image 절대 URL 치환 · `icon-192`→`pwa-192x192` · `icon-512`→`pwa-512x512` · maskable→`pwa-512x512` purpose

**defer 유지:** 13 carry KR · 4.5-i18n · scrim/toast/shortkey/Pixi 2.5 · MFA 2-route split

**NEXT:** **Phase 11-C PWA Supremacy** (offline · `/install` · shortcuts · install banner · Lovable 전담)

### Phase 11-B LOCK reference (EXECUTE 완료 · archive)

| 트랙 | 산출 | Gate |
|------|------|------|
| A SEO | JSON-LD≥7 · robots.txt · sitemap(public) · OG×4 | G+ SEO |
| B a11y | h-dvh 4 · aria-label 100% · main 1 | G+ a11y |
| C shell | EmptyState · LoadingShell · state.* +~8 | G+ shell-only · no-dup |
| D PWA 기초 | manifest icons 4 · maskable · SW=0 | G+ PWA |

**NO-TOUCH:** games/** · carry 본문 · admin 8/8 · engine · Supabase  
**Next:** 11-C PWA Supremacy (offline · /install · shortcuts · install banner)

---

## 6. PHONARA vs Lovable 경계

| 항목 | Lovable | PHONARA |
|------|---------|---------|
| `src/games/**` | 구현 정본 | paste 전 placeholder |
| `src/routes/casino.*.tsx` | preview only · ZIP **drop** | 없음 |
| `src/components/shell/**` | 구현 → ZIP 포함 | Phase 10 paste |
| `packages/*` · `supabase/*` | **no-touch** | 엔진 정본 |
| **`apps/admin` UI/UX** | **Lovable 100% 리빌드 정본** (`ImportedAdmin*` · `ImportedAdminShell`) | paste 전 **구 admin 시각 전량 throwaway** · `domain/`·`hooks/`·`lib/rpc` **엔진 유지** |
| `dist-phonara-admin-package.zip` | admin 자산만 | `apps/admin` paste (Phase 10 ZIP 후) |

---

*LOVABLE_ZENITH_ROADMAP · v1 · 2026-06-15*
