# PHONARA · 새 채팅 인계 — 끝판왕 (2026-06-17)

> **용도:** 채팅 렉 시 **새 Cursor 채팅 첫 메시지**에 통째로 붙여넣기  
> **정본:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4

---

## 0. 역할 · 경계 (non-negotiable)

| 주체 | 하는 일 | 금지 |
|------|---------|------|
| **Lovable AI** | L1 canvas UI EXECUTE · vitest/build on canvas | PHONARA repo `apps/web` paste · engine/RPC |
| **Cursor (PHONARA repo)** | LOCK/큐/doc · §GREEN 검증 · dispatch 조립 · `docs/checkpoints/*` | Lovable canvas 구현 · operator GO 없이 ZIP |
| **operator** | APPROVE/REVISE · 「ZIP 발행 GO」「paste GO」1줄 | — |

- **Engine NO-TOUCH:** `packages/{money,game-engine,trading-engine,wallet-ledger}` · `supabase/*` · `features/*/use-*.ts` · UI 작업 중 migration/RPC 금지
- **ZIP 발행:** operator **「ZIP 발행 GO」** 명시 전 **절대 금지** (`.cursor/rules/92-lovable-lock-execute.mdc`)
- **PHONARA paste:** L1 World Crush G-WC1~3 + ZIP GO 후 L2

---

## 1. Baseline (2026-06-17 · canvas · L1-GP 반영)

| 항목 | 값 |
|------|-----|
| vitest | **608/608** (G#2 Dice §GREEN carry) |
| i18n catalog | **2627** ko=en parity |
| L1-GP HEAD | **G#3 Limbo EXECUTE** — [`PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-17.md`](PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-17.md) |
| e2e game specs | **10/10** aligned · PW runtime CI defer |
| sidebar | **5항목** (홈·카지노·스포츠·거래·지갑) — L1-16l |
| `/casino` | ImportedCasinoPage · `/games`→`/casino` redirect |
| PHONARA `apps/web` paste | **0** (Lovable canvas SOT) |

---

## 2b. L1-GP · Games Polish (operator priority · parallel)

> **정본:** [`PHONARA_LOVABLE_GAMES_POLISH_MASTER.md`](PHONARA_LOVABLE_GAMES_POLISH_MASTER.md)

```text
HEAD: L1-GP G#3 Limbo (G#2 Dice ✅ §GREEN · vitest 608/608)
다음: G#4 HiLo (G#3 §GREEN 후)
```

---

## 2. 큐 HEAD · 지금 할 일

```text
✅ L1-16 ~ 18 · L1-10-W-T · L1-24 §GREEN · **L1-24 Pass 1.1 §GREEN**
⏳ L1-16f parallel — desktop GameDetailFrame §GREEN pending
→ L1-20 HEAD — K1 황금 지구 (LOCK draft)
→ L1-21 K3 생존 신고
→ ZIP 100% 후 operator 「ZIP 발행 GO」→ L2 paste
```

**한 줄:** **L1-20 K1** formal HEAD · L1-16f parallel · baseline **586/586**.

---

## 3. 슬라이스 상태표 (L1-16 wave)

| ID | scope | 상태 | LOCK |
|----|--------|------|------|
| L1-16 | Home IA `/home` 5 tabs | ✅ §GREEN | `LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md` |
| L1-16b | Home density | ✅ (UI→16c supersede) | `L1-16B_HOME_DENSITY_LOCK.md` |
| L1-16c | Stake-lobby | ✅ §GREEN | `L1-16C_HOME_STAKE_LOBBY_LOCK.md` |
| L1-16d | Poster cards ×16 | ✅ §GREEN | `L1-16D_HOME_POSTER_CARDS_LOCK.md` |
| L1-16e | Nav overlap | ✅ §GREEN | `L1-16E_HOME_NAV_HOTFIX_LOCK.md` |
| L1-16f | Desktop game detail stake layout | ⏳ **§GREEN pending** | `L1-16F_GAME_DETAIL_DESKTOP_LOCK.md` |
| L1-16g | MobileGameFrame collapse+FS | ✅ §GREEN | `L1-16G_MOBILE_GAME_FRAME_LOCK.md` |
| L1-16h | Game posters + live seeds | ✅ §GREEN | `L1-16H_GAMES_CATALOG_POSTERS_LOCK.md` |
| L1-16i | Games QA sweep | ✅ §GREEN | `L1-16I_GAMES_QA_SWEEP_LOCK.md` |
| L1-16j | Casino route dedup | **CANCELLED** | → L1-16l supersede |
| L1-16k | Global HomeSideNav | ✅ §GREEN | `L1-16K_GLOBAL_SIDEBAR_UNIFY_LOCK.md` |
| L1-16l | Dead code sweep | ✅ §GREEN | `L1-16L_DEAD_CODE_SWEEP_LOCK.md` |
| **L1-16m** | Audit + Marquee + PF | **✅ §GREEN** | `L1-16M_MINES_AUDIT_MARQUEE_PF_LOCK.md` · 572/572 |
| **L1-17** | Trade split | **✅ §GREEN** | `L1-17_TRADE_SPLIT_LOCK.md` · 577/577 · Δ=+26 |
| **L1-18** | FOMO motion V2 | **✅ §GREEN** | `L1-18_FOMO_MOTION_LOCK.md` · 580/580 · Δ=0 |
| **L1-24** | Stake typography | **✅ §GREEN + Pass 1.1** | `L1-24_STAKE_TYPOGRAPHY_LOCK.md` · 586/586 · KO=2620 · D1 held |
| **L1-20** | K1 황금 지구 | **PLAN · HEAD** | §9 · LOCK draft pending |

---

## 4. 방금 끝난 작업 (이 채팅 맥락)

### L1-16l ✅ §GREEN (Lovable)
- 사이드바 "게임" 중복 제거 → **5항목**
- 라우트 **6** 삭제 · 고아 컴포넌트 **8** 삭제 (CasinoHub tree · SideNav · casino.games 등)
- `/casino` · `/games` · `/games/crash` redirect 정상 · vitest **572/572**

### L1-16m Part 1 ✅ (PHONARA repo · Cursor)
- [`docs/checkpoints/probability-audit.md`](checkpoints/probability-audit.md) — Mines 22/22 = **2,277.00×** PASS · 10게임 페이아웃 매핑 · **코드 0줄**

### L1-16m ✅ §GREEN (Lovable · 2026-06-17)
- Part 1: [`docs/checkpoints/probability-audit.md`](checkpoints/probability-audit.md) — Mines 22/22 = **2,277.00×** · 10게임 매핑
- Part 2: `PresenceMarquee` + `@keyframes presence-marquee` · HUD ×7 (Mines/Crash/Plinko/Dice/Limbo/Blackjack/Roulette)
- Part 3: 모바일 PF badge header→Stage 아래 meta footer · desktop GameDetailFrame NO-TOUCH
- vitest **572/572** · engine/payout **0-touch**

### L1-17 ✅ §GREEN (Lovable · 2026-06-17)
- `TradeModeShell` — Spot · Futures · Staking segment · default **futures**
- 12-D `DesktopTrade` + `MobileTradeView` **relocate 0-delete** · synthetic display-only label carry
- Spot/Staking display-only mock · order/stake CTA → **toast only**
- vitest **577/577** (+5) · i18n **Δ=+26** DIFF=0 · Korean literals new files **0**
- **G-WC2 ✅**

### L1-18 ✅ §GREEN (Lovable · 2026-06-17)
- `CountdownTimer` — 초 셀 매초 `.animate-fomo-tick`
- `LiveWinTicker` — `animate-fade-in` → `animate-fomo-pulse` **교체** (스택 0)
- `TradeFuturesPanel` — 헤더 price 셀 subtle tick · display-only label carry
- reduced-motion — 글로벌 `*` 0.001ms guard 재사용 · LiveWinMarquee/TournamentStrip **NO-TOUCH**
- vitest **580/580** (+3) · catalog **Δ=0** DIFF=0 · console prod **0**
- **G-WC3 ✅**

### L1-24 ✅ §GREEN + Pass 1.1 (Lovable · 2026-06-17)
- **Pass 1:** system-ui + Pretendard(ko) · 5→1 webfont · root 16px · `@layer base` Stake scale
- **Pass 1.1:** D2 test lock (startsWith Pretendard · `__root` googleapis) · D3 **KO=2620 EN=2620 DIFF=0**
- vitest **586/586** · 118 files · D2 +2 assertions in existing `it` blocks (not new tests)
- **D1 held:** `line-height: 1.15` — orderbook + bet-feed screenshot pending (L1-24b)

---

*갱신: 2026-06-17 · L1-24 Pass 1.1 ✅ · baseline 586 · HEAD L1-20*

### A. G-ZIP gate (HEAD · operator trigger)

**조건:** G-WC1~3 ✅ · L1-16f chase **권장** (non-blocking)

**operator → Cursor (ZIP만):**
```text
ZIP 발행 GO
```

**Cursor:** `92-lovable-lock-execute.mdc` §ZIP 게이트 — operator 명시 **후에만** ZIP 실행 · 그 전 **0**

### B. L1-16f (parallel debt · optional before ZIP)

Desktop `GameDetailFrame` stake layout — SlimTitleBar + full-width surface + 4 tabs · mobile NO-TOUCH

**LOCK:** `docs/LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md`

---

## 6. World Crush 게이트 → ZIP

| 게이트 | 조건 | 상태 |
|--------|------|------|
| G-WC1 | L1-16 §GREEN | ✅ |
| **G-WC2** | L1-17 §GREEN | **✅** |
| **G-WC3** | L1-18 §GREEN | **✅** |
| **G-ZIP** | G-WC1~3 + operator 「ZIP 발행 GO」 | **⏳ HEAD** |

**순서:** operator **「ZIP 발행 GO」** → L2 paste (L1-16f parallel chase 권장)

---

## 7. Parallel debt · 큐 skip 기록 (non-blocking)

operator priority로 formal 순서와 다르게 진행된 슬라이스 — **문서화만**, HEAD 차단 아님:

- L1-16g before 16f · 16h/16i before 17 · 16k before 16j · 16l before 17 unblock
- L1-16j **CANCELLED** → 16l가 casino.games **삭제**로 supersede
- L1-16f desktop · Playwright games CI runtime — ZIP 전 chase 권장

---

## 8. Cursor 다음 액션 (우선순위)

1. operator **「ZIP 발행 GO」** 대기 (Cursor ZIP **0** until explicit)
2. **L1-16f §GREEN** chase (parallel · ZIP 전 권장)
3. ZIP GO 후 → **L2 paste** Wave-1 prep

---

## 9. Lovable dispatch 규칙

- `.cursor/rules/93-lovable-prompt-dispatch.mdc` — **단일 markdown 블록** · LOCK 전문 + Visual References + EXECUTE GO
- 「docs 읽으세요」만 보내기 = **FAIL**

---

## 10. PHONARA repo 참고 경로

| 용도 | 경로 |
|------|------|
| 순차 큐 | `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` |
| World Crush 플랜 | `docs/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md` |
| 확률 감사 | `docs/checkpoints/probability-audit.md` |
| Game engine SOT | `packages/game-engine/src/games/*` |
| Lovable mandate | `docs/LOVABLE_AI_MASTER_PROMPT.md` §1 |
| **Games Polish 12종** | **`docs/PHONARA_LOVABLE_GAMES_POLISH_MASTER.md`** · G#1 `PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md` |

---

## 11. i18n defer 메모

- `home.side.nav.games` — L1-16l에서 **삭제 안 함** · 다음 i18n cleanup slice에서 ko/en 동시 삭제

---

## 12. Earn Killer Missions backlog (§9 · 2026-06-17)

operator 아이디어 4종 — **정본:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9

| ID | 콘셉트 | 우선 | 상태 |
|----|--------|------|------|
| **K1 / L1-20** | 황금 지구 전국민 탭 · 잭팟 FOMO | **1순위 시그니처** | PLAN · ZIP 후 GO |
| **K3 / L1-21** | 7시 생존 신고 · 친구 랭킹 | **2순위** | PLAN |
| K2 / L1-22 | 홈 위젯 펫 · 스토리 공유 | defer (네이티브) | defer |
| K4 / L1-23 | 클립보드/스크린줍 | defer (웹 축소안) | defer |

**L1** = mock/tap/toast · **L3** = ledger/jackpot/rank (Engine GO 별도)

### Wallet tone (L1-10-W-T · parallel G-ZIP)

| ID | scope | 상태 |
|----|--------|------|
| **L1-10-W-T** | `[data-wallet="v2"]` CSS SOT rebind · violet hex 0 | **✅ §GREEN** | [`LOVABLE_WALLET_TONE_UNIFY_LOCK.md`](LOVABLE_WALLET_TONE_UNIFY_LOCK.md) |

---

### L1-10-W-T ✅ §GREEN (Lovable · 2026-06-17)
- `[data-wallet="v2"]` → platform SOT (`--background` / `--primary` / `--up` / `--down`)
- wallet violet hex **0** · hub/deposit/withdraw **네이비+민트** · 기능·라우트·테스트 **0-touch**

---

## 5. 다음 EXECUTE 상세
