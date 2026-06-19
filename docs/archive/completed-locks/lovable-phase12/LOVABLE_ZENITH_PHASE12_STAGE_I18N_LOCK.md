# LOVABLE Phase 12 · Stage i18n LOCK — P2-Games Stage.tsx (L1-05)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — L1-04 12-D v0.2 §GREEN · catalog **1478**  
> **Scope:** `src/games/*/Stage.tsx` 잔여 한글 JSX literal → i18n key · **Stage 표면만**  
> **상위:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) L1-05 · [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md)

---

## Scope (1줄)

P2-Games **10종** `Stage.tsx`에 남은 **한글 JSX literal 전부** `games.<gameCode>.stage.*` i18n key로 이전 — **Controls · HUD · mobile/desktop Controls 0-touch**.

---

## 아키텍처

```text
Stage.tsx (10 games)
  → useT() / t('games.crash.stage.*') 등
  → src/i18n/ko.ts + en.ts 동일 key 추가
  → vitest · catalog ko=en DIFF=0

NO-TOUCH:
  Controls.tsx · Controls.mobile.tsx · Controls.desktop.tsx
  HUD · use* hooks · mock pipeline · Crash FROZEN md5 files
  Home L1-03 · Casino L1-02 · TradeHub L1-04 · games route wrappers
```

**FAIL =** Controls/HUD JSX [가-힣] 변경 · Stage 외 파일 i18n churn · catalog ko≠en

---

## 산출물

| 산출 | 경로 |
|------|------|
| Stage i18n | `src/games/{crash,limbo,dice,mines,hilo,plinko,mint-reels,gold-rush,roulette,blackjack}/Stage.tsx` |
| catalog | `src/i18n/ko.ts` · `src/i18n/en.ts` — **신규 key만** · 기존 key delete/rename **금지** |
| key namespace | `games.<gameCode>.stage.<semantic>` — gameCode = route slug와 동일 |

### 10게임 Stage 대상 (고정)

| # | gameCode | Stage path |
|---|----------|------------|
| 1 | crash | `src/games/crash/Stage.tsx` |
| 2 | limbo | `src/games/limbo/Stage.tsx` |
| 3 | dice | `src/games/dice/Stage.tsx` |
| 4 | mines | `src/games/mines/Stage.tsx` |
| 5 | hilo | `src/games/hilo/Stage.tsx` |
| 6 | plinko | `src/games/plinko/Stage.tsx` |
| 7 | mint-reels | `src/games/mint-reels/Stage.tsx` |
| 8 | gold-rush | `src/games/gold-rush/Stage.tsx` |
| 9 | roulette | `src/games/roulette/Stage.tsx` |
| 10 | blackjack | `src/games/blackjack/Stage.tsx` |

---

## i18n

- JSX/TSX **한글 literal 0** (Stage.tsx scope)
- EN mode에서 KO 노출 **0**
- tone: next-action · apology copy **금지**
- §GREEN: catalog **실측 N** · baseline **1478** 대비 **Δ 기록**

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | **Stage.tsx only** — Controls/HUD/shared game chrome **0-touch** |
| F2 | 기존 i18n key **delete/rename/meaning change 금지** |
| F3 | `games.<gameCode>.stage.*` namespace 고정 |
| F4 | P2-Games Controls P1–P3 gates **유지** (재EXECUTE 금지) |
| F5 | Crash FROZEN: index · Context · useCrashLiveMultiplier **md5 0-touch** |
| F6 | fireDelayMs/countdown 규칙 **유지** (Crash 5000+countdown · 나머지 320) |
| F7 | vitest baseline **82/2 · 384/4 NO-REGRESSION** (gold-rush/mint-reels jsdom) |
| F8 | ZIP · paste · PHONARA repo · engine **0** |

**FAIL =** F1/F5 위반 · Stage.tsx [가-힣] >0 · catalog DIFF≠0 · vitest regression · Controls P1 leak

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | 본 LOCK APPROVE · L1-04 §GREEN 확인 · catalog baseline **1478** 기록 |
| 1 | 10× `Stage.tsx` rg `[가-힣]` inventory → key 목록 draft |
| 2 | `ko.ts` / `en.ts` `games.*.stage.*` 추가 (ko=en parity) |
| 3 | Stage.tsx literal → `t(...)` 치환 · **Controls 0-touch** |
| 4 | EN locale smoke: Stage 문자열 KO leak **0** |
| 5 | vitest run — baseline **82/2 · 384/4** 유지 |
| 6 | catalog count 실측 · DIFF=0 |
| 7 | §GREEN report + evidence |
| 8 | §GREEN self-check **full block** (아래) 1회 실행 |

---

## §GREEN self-check (Step 8 · full block)

```bash
# Stage only — Korean JSX literal 0
rg "[\uAC00-\uD7A3]" src/games/*/Stage.tsx
# expect 0 hits

# Controls untouched — no new Korean in Controls (spot)
rg "[\uAC00-\uD7A3]" src/games/*/Controls*.tsx
# expect 0 hits (baseline; new hits = FAIL)

# key namespace
rg "games\.(crash|limbo|dice|mines|hilo|plinko|mint-reels|gold-rush|roulette|blackjack)\.stage\." src/i18n/ko.ts src/i18n/en.ts

# catalog parity (실측 N · Δ를 §GREEN 본문에 기록)
# wc -l or project catalog script — KO=EN · DIFF=0

# P1 wrapper leak unchanged
rg "XControlsShared\s*\{\.\.\.p" src/games/
# expect 0

# hex leak
rg "#[0-9a-fA-F]{3,8}" src/styles.css
# expect 0

# vitest baseline
# 82 pass files / 2 fail · 384 pass / 4 fail tests — NO-REGRESSION

# operator doc CJK
rg "[\u4e00-\u9fff]" docs/LOVABLE_ZENITH_PHASE12_STAGE_I18N_LOCK.md
# expect 0
```

---

## §GREEN template (Lovable 회신)

```text
§GREEN — L1-05 Stage i18n LOCK 완료.

Gate | 결과
Stage.tsx [가-힣] | 0 ✓
Controls/HUD | NO-TOUCH ✓
catalog | KO=N EN=N DIFF=0 ✓ (1478→N Δ=…)
vitest | 82/2 · 384/4 NO-REGRESSION ✓
P1 wrapper leak | 0 ✓
styles.css hex | 0 ✓
Crash FROZEN | NO-TOUCH ✓

Next DRAFT (1줄): L1-06 Pixi Plinko v2 — … ZIP/paste = 0.
```

---

## Defer

- Controls i18n (이미 0 또는 별도 슬라이스 — **본 LOCK 0**)
- Pixi Plinko v2 → **L1-06**
- paste · ZIP · `@phonara/i18n` merge → L2

---

## paste adapter memo

PHONARA paste 시 `@phonara/i18n` merge — **key id 동일** 유지 · Stage-only key는 catalog 파일 bulk import.

---

*operator REVIEW → APPROVE / REVISE / REJECT · FAIL = Stage [가-힣] >0 · Controls touch · catalog DIFF≠0*
