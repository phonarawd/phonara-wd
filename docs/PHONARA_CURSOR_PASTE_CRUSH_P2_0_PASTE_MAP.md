# P2.0 + P2.0b · Paste Allowlist 대조표 (PROJECT_DUMP 2026-06-15)

> **근거:** `PROJECT_DUMP.md` (Lovable v2.1 · 672 files · §10 secret-scan 0)  
> **선행:** P2.0 GREEN · P2.0b GREEN (Lovable canvas)  
> **paste GO 전:** PHONARA repo **0-touch** · 엔진 NO-TOUCH  
> **정본 경로:** [`apps/web/PRESENTATION_IMPORT.md`](../apps/web/PRESENTATION_IMPORT.md) §Game UI

---

## 0. 한 줄 요약

| 구분 | Lovable | PHONARA paste |
|------|---------|---------------|
| **P2.0 Crash UI** | `src/games/crash/*` (replay · UX-1 · Context) | `apps/web/src/components/games/crash/` |
| **P2.0b AutoBet** | shared hook + Panel | `apps/web/src/components/games/shared/` |
| **엔진** | mock (`useMockPipeline`) | `useCasinoRoundPipeline` + `mapGameSurfaceProps` **유지** |
| **i18n** | `src/i18n/{ko,en}.ts` | `packages/i18n` 키 **merge** (JSX 0) |

---

## 1. P2.0 · Crash 게임 파일

| # | Lovable (덤프) | PHONARA 대상 | 액션 | 비고 |
|---|----------------|--------------|------|------|
| 1 | `src/games/crash/Stage.tsx` (317 LOC) | `components/games/crash/stage.tsx` 또는 Lovable 구조 유지 | **COPY** | replay model · `casino-crash-multiplier` testid |
| 2 | `src/games/crash/Controls.shared.tsx` | `components/games/crash/controls.shared.tsx` | **COPY** | `casino-cashout` · `data-cta-mode="auto"` · disabled |
| 3 | `src/games/crash/CrashRoundContext.tsx` | `components/games/crash/crash-round-context.tsx` | **COPY** | `readDisplayM()` · ref-based |
| 4 | `src/games/crash/useCrashLiveMultiplier.ts` | `components/games/crash/use-crash-live-multiplier.ts` | **COPY** | throttle reader |
| 5 | `src/games/crash/index.tsx` | `components/games/crash/imported-crash-game.tsx` **또는** `index.tsx` + loader | **ADAPT** | mock 제거 → `ImportedGameSurfaceProps` only · `mapGameSurfaceProps` wiring |
| 6 | `src/games/crash/Controls.desktop.tsx` | 동일 상대경로 | **COPY** | thin wrapper |
| 7 | `src/games/crash/Controls.mobile.tsx` | 동일 상대경로 | **COPY** | thin wrapper |
| 8 | `src/games/crash/HUD.tsx` | `components/games/crash/hud.tsx` | **COPY** | `casino-presence-ghost` (presentation) |
| 9 | `src/games/crash/__tests__/*` | 동일 상대경로 | **COPY+ADAPT** | import alias · pipeline mock → PHONARA test helpers |

**#P2.0-FROZEN 확인 (paste 시):** 위 1–8만 교체 · Stage/Context 로직은 Lovable 정본 그대로.

---

## 2. P2.0b · Shared AutoBet

| # | Lovable (덤프) | PHONARA 대상 | 액션 | 비고 |
|---|----------------|--------------|------|------|
| 10 | `src/games/shared/hooks/useAutoBetQueue.ts` | `components/games/shared/hooks/use-auto-bet-queue.ts` | **COPY** | `onWinReset`/`onLossReset` default true |
| 11 | `src/games/shared/AutoBetPanel.tsx` | `components/games/shared/auto-bet-panel.tsx` | **COPY** | 4× mode testids |
| 12 | `src/games/shared/BetPanel.tsx` | `components/games/shared/bet-panel.tsx` | **COPY** | `primarySize="xl"` opt-in |
| 13 | `src/games/shared/hooks/__tests__/useAutoBetQueue.test.ts` | 동일 | **COPY** | +4 P2.0b scenarios |
| 14 | `src/games/{crash,dice,limbo,hilo}/__tests__/Controls.test.tsx` | 동일 | **MERGE** | autobet toggle smoke 블록만 |

---

## 3. Shared 의존 — 선행 paste 여부 확인

Crash `index.tsx` / Controls가 import하는 shared. **PHONARA에 README placeholder만 있으면** Crush 전체 카지노 paste(12-N)와 함께 또는 **선행 1회 COPY**.

| Lovable | PHONARA | 액션 | Crash 필수 |
|---------|---------|------|------------|
| `src/games/shared/types.ts` | `components/games/shared/types.ts` | **ADAPT** | ✅ contract = `ImportedGameSurfaceProps` **PHONARA 정본 우선** · Lovable 필드 merge만 |
| `src/games/shared/BetConfirmDialog.tsx` | shared | **COPY** | ✅ RG testids |
| `src/games/shared/BetModeTabs.tsx` | shared | **COPY** | ✅ |
| `src/games/shared/RGGateProvider.tsx` | shared | **COPY** | ✅ `rg.gate("place_bet")` |
| `src/games/shared/GameDetailFrame` 등 casino shell | `presentation-import` / components | **DEFER** | P1.x 이미 GREEN면 일부 존재 |

---

## 4. ADAPT 전용 (COPY 금지 · Cursor 편집)

| Lovable | PHONARA | 이유 |
|---------|---------|------|
| `src/games/preview/useMockPipeline.ts` | — | **SKIP** · PHONARA = `useCasinoRoundPipeline` |
| `src/routes/casino.crash.tsx` | `routes/casino.tsx` 또는 thin `routes/casino.crash.tsx` | **ADAPT** · hook only · SEO 메타 merge |
| `@/i18n` import | `useT()` / `packages/i18n` | **ADAPT** · 키 merge 후 catalog |
| `dist-phonara-package.zip` | — | **SKIP** · operator ZIP GO 전 0 |
| `supabase/migrations/**` | `supabase/*` | **SKIP** · 엔진 정본 유지 |
| `.phonara-stage/**` | 참고만 | **SKIP** · 스테이징 복사본 |
| `.lovable/**` | — | **SKIP** |

---

## 5. i18n 키 merge (덤프 §2 기준)

### P2.0 Crash (ADD → `packages/i18n`)

| 키 | Lovable en (덤프) | 액션 |
|----|-------------------|------|
| `casino.crash.autoAt` | `Auto @ {mult}×` | **ADD** ko/en |
| `casino.crash.network_status` | Network Status | 있으면 유지 |
| `casino.crash.player_count` | `{a}/{b}` | 있으면 유지 |
| `casino.crash.next_round_in` | Starts in {s}s | 있으면 유지 |
| `casino.crash.crashed` | CRASHED | 있으면 유지 |
| `games.crash.prepare` | (Controls primary) | **ADD** · LOCK `prepareRound` 대신 Lovable 실키 |
| `games.crash.placeBet` | (Controls primary) | **ADD** |
| `games.crash.autoCashout` | (field label) | **ADD** |

### P2.0b AutoBet (ADD)

| 키 | 액션 |
|----|------|
| `casino.auto.modeReset` | **ADD** |
| `casino.auto.modeIncrease` | **ADD** |
| `casino.auto.increasePercent` | **ADD** |
| `casino.auto.resetOnWin` / `resetOnLoss` | Panel에서 쓰이면 **ADD** (덤프에 label 키 확인) |

**금지:** `casino.crash.cashoutEnginePending` (UX-1 superseded)

---

## 6. testid 정합 (E2E)

| testid | 덤프 위치 | PHONARA `casino-e2e-testids.ts` |
|--------|-----------|----------------------------------|
| `casino-cashout` | Controls.shared | **ADD** (E2E-A) |
| `casino-crash-multiplier` | Stage | optional smoke |
| `casino-stake-input` … `casino-bet-confirm-*` | BetPanel / BetConfirmDialog | ✅ 기존 정본 |
| `autobet-on-win-mode-reset` 등 4종 | AutoBetPanel | **ADD** smoke |
| `data-cta-mode="auto"` | Controls | E2E attribute assert |

---

## 7. Paste 순서 (operator GO 후 · Cursor)

```text
1. packages/i18n — §5 키 merge · check:i18n
2. shared — BetPanel · AutoBetPanel · useAutoBetQueue · BetConfirm · RGGate · BetModeTabs (없을 때)
3. crash — Context → useCrashLiveMultiplier → Stage → Controls → HUD → index ADAPT
4. map-game-surface-props + game-surface-loader — mock 0 · pipeline only
5. routes/casino* adapter — useCasinoRoundPipeline 유지
6. vitest crash + shared · E2E-A casino-cashout
7. gates: typecheck · build · check:i18n · check:release
```

---

## 8. §STOP 유지 (paste 후에도)

| 항목 | paste 후 PHONARA |
|------|------------------|
| `onCashout` prop | **없음** · `casino-cashout` disabled + `data-cta-mode="auto"` |
| 수동 cashout RPC | **없음** · 엔진 웨이브 별도 |
| `crashAt` | `bet.result.crashMultiplier` · replay only |
| client cashout eval | **FAIL** |

---

## 9. SKIP 요약 (이번 슬라이스 paste 범위 밖)

- `scripts/full-dump.sh` · `PROJECT_DUMP.md`
- 전체 `src/routes/*` (casino.crash 메타만 ADAPT)
- `src/components/casino/*` lobby (P1.x 별도)
- Trade P2a · Earn P3
- 엔진 웨이브 · Supabase

---

*P2.0+P2.0b paste map v1 · PROJECT_DUMP 2026-06-15 · operator 검증용*
