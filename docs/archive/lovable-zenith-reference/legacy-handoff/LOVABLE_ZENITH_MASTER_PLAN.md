# PHONARA Lovable — 지구상 끝판왕 지존급 UI/UX 마스터 플랜 (Cursor 연동용)

> **사용법:** 이 파일 **전체** + **`docs/LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` 전체**를 Lovable AI 새 채팅에 붙여넣기.  
> **목표:** PHONARA 엔진·RPC·원장 **0% 건드리고**, User + Admin **모든 UI/UX**를 Lovable에서 **1000% 완성** → 코드베이스 ZIP 다운로드 → PHONARA Cursor가 **paste만**.  
> **제품 퍼널:** 부업/부수입 홍보 → Earn(바이럴·출석·미션) → Wallet(코인 입금 주력) → Games → Trade(현물·선물) → Staking — Stake/Rollbit급 등급·메뉴·FOMO.  
> **완료 후:** `docs/LOVABLE_WORKSPACE_DUMP_REQUEST.md`로 전수 덤프 → Cursor GO/NO-GO.

**비교 범위 (품질 bar):** Stake · Rollbit · Hyperliquid · Binance · Bybit — **모바일 OS급 60fps·렉 0** + **PC 프로 트레이딩/카지노 워크스테이션**.

**PHONARA 참조 (읽기 전용 — Lovable에서 구현 금지):** 엔진 10게임, RPC, `packages/*`, `supabase/*`, hooks, auth, money 정산.

---

## §0. Lovable AI 역할 · 절대 규칙 (위반 = 작업 중단)

### 0.1 네가 만드는 것 (100%)

| 포함 | 제외 (PHONARA/Cursor) |
|------|------------------------|
| User 앱 **모든** 화면·탭·셸·모달·토스트·상태(loading/empty/error) | Supabase · `rpc_*` · RLS · migrations |
| Admin 앱 **모든** 운영 UI | `hooks/use-wallet.ts` 등 engine hooks **로직** |
| 10게임 **지존급** Stage/HUD/Controls + A–G | 클라 RNG/HMAC **결과 산출** |
| Earn(부업)·미션·등급·이벤트·공지·리더보드 UI | JS `number`로 잔액·배당·PnL **재계산** |
| i18n catalog ko/en **전수** | `routeTree.gen.ts` PHONARA용 수정 |
| vitest + e2e + checkpoint + export ZIP | Lovable Cloud · OAuth · 결제 백엔드 |

### 0.2 절대 금지 (RED — 1건이라도 있으면 export 금지)

```
❌ @supabase/* · createClient · rpc_* · fetch to PHONARA backend from game components
❌ Math.random() for bet/settlement outcomes (Stage decorative jitter only — seed-based preferred)
❌ parseFloat on money paths
❌ casino-submit-bet testid (정답: casino-place-bet)
❌ hyphen gameCode in props (mint-reels ❌ → mint_reels ✅)
❌ slot selection { turbo } in RPC JSON (turbo = UI local state only)
❌ roulette types: street, corner, line (엔진 미지원 — dozen1/2/3 · column1/2/3 **지원**)
❌ roulette split value = sum (정답: lower adjacent, |a−b|===1)
❌ bet.result.grid dependency in slot Stage (엔진은 { totalMultiplier } only)
❌ blackjack payout from UI card sum
❌ default export (named export only)
❌ JSX 하드코딩 한국어 (t('key') only)
❌ Test / Debug / Demo / TODO / FIXME / Lovable / lorem in user-facing UI
❌ Earn rpc_spin_roulette UI ↔ casino roulette 혼용 (코드·i18n·metrics 분리)
❌ casino.toast.* · trade.toast.* i18n/catalog/토스트 본문에 이모티콘 (베팅·트레이딩 = 프로 톤, emoji 0)
❌ JSX/컴포넌트에서 토스트 이모티콘 하드코딩 (이모는 allowed-zone i18n catalog만)
❌ 게임 HUD에 GameRulesSheet 없음 · rules 카피 JSX 하드코딩 · casino.rules.{gameCode} step<4
❌ PHONARA GAMES-INTEGRATION.md / PRESENTATION_IMPORT.md overwrite (delta append only)
```

### 0.3 작업 방식 (오류 방지)

1. **아래 Phase 순서 엄수** — Phase N 게이트 green 전 Phase N+1 금지.  
2. **한 Phase = 한 PR 단위** — 섞지 말 것.  
3. **추측 금지** — 없으면 `MISSING` 표시 후 해당 Phase에서 구현.  
4. **route 파일 = 얇은 래퍼만** — 시각 코드는 `Imported*Page` / `Imported*Game` 컴포넌트.  
5. Phase 종료마다 **`bun qa`** + checkpoint + `.lovable/memory/{phase}-done.md` 기록.  
6. **Stage `bet.result` shape 변경 시** `src/games/preview/useMockPipeline.ts` `simulate()` **동 게임 분기 동시 수정** — red:grep은 mock 출력 비대상 (handoff §0 규칙 9).

---

## §1. 품질 bar — 모바일 OS급 + PC 지존급

### 1.1 모바일 (iPhone 14 Pro · Pixel 7 — Playwright 3 profile)

| 지표 | 목표 | 구현 원칙 |
|------|------|-----------|
| Frame | **60fps** p95, jank 0 | transform/opacity only; rAF batch |
| INP | **< 100ms** | primary CTA thumb zone 하단 35% |
| Touch | **≥ 44px**, primary **≥ 72px** | LongPressStepper → 키보드 0회 |
| Safe area | notch/home indicator | env(safe-area-inset-*) |
| Scroll | momentum, no layout shift | tabular nums on money |
| Memory | 10분 auto-bet heap 0 | cleanup on unmount |
| Reduced motion | **필수** | fade-only degrade |

### 1.2 PC (1440×900 Desktop Chrome)

| 지표 | 목표 | 구현 원칙 |
|------|------|-----------|
| Frame | p95 **< 8ms** (게임), **< 12ms** (Crash 연출) | Pixi/matter off main thread where possible |
| INP | **< 80ms** | hover preview, cursor glow |
| Trade | Hyperliquid/Binance급 **고밀도** | multi-panel, order book virtualized |
| Casino | Stake/Rollbit급 | grid-cols-[1fr_360px], ultra-wide 400px |
| Shortcut | Space · 1/2/5 · Esc · ? | 전 게임 + Trade |

### 1.3 공통 성능 (렉 없음 계약)

- per-game lazy chunk gzip **≤ 250KB**
- Lighthouse mobile **≥ 90**
- CLS **< 0.05** — skeleton = final layout shape
- 큰 테이블/히스토리 → `@tanstack/react-virtual`
- PF verify → Web Worker 우선 (UI freeze 금지)
- DPR cap **2.0**, GPU tier auto downgrade
- Realtime tick → batch update (no per-tick setState storm)

---

## §2. Frozen Contract — gameCode · selection · testid

### 2.1 gameCode (underscore) · URL (hyphen)

| gameCode | URL slug |
|----------|----------|
| crash … hilo | `/casino/{code}` |
| mint_reels | `/casino/mint-reels` |
| gold_rush | `/casino/gold-rush` |
| roulette | `/casino/roulette` |
| blackjack | `/casino/blackjack` |

### 2.2 selection (PHONARA engine 1:1)

```ts
// slots
{ lines: number }  // 1..20, turbo 금지

// blackjack
{ actions: Array<{ seat: number; move: 'hit'|'stand'|'double'|'split'|'insurance' }> }

// roulette
{ bets: Array<{ type: RouletteBetType; value: number|null; stakeWeight: number }> }
// split: value = lower pocket, wins if pocket===value || pocket===value+1, |a-b|===1 only
// stakeWeight: integer; chips "1"|"5"|"25"|"100"|"500"
// empty bets[] → primary CTA disabled
```

**defaultSelection (contractHelpers.ts = PHONARA game-config):**

```ts
mint_reels: { lines: 20 },
gold_rush:  { lines: 20 },
blackjack:  { actions: [{ seat: 0, move: 'stand' }] },
roulette:   { bets: [{ type: 'red', value: null, stakeWeight: 1 }] },
// + crash/dice/mines/plinko/limbo/hilo → docs/GAMES-INTEGRATION.md
```

### 2.3 Slot Stage — grid 규칙 (RED 방지)

- RPC/엔진 result: **`{ totalMultiplier }` only** — `result.grid` **사용 금지**.
- 스핀 연출 grid: **`seedToGrid(commitment.server_seed_hash, clientSeed)`** UI-only deterministic.
- settle 후: `totalMultiplier` + verification badge로 win tier만.

### 2.4 ImportedGameSurfaceProps (callback only)

```ts
// src/games/shared/types.ts — PHONARA merge 시 덮어쓰기 금지, additive only
onStakeChange, onSelectionChange, onPrepareRound,
onOpenBetConfirm,  // ← casino-place-bet 버튼
onSubmitBet, onCancelBetConfirm, onClientSeedChange, …
// Supabase/RPC import 0
```

### 2.5 Money E2E testid (Controls 필수 5 + adapter 4)

**Lovable Controls 책임:**

`casino-stake-input` · `casino-prepare-hash` · `casino-place-bet` · `casino-client-seed-input` · `casino-error` (DOM slot)

**Adapter(PHONARA) 소유 — Lovable preview mock attach OK:**

`casino-fairness-verifier` · `casino-bet-confirm` · `casino-bet-confirm-confirm` · `casino-bet-confirm-cancel`

### 2.6 게임 규칙 UI — **10종 전수 · 게임 페이지 필수**

**목표:** 초등학생도 이해할 수 있을 만큼 **친절·쉬운 말투**로, **예쁘고 자세하게** 각 게임 화면마다 규칙을 제공.  
(`/games/fairness` 전역 문서와 **별개** — **플레이 화면 안**에서 바로 읽을 수 있어야 함.)

#### UI (`src/games/shared/` + 각 게임 HUD)

| 컴포넌트 | 역할 |
|----------|------|
| **`GameRulesSheet`** | vaul/bottom-sheet · numbered steps · tip callouts · payout box · fairness CTA |
| **`GameRulesTrigger`** | HUD 우상단 `?` 또는 `이렇게 놀아요` (`casino.rules.common.cta`) — `data-testid="casino-game-rules"` |
| **`GameRulesSection`** (optional) | Desktop sidebar 360px 패널에 rules 요약 accordion |

**시각:** mint accent · step 번호 뱃지 · 짧은 일러스트/아이콘(장식) · reduced-motion → fade only  
**톤:** §5.4와 별도 — **게임 규칙은 이모티콘 OK**(문단당 0–1개, 과하지 않게). **베팅 토스트**와 혼동 금지.

#### i18n (JSX 한국어 0 — catalog only)

**키 패턴 (10종 × 동일 구조):**

```text
casino.rules.{gameCode}.title          # e.g. casino.rules.crash.title
casino.rules.{gameCode}.summary        # 한 줄 요약 (~초등학생)
casino.rules.{gameCode}.step1 … stepN  # 번호 단계 (N≥4 권장)
casino.rules.{gameCode}.tip1 … tipM    # 💡 친절 팁 (M≥2)
casino.rules.{gameCode}.payout         # 어떻게 이기는지 / 배수 설명 (엔진 재계산 금지)
casino.rules.{gameCode}.fairnessLink   # 공정성 시트로 연결 CTA
casino.rules.common.cta                # "이렇게 놀아요" (Lovable §8-A FINAL++ · Phase 10 @phonara/i18n sync)
casino.rules.common.close
```

`gameCode`: underscore — `mint_reels`, `gold_rush`, …

#### 한글 말투 (친절 · 쉬운 설명)

| DO | DON'T |
|----|-------|
| `~해요`, `~하면 돼요`, `먼저 ~해보세요` | `~함`, `~하여야 한다`, 카지노 전문 용어만 나열 |
| 한 문장 한 가지 | 3줄짜리 복문 |
| 숫자·배수는 **예시**로 (`예: 2.00배`) · **보장 수익 copy 허용** | RTP·하우스엣지 **UI 재계산** (payout 재계산 금지 · 보장 수익 copy는 허용) |
| 어려운 말 → 괄호 풀이 (`배수(몇 배로 불어나는지)`) | split/stakeWeight 등 **엔진 enum명** 그대로 노출 |

**en catalog:** 동일 구조·동일 친절 톤. English mode에 한글 0.

#### 게임별 필수 기재 항목 (엔진 계약과 1:1 — GAMES-INTEGRATION)

| gameCode | step에 반드시 포함 |
|----------|-------------------|
| **crash** | 배수가 올라감 → 터지기 전에 **캐시아웃** · **자동 캐시아웃** 설정 · 늦으면 0 |
| **plinko** | 공 떨어뜨림 · **버킷**마다 배수 다름 · 어디에 떨어질지는 공정 난수 |
| **mines** | **5×5** 칸 · 지뢰 개수 · 안전 칸 고르면 배수↑ · **언제든 그만두기(캐시아웃)** · 지뢰 밟으면 끝 |
| **limbo** | **목표 배수** 정하기 · 결과 배수가 목표 **이상**이면 승리 |
| **hilo** | 현재 카드보다 **높을지/낮을지** · 맞추면 연속(streak) · 틀리면 라운드 종료 |
| **dice** | 0–100 숫자 · **over/under** · 목표 숫자 설정 |
| **mint_reels** / **gold_rush** | **페이라인(lines)** · 스핀 · 같은 그림 줄 · **turbo는 빠른 연출만**(배당 변경 아님) |
| **blackjack** | 21에 가깝게 · **hit/stand/double/split** · 딜러 규칙(S17) · 블랙잭 설명 |
| **roulette** | **유럽식 0–36** · straight/split/red/black/even/odd/low/high/**dozen1–3/column1–3** · split은 **붙어 있는 두 숫자(lower value)** · street/corner/line **없음** · 칩은 정수 |

#### 각 Phase 게이트 (Phase 2–4)

- [ ] 해당 게임 HUD에 `GameRulesTrigger` + `GameRulesSheet` wired  
- [ ] `casino.rules.{gameCode}.step*` **≥4 keys** ko+en  
- [ ] `casino.rules.{gameCode}.tip*` **≥2 keys** ko+en  
- [ ] grep `[가-힣]` in `src/games/**/HUD.tsx` → 0 (rules copy in i18n only)  
- [ ] vitest: RulesSheet renders all step keys for gameCode  

**RED:** 게임 페이지에 규칙 UI 없음 · rules JSX 하드코딩 한국어 · 엔진과 다른 베팅 타입/규칙 설명.

---

## §3. 디자인 시스템 · 브랜드 (PHONARA UI Master)

**감정:** Elite · Fast · Intelligent · Precise · Rewarding · Premium · Trustworthy  
**금지:** Cute · generic SaaS · template · AI-slop marketing

**Visual:**

- Dark graphite surfaces · mint primary glow · sharp borders
- **Pretendard variable** · tabular nums on all money/odds/balance
- 4px spacing rhythm · comfortable(mobile) / compact(desktop trade)

**4 product axes (모든 Hub/Landing):**

1. **Earn** (부업·미션·보상)  
2. **Live Games**  
3. **Pro Trading**  
4. **Wallet & Trust**

**Funnel:** Earn first → Wallet → Casino → Trade last

---

## §4. PHASED BUILD — 반드시 순서대로 (게이트 통과 전 다음 Phase 금지)

---

### PHASE 0 — Foundation & QA Scaffold  
**목표:** 오류 없는 골격 + lint/typecheck/vitest/playwright 뼈대

**산출:**

```
src/games/shared/types.ts + contractHelpers.ts
src/games/__tests__/contractHelpers.ts
src/i18n/{ko,en}.ts + index.ts  (키 구조만, 내용은 Phase마다 추가)
src/styles.css  (design tokens: --game-*, --celebrate-*, thumb-zone, mint glow)
eslint games scope + no-restricted-imports (@supabase, rpc_*)
vitest.config + playwright 3 profiles (1440×900, iPhone14, Pixel7)
scripts/checkpoint-*.mjs (10 games) + export-phonara.mjs
docs/GAMES-INTEGRATION.delta.md + PRESENTATION_IMPORT.delta.md (append-only)
```

**게이트 (STOP until green):**

- [ ] `bun run typecheck` 0 error  
- [ ] grep RED rules §0.2 → 0 matches (except @ts-expect-error tests)  
- [ ] `contractHelpers` 10종 defaultSelection verified  

**[END PHASE 0]**

---

### PHASE 1 — Shared A–G + Game Infrastructure  
**목표:** 지존급 게임의 공통 엔진(연출만)

**산출 (`src/games/shared/`):**

| Folder | Minimum |
|--------|---------|
| **gfx/** | useGPUTier, pixi@8 setup, filters, context-lost recovery, Canvas2D fallback |
| **feel/** | screenShake, hitStop, timeDilation, juice |
| **presence/** | PresenceProvider + **mock adapter only** |
| **celebrate/** | 6 tiers micro→ultra, ultra ≤3s swipe dismiss |
| **theme/** | Default/Neon/Noir, localStorage, AccountSheet hook |
| **replay/** | deterministic replay + WebM 10s + html-to-image fallback |
| **mobile/** | useThumbZone, useHandedness, OneHandSheet(vaul), StickyBetBar, LongPressStepper, HapticButton ≥56pt |
| **visuals/** | GlowText, Confetti, ShockWave, Holo, Trail, Vignette, Bloom |
| **hooks/** | useSound(WebAudio, no howler), useHaptics, useGameLoop, useAutoBetQueue, useReducedMotionGuard |
| **root** | BetPanel, FairnessSheet, **GameRulesSheet**, **GameRulesTrigger**, RGGate, BetHistoryStrip (virtual scroll) |

**게이트:**

- [ ] A–G 각 폴더 ≥1 real export, vitest smoke  
- [ ] reduced-motion → celebrate/feel noop  
- [ ] `@supabase` in games/** → 0  

**[END PHASE 1]**

---

### PHASE 2 — Game 1: Crash (체크포인트 기준 게임)  
**목표:** Stake급 **Aurora Ascension** — 나머지 9종 품질 기준

**산출 (`src/games/crash/`):**

- Stage/HUD/Controls.shared/mobile/desktop/index.tsx  
- `ImportedCrashGame` named export  
- **GameRulesSheet** wired — `casino.rules.crash.*` ≥4 steps + ≥2 tips  
- Pixi nebula + glow curve, Presence ghost lines  
- 원샷 `{ autoCashout: string }`  
- vitest: Stage, HUD, Controls, reducedMotion, CrashGame.contract  
- e2e: `tests/e2e/games/crash.spec.ts` (3 viewport, axe 0, thumb zone)  
- checkpoint + `.lovable/memory/crash-checkpoint.md`

**게이트:**

- [ ] 60fps Crash Stage (manual or perf log)  
- [ ] **Game rules sheet** — step≥4 · tip≥2 · `casino-game-rules` testid  
- [ ] testid 5 + contract  
- [ ] chunk gzip ≤250KB  
- [ ] **Crash green → only then Phase 3**

**[END PHASE 2]**

---

### PHASE 3 — Games 2–6 (P1 originals)  
**순서:** Plinko → Mines → Limbo → HiLo → Dice

| game | Art direction |
|------|----------------|
| plinko | Cascade — matter-js + Pixi trail, long-press DROP |
| mines | Quantum Grid — 5×5 glass ≥56pt, revealedCells[] one-shot |
| limbo | Event Horizon — shader black hole |
| hilo | Cardstream — 50vw split, streak tiers 5/10/15 |
| dice | Probability Meridian — liquid magnetic bar |

**각 게임:** Phase 2와 동일 5-file + 5 tests + e2e + checkpoint + **GameRulesSheet per game**.

**게이트:** 5/5 games `bun qa` green · **5/5 rules i18n complete** (step≥4 each).

**[END PHASE 3]**

---

### PHASE 4 — Games 7–10 (ZIP-1 new)  
**순서:** Mint Reels → Gold Rush → Blackjack → Roulette

| game | Critical |
|------|----------|
| mint_reels / gold_rush | **seedToGrid only**, lines 1–20, turbo local |
| blackjack | actions **replace array**, preview cards OK, settle = totalMultiplier |
| roulette | split consecutive only, integer chips, empty bets disable |

**각 게임:** contract.test with split reject, integer stakeWeight, testid 5 + **rules sheet gate**.

**RED fix before export:**

- [ ] **No `result.grid`** in mint-reels/gold-rush Stage  
- [ ] **10/10** games have `casino.rules.{gameCode}.*` complete (step≥4 · tip≥2) — **Lovable §8-A ✅ GREEN 2026-06-15** (120 keys ko/en) · **PHONARA `@phonara/i18n` Phase 10 sync ⏳**

**[END PHASE 4]**

---

### PHASE 5 — App Shell + Menu + Tier Navigation (Stake/Rollbit IA)  
**목표:** 모바일 OS급 셸 + PC nav + **등급·메뉴 아키텍처** — `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` §2

**산출 (`src/components/shell/`):**

- AppShell, TopBar (**balance pill · notification bell · TierBadge**), **BottomNav 5탭** (Home · Earn · Games · Trade · Wallet)  
- SideNav (desktop), AccountSheet (balance, **tier progress snippet**, sound, haptic, theme, **handedness**, language, **FAQ · Support shortcuts**, RG, logout)  
- **MoreMenu** / `ImportedMorePage` overflow — Staking · Referral · Affiliate · Ledger · Announcements · Events · Leaderboard · Legal  
- SiteFooter, GlobalCountdownBanner (events)  
- **SupportChatFab** (floating, safe-area) — opens Support sheet/page  
- **Modal login** (auth surfaces)  
- **전부 i18n** — `shell.*`, `nav.*`, `tier.*`, JSX Korean 0

**Mobile:** safe-area, thumb-first, page transitions, Earn→Wallet→Games **NextActionBar** hooks  
**Desktop:** Dashboard 4-panel hub (Earn · Games · Trade · Wallet); Trade route **compact density**

**게이트:**

- [ ] BottomNav 5 routes work in preview  
- [ ] TierBadge visible TopBar + AccountSheet + Earn entry  
- [ ] AccountSheet theme + handedness persist localStorage  
- [ ] Support FAB + FAQ link from AccountSheet/More  
- [ ] grep Korean in shell → 0  

**[END PHASE 5]**

---

### PHASE 6 — Design System (`components/ui/` + welcome)

- shadcn/Radix **47+** components aligned to §3 tokens  
- Money display, AnimatedNumber, Ticker, DataTable, OrderBook shell, TradingChart shell  
- **`useAppToast` / Toaster** — `ToastSurface`: `default` | `casino` | `trade`; §5.4 이모티콘 존 (`LOVABLE_PRODUCT_PLATFORM_MANIFEST.md`)  
- `components/welcome/WelcomeSheet`  
- All states: loading skeleton, empty, error, success on primitives

**Toast 게이트:**

- [ ] `casino.toast.*` · `trade.toast.*` catalog — emoji **0**  
- [ ] `earn.toast.*` · `daily.*Toast` · `viral.toast.*` ko samples — cute emoji **1**/toast  
- [ ] vitest: trade/casino surface strips accidental emoji  

**[END PHASE 6]**

---

### PHASE 7 — Earn (부업) + 바이럴 미션 + FOMO + Tier + Events  
**목표:** 부업/부수입 퍼널 **완성** — `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` §1·§3·§6

**절대 금지:** 광고 시청 · 설문조사 · 앱 설치 미션 UI.

**`components/earn/` (each wired into ImportedEarnPage):**

- DailyCheckIn → `daily.*` (1/day quota UI)  
- MissionChecklist → **8× engine `mission.*`** + `onClaim(code)` callback  
- **ViralMissionCard** · **ShareToolkitSheet** · **MissionQuotaBadge** → `viral.*` (**횟수 제한 필수**: `used/max`, cooldown)  
- ReferralQuickCard · **AffiliateTree** → `referral.*`, `affiliate.*`  
- RewardWalletCard · **RewardPromisePreview** (Earn→Wallet CTA)  
- SpinTicketStrip → **Earn roulette only** (`roulette.spin` — NOT casino, 1/day)  
- LiveActivityFeed (scripted props OK)

**`components/fomo/`:**

- TierBadge, **TierProgress**, BonusTier → **`tier.*` i18n**  
- StreakRing, Leaderboard, LimitedDropCard, CountdownTimer  
- WheelOfFortune, DailyBox, EarlyAccessCodeInput, ReferralTree  
- MissionProgressBar, SlotMeter  

**Pages (named export):**

- `ImportedEarnPage` — daily + engine missions + viral tab + referral + spin  
- `ImportedViralMissionsPage` — `/earn/viral` (Share toolkit full page)  
- `ImportedAffiliatePage` — commission tree, tier snapshot props  
- `ImportedTierBenefitsPage` — `/tier` perk grid locked/unlocked  
- `ImportedLeaderboardPage`  
- `ImportedAnnouncementsPage` — 공지 목록/상세  
- `ImportedEventsPage` — 이벤트 + tier benefits  
- TopBar notification bell + unread badge (mock count OK)

**게이트:**

- [ ] Earn: daily + engine missions + **viral quota cards** + referral + spin  
- [ ] Every viral card shows **remaining/max** quota  
- [ ] grep `watch_ad|survey|설문|광고` in earn/** → 0  
- [ ] Tier UI: TopBar + AccountSheet + Earn + TierBenefits page  
- [ ] Events + announcements + affiliate routes + i18n  

**[END PHASE 7]**

---

### PHASE 8 — Platform Pages (User) — Imported*Page 전수  
**규칙:** `src/pages/` 또는 `src/presentation/` — **route는 import만**  
**지갑·지원·PWA:** `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` §4·§5·§8

| # | Exported component | Route wrapper |
|---|-------------------|---------------|
| 1 | ImportedLandingPage | `/` — 부업/부수입 훅 + 4축 |
| 2 | ImportedHomePage | `/home` |
| 3 | ImportedDashboardPage | `/dashboard` — desktop 4-panel hub |
| 4 | ImportedEarnPage | `/earn` |
| 5 | ImportedTradePage | `/trade` — spot + futures |
| 6 | ImportedWalletPage | `/wallet` |
| 7 | ImportedDepositPage | `/wallet/deposit` — **crypto default tab** + KRW bank |
| 8 | ImportedWithdrawPage | `/wallet/withdraw` — crypto primary |
| 9 | ImportedLedgerPage | `/ledger` |
| 10 | ImportedStakingPage | `/staking` |
| 11 | ImportedLoginPage | `/login` |
| 12 | ImportedSignupPage | `/signup` — referral code field |
| 13 | ImportedResetPasswordPage | `/reset-password` |
| 14 | ImportedAccountPage | `/account` |
| 15 | ImportedSettingsPage | `/settings` — PWA push UI |
| 16 | ImportedReferralPage | `/referral` |
| 17 | ImportedAffiliatePage | `/affiliate` |
| 18 | ImportedViralMissionsPage | `/earn/viral` |
| 19 | ImportedTierBenefitsPage | `/tier` |
| 20 | ImportedMorePage | `/more` |
| 21 | ImportedFaqPage | `/faq` — accordion + search |
| 22 | ImportedSupportChatPage | `/support` — live chat UI shell |
| 23 | ImportedResponsibleGamingPage | `/risk` |
| 24 | ImportedAboutPage | `/about` |
| 25 | ImportedTermsPage | `/terms` |
| 26 | ImportedPrivacyPage | `/privacy` |
| 27 | ImportedGamesCatalogPage | `/games` — **10 cards**, tabs, favorites |
| 28 | ImportedGamesHistoryPage | `/games/history` |
| 29 | ImportedGamesFairnessPage | `/games/fairness` |
| 30 | ImportedGamesTournamentsPage | `/games/tournaments` |
| 31 | ImportedShareRoundPage | share |
| 32 | ImportedOfflinePage | offline — PWA offline state |

**Trade (`components/trade/`):** MobileTradeView, OrderBook, BuyOrderSheet, LeverageSlider, FomoStack, … + **desktop multi-panel workstation**

**PWA (`components/pwa/`):** PwaInstallSheet, PwaUpdateBanner, IosAddToHomeGuide — wire to `pwa.*`, `notif.permission.*`

**Every page:** Loading · Skeleton · Empty · Error · Offline · Success (§13 state system)

**게이트:**

- [ ] **32/32** `export function Imported*Page` exists  
- [ ] DepositPage: crypto tab **default**, KRW second tab, no PG/card UI  
- [ ] FAQ + SupportChatPage + SupportChatFab wired  
- [ ] PWA install + update + offline surfaces present  
- [ ] **0** inline page JSX in routes (wrapper ≤30 lines)  
- [ ] grep `[가-힣]` in tsx → 0  

**[END PHASE 8]**

---

### PHASE 9 — Admin App (운영 UI 전면)  
**목표:** PHONARA Admin **100% Lovable visual** — 별도 tree `src-admin/` 또는 monorepo `admin/`

| Page | Export |
|------|--------|
| ImportedAdminLoginPage | |
| ImportedAdminMfaEnrollPage / Challenge | |
| ImportedAdminOverviewPage | health cards, reconciliation, cron |
| ImportedAdminAlertsPage | ack/resolve + reason dialog |
| ImportedAdminQueuesPage | deposit/KYC/withdrawal/STR/risk tables |
| ImportedAdminAuditPage | audit log virtualized |
| ImportedAdminOperationsPage | kill switches, feature flags |

**Components:** AdminLayout, AdminNav, AdminMetricCard, AdminActionDialog, AdminSection, AdminAuthFrame

**Rules:**

- props-only: `rows`, `metrics`, `onAck(reason)`, `onResolve(reason)` — **no raw RPC in components**  
- raw SQL/error **never shown** — error code props  
- `admin.*` i18n **full mirror** of PHONARA keys  
- desktop **compact** density, virtualized queues

**Export:** `dist-phonara-admin-package.zip` (or unified ZIP with `web/` + `admin/` roots)

**[END PHASE 9]**

---

### PHASE 10 — i18n Sweep + QA + Export  
**목표:** ZIP 다운로드 Ready

**i18n minimum namespaces (ko + en each):**

`nav.*` · `shell.*` · `earn.*` · `daily.*` · `missions.*` · `mission.*` · `viral.*` · `referral.*` · `affiliate.*` · `roulette.*`(Earn) · `dashboard.*` · `trade.*` · `trade.toast.*`(emoji-free) · `wallet.*` · `wallet.deposit.crypto.*` · `wallet.toast.*` · `ledger.*` · `staking.*` · `auth.*` · `auth.toast.*` · `casino.game.*`(10) · `casino.rules.*`(10 games × title/summary/step/tip/payout) · `casino.rules.common.*` · `casino.field.*` · `casino.action.*` · `casino.catalog.*` · `casino.error.*` · `casino.toast.*`(emoji-free) · `tier.*` · `event.*` · `announce.*` · `leaderboard.*` · `faq.*` · `support.*` · `support.toast.*` · `pwa.*` · `toast.*` · `earn.toast.*` · `viral.toast.*` · `notif.*` · `rg.*` · `legal.*` · `common.*` · `admin.*` · `admin.toast.*`(emoji-free)

**QA:**

```bash
bun run qa          # lint + typecheck + vitest + e2e
bun run checkpoint:*  # 10 games — all executed
```

**Export:**

```bash
bun run export:phonara        # → dist-phonara-package.zip (web)
bun run export:phonara-admin  # → dist-phonara-admin-package.zip (if split)
```

**ZIP MUST include:**

- `src/games/**` (10 + shared + catalog)  
- `src/components/{ui,shell,earn,trade,fomo,welcome}/**`  
- All `Imported*Page` + `Imported*Game` source files  
- `src/i18n/**`  
- `docs/*.delta.md`  
- `README.PHONARA.md` (paste map)

**ZIP MUST exclude (PHONARA drop):**

- `src/games/preview/useMockPipeline.ts`  
- `src/routes/casino.*.tsx` (preview only)  
- `routeTree.gen.ts`, TanStack Start server-only files if PHONARA incompatible  
- `@supabase/*` dependency  

**Final gate checklist:**

- [ ] RED §0.2 → **0 violations**  
- [ ] **10/10** games zenith quality + A–G wired + **rules sheet each**  
- [ ] 32/32 User pages named export  
- [ ] Viral missions w/ quota · no ad/survey missions  
- [ ] Crypto-default deposit + KRW bank · FAQ · Support · PWA  
- [ ] Toast §5.4: `casino.toast`/`trade.toast` emoji 0 · Earn/viral toast emoji OK  
- [ ] Admin 7 surfaces done  
- [ ] i18n JSX Korean 0  
- [ ] `bun qa` green  
- [ ] ZIP generated + file size logged  
- [ ] Run `docs/LOVABLE_WORKSPACE_DUMP_REQUEST.md` → paste output to Cursor  

**[END PHASE 10 — SHIP]**

---

## §5. PHONARA Paste Map (ZIP → monorepo)

| Lovable | PHONARA |
|---------|---------|
| `src/games/{slug}/*` | `apps/web/src/components/games/{slug}/` |
| `src/games/shared/*` | `apps/web/src/components/games/shared/` |
| `src/games/catalog/ImportedGamesCatalogPage.tsx` | `apps/web/src/presentation-import/pages/games-catalog-page.tsx` |
| `src/pages/Imported*Page.tsx` | `apps/web/src/presentation-import/pages/*-page.tsx` |
| `src/components/{ui,shell,earn,trade,fomo,welcome}/*` | `apps/web/src/components/{...}/` |
| `src/styles.css` | `apps/web/src/presentation-import/styles/lovable-globals.css` + tokens |
| `src/i18n/*` casino/shell/earn/… keys | `packages/i18n` **merge only** |
| `src-admin/**` or `admin/**` | `apps/admin/src/components/**` + pages |
| `docs/*.delta.md` | append to canonical docs |

**Registry naming (games):**

```ts
// PHONARA expects:
export { ImportedMintReelsGame } from './imported-mint-reels-game';
// paste: index.ts re-export after file rename if needed
```

**PHONARA frozen — never overwrite:**

- `apps/web/src/components/games/shared/types.ts` → **additive merge only**  
- `packages/game-engine/**`, `supabase/**`, hooks, RPC  

---

## §6. Lovable AI 작업 지시 (첫 메시지에 이것만 추가)

```text
위 LOVABLE_ZENITH_MASTER_PLAN.md + LOVABLE_PRODUCT_PLATFORM_MANIFEST.md 전체를 계약으로 따른다.
Phase 0부터 순서대로만 진행한다. Phase 게이트 green 전 다음 Phase 시작 금지.
각 Phase 끝에 [END PHASE N] + 체크리스트 결과 + bun qa 로그를 출력한다.
추측·skip·Phase 병합 금지. RED 1건이라도 있으면 export:phonara 실행 금지.
광고/설문 미션 금지. 바이럴 미션은 quota(used/max) 필수. 입금은 crypto 탭 default.
토스트: 한글 친화 구어체; casino·trade toast 이모 0; 그 외 toast i18n에 귀여운 이모 1개( catalog only ).
게임 규칙: 10종 각 HUD에 GameRulesSheet; casino.rules.{gameCode} step≥4 tip≥2; 초등학생도 이해하는 친절한 ko/en catalog.
완료 시 LOVABLE_WORKSPACE_DUMP_REQUEST.md 전수 덤프를 생성한다.
```

---

## §7. Cursor (PHONARA) — ZIP 수령 후만

1. ZIP paste (restyle 0)  
2. `VITE_LOVABLE_CASINO_SURFACE=true`  
3. i18n merge · delta merge · 구 UI 삭제  
4. `bun run check` · `test:e2e:casino-smoke`  

**Lovable은 여기까지 하지 않는다.**

---

*PHONARA · Lovable Zenith Master Plan · v1.1 · 2026-06-14 · + LOVABLE_PRODUCT_PLATFORM_MANIFEST · game contract v3.1*
