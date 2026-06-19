# Route Dedup — `/games` → `/casino` 단일화 — v2 (최종 정본) · ✅ GREEN

> **상위:** P1.x · P1.4 ⌘K · [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) v4 §0  
> **갱신:** 2026-06-15 · **GREEN** (vitest 366 · links 0 · sitemap clean)

---

## as-built (GREEN 실측)

| 구분 | 결과 |
|------|------|
| redirect 6 | `games.*` + `casino.hub` · `beforeLoad` + `replace:true` · 첫 paint부터 새 경로 |
| 신규 3 | `casino.history` · `casino.fairness` · `casino.tournaments` · 컴포넌트 재사용 |
| link 7 | `to="/games"` **0** · `ImportedHomePage` Shortcut union → `/casino` |
| sitemap | `/games*` · `/casino/hub` 제거 · `/casino/{history,fairness,tournaments}` 추가 |
| flake | plinko jsdom canvas teardown — **기존** · 33/33 PASS · 변경 무관 |

**1줄 보고:** `Route Dedup GREEN · /games→/casino redirect · links 0 · sitemap clean · vitest +1`

---

## 변경 매트릭스 (17 files)

### A. Redirect 변환 (6)

| 파일 | 동작 |
|------|------|
| `games.index.tsx` | `beforeLoad` → `redirect({ to: '/casino', replace: true })` |
| `games.$gameId.tsx` | → `/casino/$gameId` (10종 화이트리스트 · 그 외 `/casino`) |
| `games.history.tsx` | → `/casino/history` |
| `games.fairness.tsx` | → `/casino/fairness` |
| `games.tournaments.tsx` | → `/casino/tournaments` |
| `casino.hub.tsx` | → `/casino` |

- `component` 필드 **제거**
- `replace: true` — history 오염 0
- SSR 단계 점프
- `games.tsx` (`<Outlet />` layout) **유지**

화이트리스트: `casino-game-meta` / 10 `casino.<game>.tsx` id와 **단일 소스** (redirect 파일 내 중복 맵 금지).

### B. 신규 정본 라우트 (3)

| 파일 | 컴포넌트 |
|------|----------|
| `casino.history.tsx` | `ImportedGamesHistoryPage` |
| `casino.fairness.tsx` | `ImportedGamesFairnessPage` |
| `casino.tournaments.tsx` | `ImportedGamesTournamentsPage` |

`head()` canonical · `og:url` → `/casino/*` only. 컴포넌트 본문 **NO-TOUCH**.

### C. Link 교체 (7)

`to="/games"` → `to="/casino"`:

| 파일 |
|------|
| `HomeGamesTeaserCard.tsx` |
| `ImportedHomePage.tsx` |
| `ImportedLandingPage.tsx` |
| `ImportedCasinoPage.tsx` |
| `ImportedGamesHistoryPage.tsx` |
| `TradeGamesTeaserCard.tsx` |
| `GameBackLink.tsx` |

### D. sitemap (`public/sitemap.xml`)

**제거:** `/games`, `/games/fairness`, `/games/history`, `/games/tournaments`, `/casino/hub`

**추가:** `/casino/history`, `/casino/fairness`, `/casino/tournaments` (priority 0.5~0.6)

슬라이스 시작 **N** → 종료 **N′** (Δ=0 또는 문서화).

---

## NO-TOUCH

- `src/games/**`
- `casino.<game>.tsx` ×10
- `CasinoHub.tsx` (dead code)
- BottomNav · SideNav
- i18n `casino.hub.*`

---

## LOCK

- Hangul literal **0** · `bg-[#` · `text-white|black` **0**
- `beforeLoad + replace:true` only — 옛 화면 paint **0**

---

## 테스트

`src/routes/__tests__/route-redirects.test.tsx` — 4케이스:

| from | to |
|------|-----|
| `/games` | `/casino` |
| `/games/crash` | `/casino/crash` |
| `/games/unknown` | `/casino` |
| `/casino/hub` | `/casino` |

목표: **365 → 366 PASS**

---

## 마감 게이트

```bash
rg 'to="/games"' src --glob '!**/*.test.*' && exit 1 || true
rg 'href="/games' src --glob '!**/*.test.*' && exit 1 || true
bunx vitest run src/routes/__tests__/route-redirects.test.tsx
```

---

## 스모크 (45초)

1. `/games` → 첫 paint부터 `/casino`
2. `/games/crash` → `/casino/crash` GameDetailFrame
3. `/games/unknown` → `/casino`
4. `/casino/hub` → `/casino`
5. Home/Landing/Trade CTA → `/casino`
6. BottomNav → `/casino`
7. `/casino/history` · `fairness` · `tournaments` OK
8. ⌘K → `/casino/crash` (P1.4 연동)

---

## 비범위

- `src/games/` 리팩터 · `CasinoHub.tsx` 삭제 · P1.5

---

## PHONARA paste

- Lovable thin redirect 흡수
- engine `casino.tsx` 유지 · presentation redirect만 정리

---

## 마감 보고

`Route Dedup GREEN · /games→/casino redirect · links 0 · sitemap clean · vitest +1`

---

*Route Dedup v2 최종 · 2026-06-15*
