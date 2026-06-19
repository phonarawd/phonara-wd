# P1.8 · Stake Parity (PC Lobby + SideNav + Crash 통합) · LOCK v1 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1 · v4 §0·§10  
> **선행:** P1.7 GREEN (mobile-crush skin · frame · BetPanel)  
> **P1.7 amend:** `Stage.mobile-crush.tsx` **삭제** → `Stage.tsx` 단일 통합 (§3)  
> **실행 순서:** P1.5-A → P1.5-B → P1.7 → **P1.8** → P2a  
> **갱신:** 2026-06-15 · **승인** (micro-amend #P1.8-1~6)

---

## 사용자 피드백 (3건)

1. PC 카지노 로비 과밀 → Stake식 단순화  
2. PC SideNav 접기 필요  
3. Crash mobile/PC 분리 + 모바일 정적 → **단일 Stage + 라이브 곡선**

---

## LOCK 핵심

| 항목 | 결정 |
|------|------|
| SideNav | PC `w-56` ↔ `w-14` · `localStorage phonara.sidenav.collapsed` · 모바일 0 변경 |
| Lobby | BigWinHero/Jackpot 2-col/ticker 축소 → 슬림 ticker 1줄 · PC grid 6 cols |
| Crash Stage | **단일 `Stage.tsx`** · mobile 분기 0 · skin tokens · history chips 공통 |
| 애니메이션 | `useGameLoop` **표시 보간만** (PC 동일) · 목표 multiplier = **엔진 prop** (#P1.8-2) |
| P1.7 유지 | MobileGameFrame · BetPanel skin · BottomNav hidden · `--skin-*` (#P1.8-3) |
| 색/이름 | v4 + P1.7 동일 · hex TSX 0 · `stake` in src 0 |
| baseline | Step 0 vitest 실측 (#P1.8-6) |

**FAIL =** engine settlement/RNG in Stage · red-grep hit · SideNav mobile regression · testid 9종 손실 · vitest < Step 0 · `Stage.mobile-crush.tsx` 잔존 import

---

## 1. SideNav · PC 접기 (#P1.8-4)

**Edit:** `SideNav.tsx` · `AppShell.tsx`

- 펼침 `w-56` · 접힘 `w-14` (icon only · label hidden · hover tooltip)
- 토글: SideNav 헤더 chevron · `aria-expanded`
- State: `AppShell` owns → SideNav prop · `localStorage` SSR-safe read in effect
- TopBar 햄burger와 **동일 state** (이중 토글 불일치 금지)
- 모바일: `hidden md:flex` **무손실**

**i18n:** `nav.collapse` · `nav.expand` (ko/en)

---

## 2. Casino Lobby · Stake식 단순화

**Edit:** `ImportedCasinoPage.tsx`

**축소 (operator feedback · intentional #P1.8-5):**

- `BigWinHero` · `JackpotCountdown` · LiveWinTicker 2-col → **슬림 ticker 1줄**
- 큰 hero copy → 검색 + 카테고리 탭
- `TournamentsSection` → hot 탭 하단 `<details>` accordion

**유지:**

- `SearchTrigger` sticky · `CasinoCategoryTabs` · HotGamesRow 가로 1줄
- 그리드: `aspect-[3/4]` · PC `lg:grid-cols-6` · mobile 2 cols
- hover: `translate-y-[-2px]` + `shadow-skin` (token in styles.css)

**Note:** FOMO feed logic hooks **삭제 0** — UI 배치만 축소 · mock ticker 1줄 유지 가능

---

## 3. Crash Stage 통합 (P1.7 Stage 섹션 supersede)

### 원칙 (#P1.8-2)

| OK | FAIL |
|----|------|
| `useGameLoop` lerp toward **engine `targetMultiplier` prop** | Stage 내 bet/settle/RNG |
| Canvas/rocket **표시** 60fps mobile+PC | `Math.exp`로 **결과** 결정 |
| `prefers-reduced-motion` → static frame | — |

P1.7 "multiplier 재계산 0" = **엔진 settlement 재계산 0** (표시 보간은 PC Stage parity로 **허용**)

### 구현

**DELETE:** `src/games/crash/Stage.mobile-crush.tsx`

**EDIT:** `Stage.tsx`

- skin tokens (`--skin-success` / `--skin-danger` — hex TSX 0)
- History chip strip (`recentBets` prop) · mobile+PC 공통
- Multiplier: `font-display` · `clamp(48px, 8vw, 96px)` · stroke `--skin-danger`
- `aspect-[4/3] md:aspect-[16/10]`
- `useGameLoop` live curve + rocket (mobile = PC)
- FairnessSheet 위치 유지

**EDIT:** `crash/index.tsx` — mobile 분기 **제거** · 단일 `<Stage />`

**KEEP:** `crash-rocket.svg.asset.json` · P1.7 MobileGameFrame wrap (layout only)

---

## 4. 파일 매트릭스 (~10)

| # | 파일 | N/E/D |
|---|------|-------|
| 1 | `SideNav.tsx` | EDIT |
| 2 | `AppShell.tsx` | EDIT |
| 3 | `ImportedCasinoPage.tsx` | EDIT |
| 4 | `Stage.tsx` | EDIT |
| 5 | `crash/index.tsx` | EDIT |
| 6 | `styles.css` | EDIT (sidenav + shadow-skin) |
| 7 | `Stage.mobile-crush.tsx` | **DELETE** |
| 8 | `ko.ts` / `en.ts` | EDIT (+2) |

**P1.7 NO-TOUCH (본 슬라이스):** BetPanel testid · hideMobileNav · MobileGameFrame structure

---

## 5. EXECUTE Step 0 → 6

**Step 0** — vitest baseline · `rg Stage.mobile-crush` import audit · red-grep 0

**Step 1** — AppShell + SideNav collapse + i18n 2 keys

**Step 2** — ImportedCasinoPage lobby simplify

**Step 3** — Stage.tsx unify (skin + chips + useGameLoop + delete mobile-crush)

**Step 4** — crash/index.tsx single Stage

**Step 5** — styles.css sidenav/shadow tokens

**Step 6** — §GREEN · mobile-crush.md §P1.8 amend note

---

## 6. §GREEN self-check

```bash
bun run test 2>&1 | tail -5
scripts/red-grep.sh
rg "Stage\.mobile-crush" src/ && exit 1 || true
rg -n "stake" src/ && exit 1 || true
scripts/i18n-parity.sh
# manual: SideNav collapse PC · mobile SideNav hidden unchanged
# manual: /casino/crash mobile live curve animates (not static)
# manual: Stage — no rpc/bet/settle imports
```

---

## 7. GREEN Gates

1. vitest ≥ Step 0 baseline  
2. red-grep 0 · stake in src 0  
3. `Stage.mobile-crush` 0 references  
4. SideNav collapse + localStorage persist  
5. Lobby PC 6-col · slim ticker  
6. Crash mobile+PC same Stage · live animation  
7. testid 9종 PASS  
8. Engine boundary: Stage no settlement logic  

---

## 8. 마감 보고

```text
P1.8 GREEN · SideNav collapse · Lobby Stake-slim · Crash unified Stage · live mobile+PC · vitest baseline maintained
```

---

## Out of scope

9-game Stage clone · Live Bets WS · auth header wire · Plinko flake

---

*P1.8 v1 정본 · 2026-06-15*
