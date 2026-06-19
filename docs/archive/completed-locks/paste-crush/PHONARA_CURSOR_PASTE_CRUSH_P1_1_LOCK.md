# P1.1 · Casino "Alive" Patch — v2 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1(12-N) 직후 · v4 §0·§10·PWA LOCK  
> **범위:** `/casino` presentation-only · mock feed · 엔진 NO-TOUCH  
> **선행:** P1(12-N) 7컴포넌트 + `ImportedCasinoPage` GREEN  
> **갱신:** 2026-06-15

---

## 검토 반영 (v1 → v2)

- 14파일 → **2 슬라이스** (§0-5: 5~9 파일/슬라이스)
- 한글 UI 문구 → **i18n 키** (`casino.live.*`, `casino.ticker.*`, `casino.feed.*`, `casino.game.<id>.name`)
- `useLiveCount` vitest 2케이스 (reduced-motion · hydrate tick)
- 이미지 `alt={i18nName}` + `width`/`height` 고정 (CLS)
- GameCard 그라데이션 **토큰만** (`from-background/95`)

---

## 슬라이스 P1.1a — Live Layer (9 logical · 10 paths)

포스터 없이 즉시 "살아 움직임". GameCard는 P1 텍스트 라벨 유지.

| # | 파일 | N/E | 역할 |
|---|------|-----|------|
| 1 | `src/hooks/useLiveCount.ts` | NEW | seed → 1.2~2.5s 간격 ±0.8~3% 랜덤워크(정수). SSR=seed · mount 후 effect 첫 tick. `prefers-reduced-motion` → seed 고정. |
| 2 | `src/hooks/useLiveTickerFeed.ts` | NEW | pool 무중복 회전 큐 · visible N · `tick` (react key). 1800ms. reduced-motion → 정적 슬라이스. |
| 3 | `src/hooks/__tests__/useLiveCount.test.tsx` | NEW | (a) reduced-motion → seed 고정 (b) fake timer tick 후 값 변동 |
| 4 | `src/data/casino-feed.ts` | NEW | 닉네임 KR30+EN30 (마스킹 `yuna**`/`이준***`/`alex_***`/`mike91*`), 게임 풀, 금액 범위, 통화 ₩70/USDT30. **i18n 키 없음**. |
| 5 | `src/components/casino/LiveWinTicker.tsx` | EDIT | `useLiveTickerFeed(3, pool)` · 슬라이드 `animate-fade-in` · 헤더 `useLiveCount(1_247_330)` + `casino.live.onlineCount` / `casino.ticker.title` |
| 6 | `src/components/casino/JackpotCountdown.tsx` | EDIT | `key={floor(pool/10000)}` + `animate-scale-in` · ≤10s amber→rose |
| 7 | `src/components/casino/BigWinHero.tsx` | EDIT | amount `animate-fade-in` · 파티클 22 · 골드 펄스 글로우 |
| 8 | `src/components/casino/GameCard.tsx` | EDIT | `live` → `useLiveCount(live)` · `key={live}` `animate-fade-in` (포스터는 1.1b) |
| 9 | `src/i18n/{ko,en,ja,zh}.ts` | EDIT | **4언어 동시** · 신규 키 parity. 예: `casino.live.onlineCount`, `casino.ticker.title`, `casino.feed.winLine`, `casino.bigwin.glow` |

**§0-5 카운트:** #9 = i18n 4파일이나 **1 logical unit** (9 슬라이스로 인정).

### Gate (P1.1a)

| 항목 | FAIL |
|------|------|
| vitest | 기존 baseline + **+2** 실패 |
| red-grep | §10 · 한글 JSX · 금지 color |
| hydrate | 콘솔 mismatch 0 |
| sitemap | **슬라이스 시작 실측 N 불변** (`rg -c "<url>" public/sitemap.xml`) |

---

## 슬라이스 P1.1b — Poster Layer (2 code + 10 assets)

게임당 포스터 1장 · Lovable Assets CDN pointer (레포 경량 · LCP).

| # | 파일 | N/E | 역할 |
|---|------|-----|------|
| 1~10 | `src/assets/casino/<game>.jpg.asset.json` | NEW | imagegen `fast` 768×576(4:3) → `lovable-assets create` → pointer JSON. crash · plinko · mines · dice · limbo · hilo · blackjack · roulette · mint-reels · gold-rush |
| 11 | `src/components/casino/GameCard.tsx` | EDIT | `<img poster>` 풀블리드 + 하단 토큰 그라데이션 + i18n 이름 |
| 12 | `ImportedCasinoPage.tsx` + `HotGamesRow.tsx` | EDIT | `poster` + `casino.game.<id>.name` wire |

**§0-5 카운트:** 10 asset pointer = **1 logical batch** + code 3 = **2 슬라이스 내 1 턴** (이미지 병렬 생성 후 pointer 일괄 커밋).

### 포스터 (Stake 풍 다크+네온 · 모노그램 1단어)

| 게임 | 모티프 |
|------|--------|
| crash | 로즈 + 로켓 트레일 · CRASH |
| plinko | 에메랄드 핀보드 · 공 라이트트레일 |
| mines | 앰버 격자 · 다이아/폭탄 |
| dice | 스카이 · 3D 주사위 |
| limbo | 바이올렛 · ×88.88 네온 |
| hilo | 틸 카드 · ↑↓ |
| blackjack | 에메랄드 펠트 · A♠ K♥ |
| roulette | 로즈 휠 · 모션블러 |
| mint-reels | 시안 릴 · 7-7-7 |
| gold-rush | 앰버 골드바 · 잭팟 빔 |

### Gate (P1.1b)

| 항목 | FAIL |
|------|------|
| 이미지 | 장당 > 80KB · alt 0 · width/height 0 |
| Lighthouse mobile | LCP ≥ 2.0s · CLS ≥ 0.05 |
| red-grep | §0-1 위반 |

---

## Hydration 안전 (양 슬라이스)

- 랜덤/시간: `useState(seed)` → `useEffect` 첫 tick
- `Math.random()` / `Date.now()` → **effect 내부만**
- SSR HTML = 클라이언트 첫 paint (JackpotCountdown 패턴)

---

## §GREEN self-check (마감 시 복붙)

```bash
rg -i "WatchCard|AdCard|mission\.ad|rewarded|offerwall" src/components/casino src/hooks src/data && exit 1 || true
rg "[가-힣]" src/components/casino src/hooks/useLive* src/data/casino-feed.ts --glob '!**/*.test.*' && exit 1 || true
rg "bg-\[#|text-white|text-black|bg-white|bg-black|oklch\(" src/components/casino src/hooks src/data && exit 1 || true
bunx vitest run src/hooks/__tests__/useLiveCount.test.tsx
```

---

## 실행 순서

```text
P1(12-N) GREEN → P1.1a 한 턴 → 검수 → P1.1b 한 턴
```

### 1줄 보고

| Turn | 보고 |
|------|------|
| P1.1a | `P1.1a GREEN · live hooks+ticker · sitemap N · vitest +2` |
| P1.1b | `P1.1b GREEN · 10 posters CDN · GameCard img · LCP/CLS OK` |

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| `src/hooks/useLive*.ts` | `apps/web/src/hooks/` (presentation shim OK) |
| `src/data/casino-feed.ts` | `apps/web/src/lib/casino-feed.ts` |
| `src/assets/casino/*.asset.json` | `apps/web/public/` 또는 CDN URL 그대로 |
| `src/i18n/*` | `packages/i18n` merge |

---

*P1.1 v2 정본 · 2026-06-15*
