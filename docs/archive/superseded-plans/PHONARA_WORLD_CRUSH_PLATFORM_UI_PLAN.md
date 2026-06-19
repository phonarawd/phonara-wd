# PHONARA · World Crush Platform UI Plan (세계 지존급 1위 · 끝판왕)

> **목적:** operator 감사(2026-06-17) — 홈 난잡 · Trade 미분리 · FOMO bar 미달 — 을 **Lovable 큐 슬라이스**로 고정.  
> **상위:** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) §4.6 · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4  
> **갱신:** 2026-06-17 · G-WC1~3 ✅ · L1-24 ✅ §GREEN · **HEAD L1-20** · ZIP defer  
> **트랙:** **L1 · Lovable canvas only** · PHONARA paste/ZIP **전** · 엔진/RPC **0**

---

## 0. North Star bar (non-negotiable)

```text
첫 3초 = 「부업·부수입 FOMO 터짐」 + 「지금 1탭이면 벌 것 같음」
```

| # | 체감 목표 | FAIL |
|---|-----------|------|
| W0 | **Earn-first** funnel — Home/Casino = 넓은 touch · reward pulse | generic 대시보드 · CTA 동급 남발 |
| W1 | **단일 above-fold story** — hero 1개 · next action 1탭 | 티어+휠+랭킹+미션+추천 동시 경쟁 |
| W2 | **Trade-last** — Spot \| Futures \| Staking **명시 분리** | 무기한 터미널 1면만 |
| W3 | **FOMO grammar** — live ticker · countdown · limited slot **motion+계층** | 위젯 나열 · bounce 남발 |
| W4 | **World Crush** — Stake/Rollbit/Binance/토스 동시 이김 feel | MVP · 템플릿 · shadcn default |

**한 줄:** 엔진은 준비됐고, **보이는 IA·밀도·FOMO hierarchy**가 아직 §GREEN 전.

---

## 1. Gap audit (operator · canvas 스크린샷)

| surface | 현재 | 목표 |
|---------|------|------|
| **Home `/`** | 스크롤 위젯 과다 · CTA 다중 · 「3초 돈」 스토리 약함 | 1차 탭 + 2차 서브탭 · hero 1 · earn lane 선명 |
| **Trade `/trade`** | BTC/USDT **무기한 1면** only | **Spot \| Futures \| Staking** 세그먼트 (Binance/Bybit grammar) |
| **Earn `/earn`** | Home과 미션 중복 feel | Home 탭과 역할 분리 · deep link OK |
| **Casino/Games** | 개별 게임 OK · 플랫폼 통합 FOMO 약 | live wins · recent · jackpot rhythm Home과 연결 |
| **Staking** | PHONARA `/staking` 엔진 route · canvas Trade 미통합 | Trade 세그먼트 3 또는 Earn bridge + 동일 토큰 |

**PHONARA repo:** `apps/web` presentation-import = placeholder · **Lovable canvas가 SOT** · paste는 L1-16~18 §GREEN 후 ZIP.

---

## 2. 큐 위치 (순차 · 1 head)

```text
… L1-15 Admin wave (P0→J ✅ · UX-Plain EXECUTE 중)
  → L1-16 Home IA + FOMO hierarchy
  → L1-16b Home density hotfix
  → L1-16c Stake-lobby restructure (Earn-killer fold)
  → L1-17 Trade Spot|Futures|Staking split
  → L1-18 FOMO motion V2 (platform-wide rhythm) ✅
  → operator 「Lovable 100%」판단
  → operator 「ZIP 발행 GO」1회
  → L2 paste Wave-1 (+ Admin Wave-Admin)
  → [optional L1 Wave-2] Earn Killer Missions (§9 · ZIP 후 또는 operator GO)
```

**FAIL =** L1-16~18 skip 후 ZIP · 병렬 2슬라이스 · engine invent · **L1-16c skip 후 L1-17 금지**

**Earn Killer Missions (§9):** G-WC1~3 완료 후 **별도 operator GO** — ZIP gate와 **병렬 슬라이스 금지** (S1) · **1 head**

---

## 3. 슬라이스 정의

### L1-16 · Home IA + FOMO hierarchy

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | `/` Home — **1차 탭 4~5** · 탭 내부 **2차 서브탭** · above-fold **hero 1 + primary CTA 1** · 나머지 fold-down |
| **Routes** | `/` · 기존 `/earn` deep link 유지 |
| **1차 탭 (고정안)** | **오늘 벌기** · **미션** · **랭킹** · **친구초대** · (optional) **라이브** |
| **2차 예** | 미션 → 출석 / 휠 / 시즌 · 랭킹 → 주간 / VIP |
| **FOMO** | live win ticker · limited slot · countdown — **hero 아래 1 lane** · 동급 CTA 금지 |
| **i18n** | `home.tab.*` · `home.subtab.*` · `home.hero.*` append · ko=en DIFF=0 |
| **NO-TOUCH** | 12-C scaffold 삭제 0 · hook/RPC 0 · FROZEN games |
| **Visual ref** | Stake home urgency · Toss mission clarity · TikTok streak rhythm |
| **LOCK (예정)** | [`LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md) v0.1 DRAFT |
| **§GREEN** | vitest carry · 9b-H 60s: 탭만 보고 「다음 벌 돈 행동」1개 말하기 |

---

### L1-16b · Home density hotfix

| 항목 | 내용 |
|------|------|
| **Scope** | WalletSnapshot · tier→rank/vip · hideAssets · fold0 tier ladder off |
| **Status** | ✅ §GREEN vitest · **presentation superseded by L1-16c** |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16B_HOME_DENSITY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16B_HOME_DENSITY_LOCK.md) |

---

### L1-16c · Stake-lobby restructure (Earn-killer fold)

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | `/home` — stake.com **primitives only** (sidebar · wallet strip · horizontal rows) · earn-first casino lobby · overflow-x 0 |
| **Routes** | `/home` only · 5-tab shell unchanged |
| **Fold0** | CompactWalletStrip · hero+CTA1 · EarnPowerRow 5 · marquee · TierChip |
| **Below fold** | CategoryRow Casino/Games/Trade · stake식 row scroll |
| **NO-TOUCH** | `/trade` · admin · rpc · 16b/12-C files delete 0 |
| **Visual ref** | stake.com layout · Toss · TikTok streak |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md) v0.1 **✅ §GREEN** · vitest **540/544** · catalog **2591** |
| **§GREEN** | 9b-Hc PC+mobile · no page horizontal scroll · sidebar/drawer · CTA=1 |

---

### L1-16d · CategoryRow poster cards

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | `HomeCategoryRow` text gradient → **poster img** · 16 `.asset.json` (10+6) · visual layer only |
| **Assets** | 기존 10 game posters + 신규 tournaments/fairness/spot/staking/tier/sports |
| **NO-TOUCH** | i18n · fold0 · SideNav · WalletStrip · EarnPowerRow · `/trade` |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16D_HOME_POSTER_CARDS_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16D_HOME_POSTER_CARDS_LOCK.md) **✅ §GREEN** · 16 posters |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md) **✅ §GREEN** |

---

### L1-16f · Casino game detail desktop (stake layout) — **~~CANCELLED~~**

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | 10× `/casino/*` desktop — SlimTitleBar + full-width surface + 4 tabs · mobile/engine NO-TOUCH |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md) · **~~CANCELLED~~** operator 2026-06-18 · EXECUTE **0** |
| **§GREEN** | **n/a** — 슬라이스 제외 · 현행 desktop layout 유지 |

---

### L1-16i · Games QA sweep (test-only)

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | Fix 4 auto.wiring fails · 10/10 auto tests · crash timer · result parity · e2e 4 games · **prod 0-touch** |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16I_GAMES_QA_SWEEP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16I_GAMES_QA_SWEEP_LOCK.md) **✅ §GREEN** · 572/572 · e2e 10/10 specs |
| **§GREEN** | vitest **572/572** · e2e specs 10/10 · PW CI defer |

---

### L1-16j · Casino route dedup

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | ~~`/casino` → ImportedCasinoPage · `/casino/games` catalog~~ |
| **상태** | **CANCELLED** · superseded by **L1-16l** (catalog route deleted · single `/casino` SOT) |

---

### L1-16l · Dead code & dedup sweep

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | Sidebar Games dup · routes −6 · orphans −8 · SideNav delete · **no feature add** |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md) **✅ §GREEN** |
| **§GREEN** | vitest **572/572** · sidebar **5** · `/casino` · `/games` · `/games/crash` redirect OK |

---

### L1-16k · Global sidebar unify

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | AppShell `SideNav` → `HomeSideNav` global · `hideSideNav` /home · SideNav @deprecated |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16K_GLOBAL_SIDEBAR_UNIFY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16K_GLOBAL_SIDEBAR_UNIFY_LOCK.md) **✅ §GREEN** |
| **§GREEN** | 572/572 · `/casino` etc new 6-item nav · `/home` no duplicate |

---

### L1-16h · Game posters + live player counts (v0.2)

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | `/games` → **GameCard** (poster+live+RTP) · `/casino`+catalog **seed bump** ~79k · `useLiveCount` NO-TOUCH |
| **Files** | ImportedGamesCatalogPage · HotGamesRow · ImportedCasinoPage |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16H_GAMES_CATALOG_POSTERS_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16H_GAMES_CATALOG_POSTERS_LOCK.md) **✅ §GREEN v0.2** |
| **§GREEN** | both surfaces tick · seeds table · DIFF=0 · useLiveCount tests green |

---

### L1-16g · MobileGameFrame bet collapse + fullscreen

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | MobileGameFrame — bet collapse (`data-bet`) + fullscreen · wrapper CSS · engines NO-TOUCH |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-16G_MOBILE_GAME_FRAME_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16G_MOBILE_GAME_FRAME_LOCK.md) **✅ §GREEN** · 3/3 tests |
| **§GREEN** | vitest +3 · mobile preview collapse/fs · desktop 0 · +4 i18n |

---

### L1-17 · Trade Spot \| Futures \| Staking split

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | `/trade` — 상단 **Market mode segment** Spot \| Futures \| Staking · 모드별 panel swap · **display-only** until L2 wire |
| **Routes** | `/trade` default Spot or last mode · optional `/trade/futures` `/trade/staking` query/sync |
| **Spot panel** | PHON/USDT · buy/sell · tabular nums · Binance spot density |
| **Futures panel** | carry 12-D v0.2 depth · perp label · funding display-only |
| **Staking panel** | pool cards · APR display · stake CTA toast-only · or Earn `/earn` bridge tab |
| **i18n** | reuse `trade.spot` · `trade.futures` · `staking.*` bridge keys |
| **NO-TOUCH** | OrderBook engine · rpc · packages/* |
| **Visual ref** | Binance trade · Bybit perps · internal 12-D components |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-17_TRADE_SPLIT_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-17_TRADE_SPLIT_LOCK.md) v0.2 **✅ §GREEN** · vitest 577/577 |
| **§GREEN** | 9b-T: 3 modes 전환 · Korean 0 en mode · synthetic book label 유지 |

---

### L1-18 · FOMO motion V2 (platform rhythm)

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | Home · Casino hub · Trade header — **win pulse · countdown tick · tier unlock** micro-motion · reduced-motion respect |
| **Scope** | motion tokens only · **120–320ms** meaning motion · bounce spam 0 |
| **Surfaces** | Home hero · live ticker · casino recent wins · trade urgency banner |
| **NO-TOUCH** | Crash FROZEN md5 · game core timing |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-18_FOMO_MOTION_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-18_FOMO_MOTION_LOCK.md) **v0.2 dedup ✅ §GREEN** · vitest 580/580 |
| **§GREEN** | no console · vitest carry · World Crush bar self-check |

---

### L1-24 · Stake-equivalent typography (operator 1번 GO)

| 항목 | 내용 |
|------|------|
| **Scope 1줄** | pass 1 global CSS **✅** · Pass 1.1 D2+D3 **✅** · D1 `line-height` **held** · KO=2620 |
| **LOCK** | [`LOVABLE_WORLD_CRUSH_L1-24_STAKE_TYPOGRAPHY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-24_STAKE_TYPOGRAPHY_LOCK.md) **v0.2 + Pass 1.1 ✅ §GREEN** |
| **§GREEN** | Sofia/Inter/Archivo 0 · vitest 580 carry · 9b-TY manual 1440+390 |

---

### L1-19 · (optional defer) Shell density pass

| 항목 | 내용 |
|------|------|
| **Scope** | Sidebar nav grouping · mobile bottom dock · Earn/Casino/Trade **funnel density** token pass |
| **When** | L1-16~18 §GREEN 후 operator GO 시만 |

---

## 9. Earn Killer Missions · 시그니처 초간단 미션 (operator backlog · 2026-06-17)

> **North Star 한 줄:** 「0의 에너지」+ **전 국민 실시간 경쟁** + **친구 서열(FOMO)** — 캐시슬라이드·돈이돼지 DNA를 PHONARA Earn-first에 이식.  
> **트랙 분리:** **L1** = Home/Earn **presentation mock** (tap · counter · ranking · toast) · **L3** = 원장·잭팟·순위 SOT (operator Engine GO 후).

### 9.0 전략 요약

| # | 콘셉트 | 한 줄 | PHONARA fit | L1 mock | L3 engine | 우선순위 |
|---|--------|------|-------------|---------|-----------|----------|
| **K1** | **0.1초 타임어택 · 황금 지구** | 전 유저가 하나의 거대 타깃을 같이 탭 · N번째 터치 잭팟 | Home hero **시그니처** | ★★★★★ | 집계·잭팟·봇 | **1순위** |
| **K3** | **7시 선착순 생존 신고** | 매일 7:00 [나 일어남] · 순위별 보상 · 친구 그룹 랭킹 | Home/Earn **리텐션 앵커** | ★★★★★ | 타임스탬프·순위·봇 | **2순위 (K1 짝)** |
| **K2** | **홈 위젯 · 다이내믹 펫** | 방치 guilt · 터치 적립 · 스토리 공유 · 캐릭터 진화 | PWA+ / 네이티브 | ★★☆☆☆ | 펫 state | **defer (Phase 2)** |
| **K4** | **클립보드/스크린샷 줍줍** | 복사·캡처 감지 → 자동 적립 | 웹 **비추** | ★☆☆☆☆ | OS 권한·프라이버시 | **defer · 웹 축소안만** |

**시그니처 1차 추천:** **K1 황금 지구** → **K3 아침 생존 신고** (하루 종일 탭 + 아침 1회 습관).

**Presentation 규칙 (L1):** scripted live counter · FOMO countdown · toast-only reward · i18n key only · **보장 수익·100% 보장·확정 당첨·근거 없는 live 카운트 copy 허용** (presentation string props · engine/RPC/ledger mutation 0).

---

### K1 · 전 국민 「황금 지구 / 디지털 저금통」 탭 (돈이돼지 업그레이드)

| 항목 | 내용 |
|------|------|
| **UX** | Home 메인 거대 **황금 지구** 또는 **디지털 저금통** · 탭 1회 = 1~2원 **연출** (display string) |
| **FOMO** | 전 국민 누적 터치 live 카운터 (라이브 속보 UI) · 「9,990만… 10만 남음!」 잭팟 임박 알림 · N번째 터치 잭팟 연출 (예: 100만 원 **예시**) |
| **소셜** | 「내 손가락 한 번에 대박」 — milestone countdown · L1-18 `fomo-tick` / pulse 재사용 |
| **Surface** | `/home` fold0 hero 또는 **오늘 벌기** 탭 primary · EarnPowerRow와 **역할 분리** (hero 1 유지) |
| **L1 scope** | tap handler → toast · `useScriptedCounter` bump · jackpot modal mock · **rpc 0** |
| **L3 defer** | `rpc_tap_contribute` · milestone ledger · anti-bot · conservation · KYC/이벤트 규정 |
| **Visual ref** | 돈이돼지 · Stake live ticker · TikTok urgency |
| **큐 ID (예정)** | **L1-20** · LOCK `LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md` |

---

### K2 · 다이내믹 아일랜드 & 홈 위젯 펫 (캐시슬라이드 업그레이드)

| 항목 | 내용 |
|------|------|
| **UX** | 귀여운 **수익 캐릭터** · 방치 시 배고픔/눈물 · 매일 터치 → 진화 · **재산 레벨** |
| **바이럴** | 인스타 스토리 공유 템플릿 (캐릭터 카드 · 레벨 brag) |
| **제약** | **순수 웹/PWA:** 잠금화면·백그라운드 터치 **불가** · iOS Dynamic Island = **네이티브 shell** |
| **L1 scope (축소)** | 앱 **내** Home pet card · PWA install CTA · in-app touch → toast · evolution UI mock |
| **L3 defer** | pet state persistence · share deep link · widget extension |
| **큐 ID (예정)** | **L1-22** · **defer** — K1/K3 §GREEN + (선택) 네이티브 roadmap 후 |

---

### K3 · 전 국민 출석 전쟁 · 「선착순 생존 신고」

| 항목 | 내용 |
|------|------|
| **UX** | 매일 **07:00** [나 일어남] 버튼 1개 · 7:00:00에 가까울수록 보상 tier 연출 (1등 10만·1000등 1,000원·이후 5원 **예시**) |
| **FOMO** | **친구 랭킹 그룹** · 실시간 등수 · 「너 오늘 몇 등?」 · 아침 카톡/스토리 viral |
| **Surface** | Home **미션** 서브탭 또는 `/earn` deep link · push 알림 hook (PWA 11-C) |
| **L1 scope** | countdown to 07:00 · mock group leaderboard · button → toast · **rpc 0** |
| **L3 defer** | server timestamp rank · group RPC · bot farm · prize pool ledger |
| **Partner tie-in** | referral tree · depth-2 그룹 = 12-E agent grammar |
| **큐 ID (예정)** | **L1-21** · LOCK `LOVABLE_WORLD_CRUSH_L1-21_SURVIVAL_CHECKIN_LOCK.md` |

---

### K4 · 클립보드 / 스크린샷 「줍줍」

| 항목 | 내용 |
|------|------|
| **UX (원안)** | 복사·스크린샷 **백그라운드 감지** → [5원 줍기] 팝업 |
| **웹 현실** | 브라우저 **스크린샷 감지 불가** · 클립보드 = 권한+제스처 · 백그라운드 = **네이티브** |
| **L1 축소안** | 앱 **내** 「링크 붙여넣기 → 포인트」 · 「오늘의 캡처 업로드」1탭 미션 |
| **리스크** | 프라이버시 · 「아무것도 안 해도 돈」 기대치 폭주 · **1순위 비추** |
| **큐 ID (예정)** | **L1-23** · **defer** — K4-web 축소안만 operator GO 시 |

---

### 9.1 큐 배치 (G-ZIP 이후 · operator GO)

```text
G-ZIP ✅ (또는 parallel non-blocking)
  → operator 「L1-20 EXECUTE GO」 — K1 황금 지구 (시그니처)
  → operator 「L1-21 EXECUTE GO」 — K3 생존 신고
  → ~~L1-16f~~ CANCELLED (operator 2026-06-18)
  → L1-19 shell density (optional)
  → L1-22 pet / L1-23 clipboard (defer)
  → L3 Earn Engine Wave (operator 「Earn Killer Engine GO」)
```

**FAIL =** K1~K4를 한 LOCK에 merge · real money jackpot without L3 · clipboard background on web without scope amend

---

### 9.2 i18n · conversion 톤 (공통)

| key prefix (예정) | 용도 |
|-------------------|------|
| `earn.goldenEarth.*` | K1 tap · counter · jackpot |
| `earn.survival.*` | K3 button · rank · group |
| `earn.pet.*` | K2 (defer) |
| `earn.pickup.*` | K4 축소안 (defer) |

**금지:** JSX 한국어 literal (i18n key 필수) · **engine/RPC/ledger를 우회하는 실제 지급 mutation**. **허용:** 「100% 보장 수익」·「전 국민 live」·unbacked 카운트·가짜 마감·scripted social proof (presentation copy).

---

## 4. 기존 Phase 12와 관계

| 완료 슬라이스 | World Crush에서 |
|--------------|-----------------|
| **12-C Home scaffold** | **L1-16이 supersede** (삭제 아님 · IA re-layer) |
| **12-C v0.3 FOMO/tier** | **L1-16/18에 흡수** — 위젯 flat dump → tab hierarchy · **§9 K1/K3가 Earn hero 확장** |
| **12-D Trade depth v0.2** | **L1-17 Futures 탭**에 embed · 단일 route 확장 |
| **12-A Casino strip** | Home 「라이브」탭 또는 Casino hub link · motion L1-18 |

**FAIL =** 12-C/12-D 재EXECUTE from scratch · md5 FROZEN touch

---

## 5. 게이트 · ZIP

| 게이트 | 조건 |
|--------|------|
| G-WC1 | L1-16 §GREEN | **✅** |
| **G-WC2** | L1-17 §GREEN | **✅** |
| **G-WC3** | L1-18 §GREEN | **✅** |
| **G-ZIP** | G-WC1~3 + Admin L1-15-UX-Plain §GREEN + operator 「ZIP 발행 GO」 | **⏳ HEAD** |

**ZIP에 World Crush 미포함 = FAIL** (operator 「Lovable 100%」 거짓)

---

## 6. PHONARA paste (L2 · 참고)

| Lovable 산출 | paste 시 |
|-------------|----------|
| `components/home/*` tab shell | `presentation-import` · `@phonara/i18n` merge |
| `components/trade/*` mode segment | `/trade` route · engine spot/futures/staking wire **별 슬라이스 L2** |
| motion CSS vars | `theme.css` / presentation tokens |

---

## 7. operator 다음 액션

1. ~~**L1-15-UX-Plain** §GREEN~~ ✅ (2026-06-17)
2. ~~**`L1-16 LOCK plan--create`**~~ ✅ v0.1 DRAFT — operator REVIEW → EXECUTE GO
3. EXECUTE GO 순: **16 → 17 → 18** (1 head)
4. §GREEN evidence → 「ZIP 발행 GO」
5. **§9 Earn Killer Missions** — operator GO 후 L1-20~21 LOCK plan (K1·K3 우선)
6. ~~**L1-10-W-T** Wallet tone~~ ✅ §GREEN
7. ~~**L1-24** Stake typography~~ ✅ §GREEN
8. **L1-20** K1 황금 지구 LOCK draft (HEAD)

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | 초판 — operator 홈/Trade gap · L1-16~18 큐 등록 |
| 2026-06-17 | G-WC1~3 §GREEN · **§9 Earn Killer Missions** backlog (K1~K4) · L1-20~23 큐 예약 |
| 2026-06-17 | **L1-10-W-T** §GREEN — wallet navy+mint SOT · violet hex 0 |
| 2026-06-17 | **L1-24 Pass 1.1** §GREEN — D2 test lock · KO=2620 EN=2620 · D1 held |

---

*Lovable canvas · sequential contract §3.1.4 정본 · LOCK 파일은 EXECUTE GO 시 생성*
