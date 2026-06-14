# PHONARA × Lovable — 워크스페이스 전수 덤프·갭 분석 요청 (Cursor 연동용)

> **사용법:** 이 파일 **전체**를 Lovable AI 채팅에 붙여넣기.  
> Lovable이 Part 1~5 출력을 생성하면 → **그 결과 전체**를 PHONARA Cursor 채팅에 붙여넣기 (+ 가능하면 `dist-phonara-package.zip`).  
> **PHONARA 기준:** `docs/LOVABLE_P1_FINAL_PHONARA.md` · `docs/LOVABLE_HANDOFF.md` · `docs/GAMES-INTEGRATION.md` · v3.1 §0 계약.

---

## Lovable AI 지시문 (아래부터 전부 붙여넣기)

# PHONARA Cursor 연동 — Lovable 워크스페이스 전수 덤프·갭 분석 (지구상 끝판왕)

## 역할

너는 PHONARA Lovable 프론트엔드 워크스페이스를 **Cursor(PHONARA monorepo)가 paste·통합·게이트 판정**할 수 있게 **전수 인벤토리 + 계약 검증 + 갭 분석**을 한 번에 출력한다.

**목표:** Cursor가 Lovable repo를 직접 못 보므로, **파일·폴더·코드·테스트·금지 패턴·갭**을 이 덤프만으로 paste GO/NO-GO를 내릴 수 있게 한다.

## 절대 규칙

- **추측 금지.** 실제 워크스페이스 파일·grep·테스트 결과만. 없으면 `MISSING` / `UNVERIFIED`.
- **엔진/RPC/정산 구현 금지** — Supabase import, `rpc_*`, 클라 RNG/HMAC 결과, payout/잔액/RTP 재계산이 있으면 **VIOLATION (RED)** 로 표시.
- **PHONARA canonical 문서 overwrite 금지** — `GAMES-INTEGRATION.md` / `PRESENTATION_IMPORT.md` 전체 교체 금지, **delta/append만**.
- 출력은 **한국어 설명 + 영문 경로/코드** 혼용. Cursor 파싱용 **표·체크리스트·코드블록** 위주.
- 너무 길면 **Part 1 → 2 → 3 → 4 → 5 순서**로 나눠 출력. Part마다 `[END PART n]` 표시.
- **default export 금지** — named export만.
- **Lovable Cloud / Supabase / OAuth / 결제 백엔드** 사용 시 RED VIOLATION.

---

## PHONARA 계약 요약 (v3.1 §0 — 덤프에서 반드시 검증)

| 항목 | 규칙 |
|------|------|
| gameCode | underscore: `mint_reels`, `gold_rush`, `roulette`, `blackjack` (+ 기존 6종). URL slug만 hyphen. |
| slot selection | `{ lines: number }` only. **`turbo` RPC selection 금지** (UI local state만). |
| slot result | RPC `{ totalMultiplier }` only — **`bet.result.grid` 의존 코드 paste 후 0**. |
| roulette split | `value` = lower adjacent pocket (sum 아님). **`\|a−b\|===1` 연속쌍만** (0\|1 OK). |
| roulette type | `straight\|split\|red\|black\|even\|odd\|low\|high\|dozen1\|dozen2\|dozen3\|column1\|column2\|column3` only. |
| stakeWeight | 정수 `number`. 칩 `"1"\|"5"\|"25"\|"100"\|"500"`. 빈 `bets[]` submit 금지. |
| blackjack | `{ actions: [{ seat, move }] }` one-shot. default `{ actions: [{ seat: 0, move: 'stand' }] }`. settle result `{ totalMultiplier }` only — 카드 flip 연출 전용. |
| testid (Lovable Controls) | `casino-stake-input`, `casino-prepare-hash`, `casino-place-bet`, `casino-client-seed-input`, `casino-error` (DOM 슬롯). `casino-submit-bet` **금지**. |
| props | `ImportedGameSurfaceProps` — callback only. Supabase/RPC 0. |
| i18n | JSX 하드코딩 한국어 0. `casino.game.*`, `casino.field.*`, `casino.action.*`, `casino.catalog.*`. |
| paste | `src/games/{slug}/*` → PHONARA `components/games/{slug}/`. preview `src/routes/casino.*.tsx` → paste 시 **drop**. |

**10 game_code (엔진 완료 — Lovable UI만):**  
`crash` · `dice` · `mines` · `plinko` · `limbo` · `hilo` · `mint_reels` · `gold_rush` · `roulette` · `blackjack`

**Earn `rpc_spin_roulette` ≠ 카지노 `roulette`** — 코드·i18n·UI 혼용 금지.

---

# PART 1 — 파일 트리 전수 덤프

## 1-A. 전체 트리

아래 루트 기준 **전체 파일 트리** (가능하면 파일 크기 bytes):

```text
src/
  components/{ui,shell,earn,trade,fomo,welcome}/
  games/shared/{gfx,feel,presence,celebrate,theme,replay,mobile,visuals,hooks}/
  games/{crash,dice,mines,plinko,limbo,hilo,mint-reels,gold-rush,blackjack,roulette,catalog}/
  i18n/
  routes/
  lib/
tests/
  e2e/games/
scripts/
docs/
  checkpoints/
  *.delta.md
.lovable/
  memory/
package.json
```

각 파일 옆 **상태 태그 1개:**

| 태그 | 의미 |
|------|------|
| `DONE` | 구현 완료, preview 동작 |
| `PARTIAL` | 스켈/일부 구현 |
| `STUB` | placeholder/README만 |
| `MISSING` | 경로 없음 |

## 1-B. 게임 10종 × 5파일 매트릭스

| gameCode | slug | Stage | HUD | Controls.shared | Controls.mobile | Controls.desktop | index (named export) | **rules i18n** | **RulesSheet HUD** | __tests__ | preview route | checkpoint script |
|----------|------|-------|-----|-----------------|-----------------|------------------|----------------------|----------------|-------------------|-----------|---------------|-------------------|
| crash | crash | | | | | | | | step≥4 tip≥2 | `casino-game-rules` | | | |
| dice | dice | | | | | | | | | | | | |
| mines | mines | | | | | | | | | | | | |
| plinko | plinko | | | | | | | | | | | | |
| limbo | limbo | | | | | | | | | | | | |
| hilo | hilo | | | | | | | | | | | | |
| mint_reels | mint-reels | | | | | | | | | | | | |
| gold_rush | gold-rush | | | | | | | | | | | | |
| blackjack | blackjack | | | | | | | | | | | | |
| roulette | roulette | | | | | | | | | | | | |

**export 이름:** `ImportedCrashGame`, `ImportedMintReelsGame`, … (PHONARA registry와 1:1)

## 1-C. 페이지·셸 매트릭스

| PHONARA paste target | Lovable source path | Exported name | 상태 |
|----------------------|---------------------|---------------|------|
| games-catalog-page | `src/games/catalog/ImportedGamesCatalogPage.tsx` | `ImportedGamesCatalogPage` | |
| games-history-page | | `ImportedGamesHistoryPage` | |
| games-fairness-page | | `ImportedGamesFairnessPage` | |
| games-tournaments-page | | `ImportedGamesTournamentsPage` | |
| landing-page | | `ImportedLandingPage` | |
| home-page | | `ImportedHomePage` | |
| earn-page | | `ImportedEarnPage` | |
| trade-page | | `ImportedTradePage` | |
| wallet-page | | `ImportedWalletPage` | |
| deposit-page | | `ImportedDepositPage` | crypto default + KRW bank |
| withdraw-page | | `ImportedWithdrawPage` | |
| ledger-page | | `ImportedLedgerPage` | |
| staking-page | | `ImportedStakingPage` | |
| dashboard-page | | `ImportedDashboardPage` | |
| login-page | | `ImportedLoginPage` | |
| signup-page | | `ImportedSignupPage` | referral code field |
| reset-password-page | | `ImportedResetPasswordPage` | |
| account-page | | `ImportedAccountPage` | |
| settings-page | | `ImportedSettingsPage` | PWA push UI |
| referral-page | | `ImportedReferralPage` | |
| affiliate-page | | `ImportedAffiliatePage` | |
| viral-missions-page | | `ImportedViralMissionsPage` | quota used/max |
| tier-benefits-page | | `ImportedTierBenefitsPage` | |
| more-page | | `ImportedMorePage` | |
| faq-page | | `ImportedFaqPage` | |
| support-chat-page | | `ImportedSupportChatPage` | |
| responsible-gaming-page | | `ImportedResponsibleGamingPage` | |
| about-page | | `ImportedAboutPage` | |
| terms-page | | `ImportedTermsPage` | |
| privacy-page | | `ImportedPrivacyPage` | |
| share-round-page | | `ImportedShareRoundPage` | |
| offline-page | | `ImportedOfflinePage` | |

| Shell 컴포넌트 | 파일 | 상태 |
|----------------|------|------|
| TopBar | | TierBadge · balance · bell |
| BottomNav (5탭) | | Home · Earn · Games · Trade · Wallet |
| AccountSheet | | tier · FAQ · Support shortcuts |
| SupportChatFab | | floating safe-area |
| SiteFooter | | |
| Modal login | | |
| PWA | `src/components/pwa/` | install · update · ios guide |
| Toast | `useAppToast` / Toaster | §5.4: casino/trade emoji 0 · Earn 등 emoji 1 (i18n only) |

| Zone | 폴더 | 상태 |
|------|------|------|
| UI design system | `src/components/ui/` | |
| Earn cards | `src/components/earn/` | |
| Trade panels | `src/components/trade/` | |
| FOMO / live feed | `src/components/fomo/` | |
| Welcome | `src/components/welcome/` | |
| Global CSS | `lovable-globals.css` / `src/styles.css` | |

## 1-D. A–G shared 시스템

| System | Folder | 주요 export | 상태 | 사용 게임 |
|--------|--------|-------------|------|-----------|
| A GPU Shader | `games/shared/gfx/` | | | |
| B Game Feel | `games/shared/feel/` | | | |
| C Live Presence (mock) | `games/shared/presence/` | | | |
| D Celebration Tier | `games/shared/celebrate/` | | | |
| E Skin/Theme | `games/shared/theme/` | | | |
| F Replay/Share | `games/shared/replay/` | | | |
| G Mobile One-Hand | `games/shared/mobile/` | | | |
| Visuals | `games/shared/visuals/` | | | |
| Hooks | `games/shared/hooks/` | useSound, useHaptics, useGameLoop, … | | |
| BetPanel / FairnessSheet / **GameRulesSheet** / RGGate (UI) | `games/shared/` | GameRulesTrigger `casino-game-rules` | | |
| useMockPipeline | `games/shared/` | DEV gate, 10종 분기 | | |

---

# PART 2 — 계약·금지 패턴 스캔

아래를 **실제 grep/rg 출력**으로 보고. 0건이면 `0 matches` 명시.

```bash
# RED — engine boundary
rg -n "@supabase|createClient|rpc_" src/games src/components src/routes
rg -n "Math\.random\(" src/games src/components
rg -n "casino-submit-bet" src/

# RED — v3.1 contract
rg -n '"turbo"|turbo:' src/games/mint-reels src/games/gold-rush
rg -n "bet\.result\.grid|result\.grid" src/games/mint-reels src/games/gold-rush
rg -n "'street'|'corner'|'dozen'|'column'" src/games/roulette
rg -n "mint-reels|gold-rush" src/games --glob "*.tsx"  # hyphen gameCode in props

# YELLOW — release / i18n
rg -n "parseFloat" src/games
rg -n "[\uAC00-\uD7A3]" src/games src/components/shell src/games/catalog --glob "*.tsx"
rg -n "Test|Debug|Demo|TODO|FIXME|sample|lorem" src/ --glob "*.{tsx,ts,css}"
rg -n "default export" src/games src/games/catalog

# YELLOW — toast emoji zones (LOVABLE_PRODUCT_PLATFORM_MANIFEST §5.4)
# casino/trade toast keys must be emoji-free; earn/viral/daily toast should have cute emoji in ko catalog
rg -n "casino\.toast|trade\.toast" src/i18n --glob "*.ts"
# manual: 0 emoji in lines matching casino.toast / trade.toast in ko+en catalogs

# Game rules — 10/10 required (LOVABLE §2.6 / MANIFEST §6.1)
rg -n "GameRulesSheet|GameRulesTrigger|casino-game-rules" src/games
rg -n "casino\.rules\.(crash|plinko|mines|limbo|hilo|dice|mint_reels|gold_rush|blackjack|roulette)\." src/i18n
# per game: step1..step4+ tip1..tip2+ summary+payout in ko AND en

# deps
rg -n "howler" package.json src/
rg -n "@supabase" package.json
```

**VIOLATION 표** (모든 매치 나열):

| file:line | 규칙 | RED/YELLOW | 수정안 |
|-----------|------|------------|--------|

---

# PART 3 — 핵심 코드 스냅샷 (전문 덤프)

파일 없으면 `MISSING`. 있으면 **전체 내용** 코드블록.

## 3-A. 계약·헬퍼

- `src/games/shared/types.ts`
- `src/games/shared/contractHelpers.ts` (defaultSelection 4종 + 6종)
- `src/games/shared/useMockPipeline.ts`

## 3-B. 신규 4종 (ZIP-1)

각 게임:

- `index.tsx` (named export 전문)
- `Controls.shared.tsx` (전문)
- `Stage.tsx` (전문 또는 120줄 + “…truncated…” 사유)
- `{Game}.contract.test.tsx` (전문)

게임: `mint-reels`, `gold-rush`, `blackjack`, `roulette`

**roulette 필수 확인:** split 클릭 시 `Math.min(a,b)`, 비연속쌍 reject 코드 포함.

## 3-C. 카탈로그

- `src/games/catalog/ImportedGamesCatalogPage.tsx` (전문)
- catalog route 래퍼 (전문)
- 10카드 slug/gameCode/카테고리/배지 표

## 3-D. 기존 6종 (P1)

각 게임 `index.tsx` export 1줄 + Stage/HUD/Controls 존재 여부.  
**하나라도 DONE이면** Crash `Controls.shared.tsx` + `crash.spec.ts` 요약 포함.  
전부 없으면: `6종 전부 MISSING — P1 미착수`.

## 3-E. i18n

- `src/i18n/ko.ts` + `src/i18n/en.ts` (또는 `catalog.ts`) — **`casino.*` 키 블록 전문**
- `casino.catalog.tabs.*`, `casino.catalog.badges.*` 존재 여부
- checkpoint `docs/checkpoints/*/i18n-*-keys.txt` (있으면 각 전문)

## 3-F. package.json

- `scripts`: `checkpoint:*`, `export:phonara`, `qa`, vitest, playwright
- `dependencies`: pixi, matter-js, framer-motion 등 게임 관련

## 3-G. delta 문서 (있으면 전문)

- `docs/GAMES-INTEGRATION.delta.md`
- `docs/PRESENTATION_IMPORT.delta.md`

---

# PART 4 — QA · testid · 납품 readiness

## 4-A. Money testid inventory (게임별)

| gameCode | stake-input | prepare-hash | place-bet | client-seed | error | 비고 |
|----------|-------------|--------------|-----------|-------------|-------|------|

## 4-B. contract.test 결과

| game | lines only | no turbo in selection | split lower-adj | non-consecutive reject | integer stakeWeight | actions replace |
|------|------------|----------------------|-----------------|------------------------|---------------------|-----------------|
| mint_reels | | | — | — | — | — |
| gold_rush | | | — | — | — | — |
| roulette | — | — | | | | — |
| blackjack | — | — | — | — | — | |

**vitest run 로그** (마지막): passed / failed / skipped

## 4-C. Playwright (있으면)

- `tests/e2e/games/*.spec.ts` 목록
- 3 viewport (Desktop / iPhone 14 / Pixel 7) 실행 여부
- axe violation 0 여부

## 4-D. export:phonara

- `scripts/export-phonara-package.mjs` 존재: YES/NO
- ZIP 생성: YES/NO — 파일명, size, file count
- ZIP 내 paste map 준수: YES/NO

## 4-E. PHONARA paste map表

| Lovable path | PHONARA target | ZIP 포함 | paste 시 |
|--------------|----------------|----------|----------|
| `src/games/{slug}/*` | `apps/web/src/components/games/{slug}/` | | keep |
| `src/games/catalog/ImportedGamesCatalogPage.tsx` | `presentation-import/pages/games-catalog-page.tsx` | | keep |
| `src/routes/casino.*.tsx` | — | | **drop** |
| `src/i18n/*` 신규 키 | `packages/i18n` merge | | merge |
| `docs/*.delta.md` | canonical merge | | merge |
| `tests/e2e/games/*` (Lovable) | optional | | Cursor 판단 |
| `useMockPipeline.ts` | preview only | | drop or DEV-only |

---

# PART 5 — 갭 분석 & Cursor 권고

## 5-A. 완료율

| 범위 | 완료 % | 근거 |
|------|--------|------|
| ZIP-1 (4게임 + catalog 10카드) | | |
| P1 games (6종) | | |
| A–G shared | | |
| Shell (BottomNav 등) | | |
| Platform pages (Earn~Trade~Auth~Wallet…) | | |
| i18n catalog | | |
| QA (vitest + e2e) | | |

## 5-B. BLOCKER (paste 전 필수 — RED)

1. …

## 5-C. YELLOW (paste 가능, paste 후 Cursor fix)

1. …

## 5-D. NEXT 작업 우선순위 (Top 15)

1. …

## 5-E. Cursor paste 체크리스트 (5줄)

1. PHONARA `components/games/shared/types.ts` **덮어쓰기 금지**
2. `Imported*Game` → `imported-*-game.tsx` + `index.ts` re-export
3. `VITE_LOVABLE_CASINO_SURFACE=true` 후 smoke
4. preview routes / mock pipeline drop
5. …

---

## 마지막 — Cursor 전달용 한 줄 요약

```text
DUMP_DATE: YYYY-MM-DD
ZIP-1 ready: YES/NO
P1-full ready: YES/NO
games done: X/10
pages done: Y/25
A-G done: A/B/C/D/E/F/G (each DONE/PARTIAL/MISSING)
violations RED: N
violations YELLOW: N
BLOCKERS: (comma list or none)
export zip: path or MISSING
```

`[END DUMP]`

---

## PHONARA Cursor — 덤프 수신 후 판정 항목 (참고)

Lovable 덤프를 Cursor에 붙이면 아래를 확정한다:

1. **ZIP-1 paste GO / NO-GO**
2. **Lovable 다음 작업** (6종 / A–G / 셸 / 페이지 우선순위)
3. **PHONARA paste 순서** 및 `VITE_LOVABLE_CASINO_SURFACE` 타이밍
4. **VIOLATION 수정 목록** (파일:줄)
5. **`packages/i18n` merge 키 목록**
6. **Cursor-only** (errorKey relay, casino.tsx 어댑터 축소, router)

---

*작성: PHONARA · Cursor paste 연동 · v3.1 계약 기준*
