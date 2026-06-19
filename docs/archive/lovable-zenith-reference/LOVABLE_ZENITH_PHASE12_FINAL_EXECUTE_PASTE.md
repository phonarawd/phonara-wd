# Phase 12 끝판왕 — Lovable EXECUTE 카드 (12-F→12-A→12-G · operator GO)

> **정본:** [`LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md`](LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md)

---BEGIN---

# PHONARA 끝판왕 · 12-F + 12-A + 12-G 병렬 GO

**결론:** **「병렬 GO」** — 3 슬라이스 독립 PASS · RED 시 해당 안만 revert · 나머지 carry · **~2h15m**.

**첫 응답 1줄:** `끝판왕 병렬 GO (12-F→12-A→12-G) 수령 · 12-F Step 0 착수.`

**catalog chain:** 1165 → **1177** → **1201** → **1229** · sitemap **43** hold · vitest **356/356** (#D-13 output assert · each slice)

**i18n path (Lovable):** `src/i18n/locales/ko.json` · `src/i18n/locales/en.json` (+ `scripts/i18n-parity.sh`)

---

## 공통 NO-TOUCH

- `src/routes/trade.tsx` · `src/routes/trade.hub.tsx` (12-D v0.1.1)
- `ImportedTradePage` + 8 `Trade*` · ImportedPages **40**
- `src/components/fomo/` legacy **7** · `routeTree.gen.ts` 수동편집 금지
- 결제/원장/RPC/Supabase · `src/games/**` engine

---

# 슬라이스 1 · 12-F Home FOMO v0.1 (P0 · ~30min)

**왜:** Rollbit countdown/streak + 국내앱테크 즉시보상 · 첫 3초 압살.

**CREATE**

| file | spec | data-hub-id |
|------|------|-------------|
| `LiveActivityFeed.tsx` | mock 8-row rolling ticker (당첨/적립) | `home-fomo-live` |
| `StreakRing.tsx` | 일일 연속 출석 ring + 보상 미리보기 | `home-fomo-streak` |
| `LimitedDropCard.tsx` | countdown + "X명 참여중" badge | `home-fomo-drop` |

**EDIT**

- `HomeHub.tsx` — **6 slot 보존 + 3 append = 9** · H1~H6 **변경 0**
- `ko.json` / `en.json` — **+12** (`home.fomo.live.*` · `home.fomo.streak.*` · `home.fomo.drop.*`)

**Gate:** vitest 356/356 · catalog **1177** · ko=en · sitemap=43 · **기존 6 `data-hub-id` Δ=0**

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }
git diff src/routes/home.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" && fail "R-F1" || echo "OK R-F1"
git diff src/components/home/ | rg '^[+-].*data-hub-id' | rg -v 'fomo-live|fomo-streak|fomo-drop' \
  && fail "R-F2 legacy hub-id drift" || echo "OK R-F2 legacy ids"
SLOTS=$(rg -oN 'data-hub-id="home-[^"]+"' src/components/home/ | wc -l | tr -d ' ')
[ "$SLOTS" = "9" ] || fail "R-F2 slots=$SLOTS"
git diff --quiet -- src/components/fomo/ || fail "R-F3"
bash scripts/i18n-parity.sh || fail "i18n"
URLN=$(rg -c '<url>' public/sitemap.xml); [ "$URLN" = "43" ] || fail "sitemap"
# vitest #D-13 output assert
VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1 | rg '356 passed \(356\)' || fail "vitest"
[ $RED -eq 0 ] && echo "===== 12-F GREEN 1177 =====" || exit 1
```

**§GREEN G-F1~G-F6** → **12-A** 착수.

---

# 슬라이스 2 · 12-A Casino Hub v0.1 (P0 · ~45min)

**선행:** 12-F GREEN · catalog **1177**

**왜:** Stake catalog+featured+PF + Rollbit live win ticker.

**CREATE `src/components/casino/` (8)**

| file | spec | data-hub-id |
|------|------|-------------|
| `FeaturedCarousel.tsx` | 3-slide auto hero | `casino-featured` |
| `LiveWinTicker.tsx` | win marquee | `casino-ticker` |
| `ProvablyFairBadge.tsx` | PF badge + tooltip | `casino-pf` |
| `GameCardHover.tsx` | hover preload · RTP/volatility | `casino-hover` |
| `CategoryRail.tsx` | Slots/Live/Crash/Table rail | `casino-rail` |
| `JackpotMeter.tsx` | jackpot counter | `casino-jackpot` |
| `RTPChip.tsx` | RTP% chip | `casino-rtp` |
| `CasinoHub.tsx` | 7 조립 + **기존 catalog grid embed** | `casino-hub` |

**EDIT**

- `casino.index.tsx` — `component: CasinoHub` · **head Δ=0** · inner catalog **보존**
- `ko.json` / `en.json` — **+24** (`casino.hub.*`)

**Gate:** catalog **1201** · `data-hub-id="casino-*"` = **8** · game routes Δ=0 · sitemap=43

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }
git diff src/routes/casino.index.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" && fail "R-A1" || echo "OK R-A1"
IDS=$(rg -oN 'data-hub-id="casino-[^"]+"' src/components/casino/ | wc -l | tr -d ' ')
[ "$IDS" = "8" ] || fail "R-A2 ids=$IDS"
git diff --quiet -- src/games/ src/routes/casino. || fail "R-A3 game routes"
bash scripts/i18n-parity.sh || fail "i18n"
URLN=$(rg -c '<url>' public/sitemap.xml); [ "$URLN" = "43" ] || fail "sitemap"
VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1 | rg '356 passed \(356\)' || fail "vitest"
[ $RED -eq 0 ] && echo "===== 12-A GREEN 1201 =====" || exit 1
```

**§GREEN G-A1~G-A15** → **12-G** 착수.

---

# 슬라이스 3 · 12-G SEO Sweep v0.1 (P1 · ~60min)

**선행:** 12-A GREEN · catalog **1201**

**왜:** Binance help/legal SEO + Stake meta 일관 · operator 선언 직전 sweep.

**EDIT**

- **14 route** — `head()` 추가: title · description · og:title · og:description · og:url · canonical · **og:image leaf only**
- `ko.json` / `en.json` — **+28** (`seo.<route>.title|description` ×14)
- **VERIFY** `__root.tsx` — global `og:image` **없음**

**Gate:** catalog **1229** · head() **60/60** · canonical **60/60** · **기존 46 route head Δ=0** · sitemap=43

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }
HEADN=$(rg -l 'head\s*\(' src/routes/ | wc -l | tr -d ' ')
[ "$HEADN" = "60" ] || fail "head=$HEADN"
rg -n 'og:image' src/routes/__root.tsx && fail "R-G4 root og:image" || echo "OK R-G4"
bash scripts/i18n-parity.sh || fail "i18n"
URLN=$(rg -c '<url>' public/sitemap.xml); [ "$URLN" = "43" ] || fail "sitemap"
VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1 | rg '356 passed \(356\)' || fail "vitest"
[ $RED -eq 0 ] && echo "===== 12-G GREEN 1229 head=60/60 =====" || exit 1
```

**§GREEN G-G1~G-G8** → 끝판왕 3종 완료 보고.

---

## 실행 순서

```text
12-F → RED check → GREEN → 12-A → RED check → GREEN → 12-G → RED check → GREEN
       ↓ operator 「Lovable 완성」 → 12-Z FINAL → ZIP 1회 → PHONARA paste 1회
```

**지금:** ZIP · PHONARA paste · `apps/web` **금지**.

---END---
