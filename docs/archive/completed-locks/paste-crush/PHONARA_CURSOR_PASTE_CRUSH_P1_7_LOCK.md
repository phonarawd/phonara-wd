# P1.7 · Mobile Apex v2 (mobile-crush skin · Crash 1:1) · LOCK v1 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1 · v4 §0·§10  
> **P1.6:** 흡수·폐기  
> **실행 순서:** **P1.5-A → P1.5-B → P1.7** · **P2a = P1.7 GREEN 이후**  
> **갱신:** 2026-06-15 · **§GREEN LOCK 확정**

---

## LOCK 핵심 (확정)

| 항목 | 결정 |
|------|------|
| 색 | hex → `src/styles.css` only · TSX = `bg-skin-*` / `bg-bet-*` |
| 이름 | `mobile-crush` · `--skin-*` / `--bet-*` · "Stake" = operator docs만 |
| BottomNav | in-game hidden (A) · `/casino/*` 10 routes 전수 audit |
| MAX | mobile hidden · testid DOM 유지 (`hidden md:inline-flex`) |
| Crash | `Stage.mobile-crush.tsx` 1:1 · **display props only · multiplier 재계산 0** (P1.7-9) |
| 9게임 | frame 톤만 상속 · Stage clone = **P1.8+** |
| GameDetailFrame | **desktop tree 0 변경 · mobile 분기 1곳만 EDIT** (P1.7-8) |
| 데스크톱 | P1.5-B visual diff **0** |
| baseline | **Step 0 vitest 실측** · 카운트 주장만 GREEN 금지 (P1.7-10) |

**FAIL =** red-grep hit · `stake` in `src/**` · BottomNav on `/casino/*` mobile · desktop Crash visual Δ · testid 9종 중 1개 제거 · Stage multiplier 로컬 재계산

---

## EXECUTE Step 0 → 8

### Step 0 · Baseline & Audit (실측)

- `bun run test` → PASS/FAIL 카운트 → `docs/checkpoints/crash/mobile-crush.md` **§baseline**
- `rg 'createFileRoute\("/casino/' src/routes` → 10 routes · `hideMobileNav` 누락 표
- red-grep baseline 0 확인

### Step 1 · skin tokens (`src/styles.css`)

- `:root { --skin-bg / --skin-surface / --skin-surface-2 / --skin-border / --skin-fg / --skin-fg-dim / --skin-fg-muted / --bet-primary / --bet-primary-fg / --bet-accent / --bet-accent-fg / --skin-success / --skin-danger }` (**hex literal 여기만**)
- `@theme inline { --color-skin-bg: var(--skin-bg); … --color-bet-accent: var(--bet-accent); … }`
- TSX: `bg-skin-surface`, `text-skin-fg-dim`, `bg-bet-accent` 등 semantic 유틸

### Step 2 · 폰트 (`src/routes/__root.tsx`)

- `preconnect` fonts.googleapis / gstatic (crossOrigin)
- **Inter:** stylesheet + `preload as="style"`
- **Archivo Black:** stylesheet only (preload **없음**)
- `@theme { --font-sans: "Inter", system-ui, sans-serif; --font-display: "Archivo Black", "Inter", sans-serif; }`

### Step 3 · Frame

**NEW**

- `MobileGameFrame.tsx` — 재작성 (Sheet 폐기) · 56px 헤더 + game card + controls + side stack
- `MobileSideStack.tsx` — Live/Top24h/HowTo/Fair · `<details>` collapsible · `IntersectionMount` lazy

**EDIT**

- `GameDetailFrame.tsx` — **mobile 분기 1곳만:**

```tsx
useIsMobile() ? <MobileGameFrame>{children}</MobileGameFrame> : <desktop tree 그대로>
```

데스크톱 tree **0 변경**.

### Step 4 · Crash Stage 1:1

**NEW**

- `src/games/crash/Stage.mobile-crush.tsx`
  - **Props in only:** `multiplier`, `phase`, `history[]`, `playerCount`, `networkOk` — 로컬 재계산 **0**
  - 히스토리 칩 (≥2× → `bg-skin-success/15`)
  - canvas 곡선 (line `--skin-fg-dim`, fill gradient, 격자 0)
  - 로켓 SVG endpoint
  - multiplier overlay (`font-display` 96px + stroke `--skin-danger`)
  - 상태 알약 idle/running/crashed
  - 메타바 · reduced-motion 정적 frame
- `src/assets/crash-rocket.svg.asset.json`

**EDIT**

- `src/games/crash/index.tsx` — mobile → `Stage.mobile-crush` · desktop → `Stage.tsx` 유지

### Step 5 · Controls 톤매칭 (testid 무손실)

- `BetPanel.tsx` — MAX `hidden md:inline-flex` (DOM/testid 유지)
- skin scope 색: `bg-skin-surface-2`, BET `bg-bet-accent` / `bg-bet-primary`
- 통화 토글 · 캡슐 Manual|Auto · stepper UI (HTML/CSS only)
- testid 9종 전수 PASS:
  - `stake-input`, `prepare-hash`, `place-bet`, `error`, `client-seed-input`, `fairness-verifier`, `bet-confirm`, `bet-confirm-confirm`, `bet-confirm-cancel`

### Step 6 · 9-game tone + BottomNav audit

- 9 routes mobile → MobileGameFrame 카드/색/spacing 상속 smoke
- 누락 route → `<AppShell density="app" hideMobileNav>`
- 모바일 BottomNav **0 노출**

### Step 7 · i18n (7 keys × ko/en)

- `casino.bet.next_round` · `profit_on_win` · `cashout_at`
- `casino.crash.network_status` · `player_count` · `next_round_in` · `crashed`
- `scripts/i18n-parity.sh` PASS

### Step 8 · GREEN report + docs

- `bun run test` ≥ Step 0 baseline (실측)
- `scripts/red-grep.sh` 0
- `rg "stake" src/` 0 (operator docs 제외)
- `docs/checkpoints/crash/mobile-crush.md`:
  - §baseline · §Stake reference (operator only) · §file map · §testid map · §GREEN gates

---

## 영향 파일

**신규 (4)**

- `src/components/casino/detail/MobileSideStack.tsx`
- `src/games/crash/Stage.mobile-crush.tsx`
- `src/assets/crash-rocket.svg.asset.json`
- `docs/checkpoints/crash/mobile-crush.md`

**편집 (8)**

- `src/styles.css`
- `src/routes/__root.tsx`
- `src/components/casino/detail/MobileGameFrame.tsx`
- `src/components/casino/detail/GameDetailFrame.tsx`
- `src/games/crash/index.tsx`
- `src/games/shared/BetPanel.tsx`
- `src/routes/casino.*.tsx` (hideMobileNav)
- `src/i18n/{ko,en}.ts`

---

## §GREEN self-check (full block)

```bash
bun run test 2>&1 | tail -5
scripts/red-grep.sh
rg -n "stake" src/ && exit 1 || true
scripts/i18n-parity.sh
rg "bg-\[#|text-white|text-black|oklch\(" src/components src/games --glob '!**/lovable-globals.css' && exit 1 || true
rg -i "WatchCard|AdCard|mission\.ad" src/components/casino src/games/crash && exit 1 || true
rg "[가-힣]" src/components/casino/detail src/games/crash/Stage.mobile-crush.tsx --glob '!**/*.test.*' && exit 1 || true
rg "framer-motion" src/components/casino src/games/crash && exit 1 || true
# manual: /casino/* mobile BottomNav 0 · desktop /casino/crash visual diff 0
# manual: Stage.mobile-crush — multiplier 산술 0 (props only)
```

---

## GREEN Gates (8)

1. `bun run test` ≥ Step 0 baseline (실측)
2. `scripts/red-grep.sh` = 0
3. `rg -n "stake" src/` = 0
4. `scripts/i18n-parity.sh` PASS
5. `/casino/*` 모바일 BottomNav 0
6. 데스크톱 `/casino/crash` visual diff 0
7. testid 9종 DOM 존재 (MAX hidden on mobile)
8. Stage.mobile-crush multiplier 산술 0

---

## 마감 보고

```text
P1.7 GREEN · mobile-crush skin · Crash 1:1 · 9/9 tone · BottomNav hidden in-game · desktop 0 · testid PASS
```

---

## Out of scope (P1.8+)

9 Stage 1:1 clone · Live Bets WS · header auth wire · Plinko canvas flake (실기기)

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| skin tokens | `presentation-import/styles/` merge |
| `MobileGameFrame` · `Stage.mobile-crush` | paste 후 mobile branch |

**PHONARA repo:** 소스 미존재 → **Lovable EXECUTE 전용**

---

*P1.7 LOCK v1 정본 · 2026-06-15*
