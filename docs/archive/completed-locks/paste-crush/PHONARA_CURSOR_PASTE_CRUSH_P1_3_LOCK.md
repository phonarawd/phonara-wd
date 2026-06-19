# P1.3 · Game Detail Alive — v1 (정본) · ✅ GREEN

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1 라인 · v4 §0·§10·PWA LOCK  
> **선행:** P1(12-N) · **P1.1a/b GREEN** · **P1.2** (목록 토너먼트/리더보드)  
> **범위:** `/casino/<game>` presentation-only · 엔진 NO-TOUCH · mock/display  
> **갱신:** 2026-06-15 · **GREEN** (vitest **358/358** · §10 red-grep 0)

---

## 왜 P1.3인가

P1.1(Hot Row) + P1.2(Tournaments/Leaderboard)로 `/casino` **목록**은 완성. 카드 클릭 후 `/casino/<game>` 10페이지가 정적이면 P1 반쪽. **P2(Trade) 전** 카지노 라인 완결 — v4 체류·LCP·라인 정합성.

**권장:** **A Game Detail Alive** ✅  
**Defer:** B Search(⌘K) P1.2 겹침 · C Sticky Quick-Bet HUD BottomNav 충돌 · D P2 점프(카지노 불완전)

---

## as-built (GREEN 실측)

| 구분 | 산출물 |
|------|--------|
| 신규 3 | `casino-game-meta.ts` · `useGameRecentWins.ts` · `GameDetailFrame.tsx` |
| 편집 12 | `casino.<10게임>.tsx` thin wrap + `i18n/ko.ts` · `i18n/en.ts` (+23 keys) |
| 아키텍처 | 4패널 계획 → **`GameDetailFrame` 단일 프레임** (Hero · 24h Stats · Recent Wins · Paired) |
| 라우트 | `casino.$game` 동적 1파일 대신 **게임별 10 thin route** — `children`으로 engine surface만 렌더 |
| 게이트 | `usePageVisible` + `useInView` · semantic token only · mutation 0 |

**1줄 보고:** `P1.3 GREEN · GameDetailFrame · 10 routes · vitest 358/358 · §10 0`

> **paste 메모:** PHONARA 이식 시 10 route → thin `casino.$game.tsx` 1파일 + param 분기로 **축소 권장** (중복 제거).

---

## 계획 대비 (참고)

| 계획 | as-built |
|------|----------|
| 4 panel 파일 | `GameDetailFrame.tsx` 1파일 통합 |
| `casino.$game.tsx` 1개 | `casino.<game>.tsx` ×10 thin |
| i18n 4언어 | ko/en (+23) — **ja/zh는 paste merge 시 parity** |

---

공유 컴포넌트 1세트 → 10게임 동일 레이아웃 · `game` param으로 메타/필터 분기.

| # | 파일 | N/E | 역할 |
|---|------|-----|------|
| 1 | `src/components/casino/detail/GameHeroPanel.tsx` | NEW | P1.1b 포스터 재사용 · `useLiveCount` 플레이어 · RTP/Volatility 배지 · Play CTA (**presentation** · mutation 0) |
| 2 | `src/components/casino/detail/RecentWinsPanel.tsx` | NEW | 게임 한정 최근 승 8건 · `useGameRecentWins` · 5.5s rotate · `usePageVisible`+`useInView` |
| 3 | `src/components/casino/detail/PairedGamesPanel.tsx` | NEW | paired 4장 · `GameCard` 재사용 |
| 4 | `src/components/casino/detail/GameStatsStrip.tsx` | NEW | 24h 베팅/최대승/평균배당 3칸 · `useCountUp` · visibility 게이트 |
| 5 | `src/data/casino-game-meta.ts` | NEW | 10게임 RTP · Volatility · min/max bet · paired IDs (정적) |
| 6 | `src/hooks/useGameRecentWins.ts` | NEW | `useLiveTickerFeed` 게임 필터 wrapper · 시드 고정 |
| 7 | `src/hooks/__tests__/useGameRecentWins.test.tsx` | NEW | (a) gameId 필터 (b) reduced-motion 정적 |
| 8 | `src/routes/casino.$game.tsx` | EDIT | 4패널 조합 · mobile stack / desktop 2col (라우트 없으면 **이 파일만** NEW — §0-5에 포함) |
| 9 | `src/i18n/{ko,en,ja,zh}.ts` | EDIT | **4언어 parity** · `casino.detail.*` · `casino.stats.*` · `casino.game.<id>.volatility` 등 |

**§0-5:** #7 test + #9 i18n 4파일 = P1.1 패턴과 동일 · **9 logical 슬라이스 1턴**.

---

## 성능 LOCK (P1.2 룰 계승)

| 규칙 | 적용 |
|------|------|
| 타이머 게이트 | 모든 카운터·로테이터 `usePageVisible` + `useInView` |
| 동시 타이머 | 상세 1게임 · **≤ 4** |
| LCP | Hero 포스터 `loading="eager"` · `fetchpriority="high"` · 나머지 lazy |
| reduced-motion | 카운트업·로테이트 → 즉시 최종값 |
| Hydration | P1.1a 규약 (seed → effect tick) |

**선행 훅:** `usePageVisible` · `useCountUp` · `useInView` — P1.2 또는 `src/hooks/`에 존재 가정. 없으면 **P1.3 착수 전** 동일 패턴으로 추가(별도 micro-slice 또는 P1.2 잔여).

---

## v4 §0 / §10

- 한글 JSX 리터럴 **0** · mock 닉네임은 `casino-feed.ts`만
- `bg-[#` · `text-white|black` · `oklch(` 금지 → semantic token
- ad/sensor/watch/SW **0**
- balance/bet/win **mutation 0** · CTA = toast/nav only

---

## §GREEN self-check

```bash
rg -i "WatchCard|AdCard|mission\.ad|rewarded|offerwall" src/components/casino/detail src/hooks/useGameRecentWins.ts && exit 1 || true
rg "[가-힣]" src/components/casino/detail src/hooks/useGameRecentWins.ts src/data/casino-game-meta.ts --glob '!**/*.test.*' && exit 1 || true
rg "bg-\[#|text-white|text-black|oklch\(" src/components/casino/detail && exit 1 || true
bunx vitest run src/hooks/__tests__/useGameRecentWins.test.tsx
# sitemap: 슬라이스 시작 실측 N 불변
```

---

## Gate

| 항목 | FAIL |
|------|------|
| vitest | baseline + **+2** (`useGameRecentWins`) |
| Lighthouse mobile | LCP ≥ 2.0s (hero eager) · CLS ≥ 0.05 |
| 10게임 | 동일 레이아웃 · param별 메타/필터만 분기 |
| Play CTA | RPC/bet 호출 0 |

---

## 실행 순서

```text
P1.1a/b GREEN → P1.2 GREEN → P1.3 한 턴 → P2(12-O)
```

**1줄 보고:** `P1.3 GREEN · game detail 4 panels · 10 routes alive · vitest +2`

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| `src/components/casino/detail/*` | `apps/web/src/components/casino/detail/` |
| `src/data/casino-game-meta.ts` | `apps/web/src/lib/casino-game-meta.ts` |
| `src/routes/casino.$game.tsx` | `apps/web/src/routes/casino.$game.tsx` (thin) + `presentation-import/pages/` |

---

*P1.3 v1 정본 · 2026-06-15*
