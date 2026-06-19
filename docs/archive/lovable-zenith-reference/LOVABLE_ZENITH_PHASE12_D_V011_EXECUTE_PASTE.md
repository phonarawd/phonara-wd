# Phase 12-D v0.1.1 EXECUTE GO — Lovable 붙여넣기 (operator GO · FINAL)

> **정본:** [`LOVABLE_ZENITH_PHASE12_D_V011_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_V011_LOCK.md)  
> **Step 9 carry:** [`LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md`](LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md) (#D-11~#D-13)

---BEGIN---

# 12-D v0.1.1 EXECUTE GO · UX regression revert (옵션 B · #D-14~#D-15)

**첫 응답 1줄:** `12-D v0.1.1 EXECUTE GO (#D-14~#D-15) 수령 · route split 착수.`

**목적:** `/trade` 단일 진입점 회귀 차단 · ImportedTradePage 복원 · TradeHub → `/trade/hub`.  
**8 scaffold + i18n 1165 보존** · **TradeHub.tsx 변경 0**.

**operator 확정:** i18n **+0** (`trade.hub.hero.*` 재사용) · sitemap **43** · priority **0.5** · changefreq **weekly**.

---

## Step 0 — Pre-flight

```bash
test -f src/components/pages/ImportedTradePage.tsx || exit 1
test -f src/components/trade/TradeHub.tsx            || exit 1
test -f src/routes/trade.tsx                         || exit 1
git diff --quiet -- src/components/pages/ImportedTradePage.tsx \
  || { echo "FAIL R-D10"; exit 1; }
echo "OK Step 0"
```

---

## Step 1 — `trade.tsx` revert (R-D1v · R-D3v)

**EDIT** `src/routes/trade.tsx` — component only:

```tsx
import { ImportedTradePage } from "@/components/pages/ImportedTradePage";
// ...
component: ImportedTradePage,
```

head · meta · canonical · JSON-LD **Δ=0**.

```bash
git diff src/routes/trade.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && { echo "FAIL R-D1v"; exit 1; } || echo "OK R-D1v"
rg -n 'ImportedTradePage' src/routes/trade.tsx || { echo "FAIL R-D3v"; exit 1; }
```

---

## Step 2 — CREATE `trade.hub.tsx` (R-D2v)

**CREATE** `src/routes/trade.hub.tsx`:

- `createFileRoute("/trade/hub")`
- head meta title/description → **`trade.hub.hero.title`** · **`trade.hub.hero.desc`** (i18n **+0**)
- `component: TradeHub`
- JSON-LD **불필요**

```bash
test -f src/routes/trade.hub.tsx || exit 1
rg -n 'TradeHub' src/routes/trade.hub.tsx || exit 1
rg -n 'AppShell density="trade"' src/components/trade/TradeHub.tsx || exit 1
echo "OK R-D2v"
```

**`TradeHub.tsx` + 7 cards/Footer — edit 0.**

---

## Step 3 — sitemap (#D-15 · G-D11 → 43)

**EDIT** `public/sitemap.xml` — `/trade/hub` 1 entry:

```xml
<url>
  <loc>{origin}/trade/hub</loc>
  <priority>0.5</priority>
  <changefreq>weekly</changefreq>
</url>
```

(loc 형식은 기존 sitemap 엔트리와 **동일 origin/path 패턴** 따름)

```bash
rg -n '/trade/hub' public/sitemap.xml || { echo "FAIL sitemap loc"; exit 1; }
rg -n '0\.5' public/sitemap.xml | rg -n 'trade/hub' || true
URLN=$(rg -c '<url>' public/sitemap.xml)
[ "$URLN" = "43" ] || { echo "FAIL G-D11 sitemap=$URLN expect 43"; exit 1; }
echo "OK G-D11 sitemap=43"
```

---

## Step 4 — T1~T4 verify (R-D4v · edit only if FAIL)

이미 `to="/trade"` 이면 **edit 0**. gate만:

```bash
rg 'to="/trade/hub"' src/components/trade/TradeMarketsMirrorCard.tsx \
  src/components/trade/TradeOrderTeaserCard.tsx \
  src/components/trade/TradePositionsTeaserCard.tsx \
  src/components/trade/TradeHistoryTeaserCard.tsx \
  && { echo "FAIL R-D4v hub link in cards"; exit 1; }
rg 'to="/trade"' src/components/trade/TradeMarketsMirrorCard.tsx \
  src/components/trade/TradeOrderTeaserCard.tsx \
  src/components/trade/TradePositionsTeaserCard.tsx \
  src/components/trade/TradeHistoryTeaserCard.tsx \
  || { echo "FAIL R-D4v missing /trade"; exit 1; }
echo "OK R-D4v"
```

---

## Step 5 — Step 9 FULL + v0.1.1 asserts

[`LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md`](LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md) Step 9 **전문** (#D-11·#D-12·#D-13) 실행.

**G-D11 블록만 치환** (#D-15):

```bash
URLN=$(rg -c '<url>' public/sitemap.xml)
JLDN=$(rg -l 'application/ld\+json' src/routes/ | wc -l | tr -d ' ')
echo "sitemap=$URLN jsonld_routes=$JLDN"
[ "$URLN" = "43" ] || fail "G-D11 sitemap=$URLN expect 43"
[ "$JLDN" = "8" ]  || fail "G-D11 jsonld routes=$JLDN expect 8"
```

**Manual smoke (보고용):**

- `/trade` → ImportedTradePage (MobileTradeView + DesktopTrade)
- `/trade/hub` → TradeHub 6-card

---

## Step 6 — §GREEN

**G-D1~G-D15** · catalog **1165=1165** · vitest **356/356** (#D-13 output assert).

**G-D15:** v0.1.1 route split PASS · 12-D v0.2 defer.

**12-A Games World-Class LOCK DRAFT** 텍스트만 (코드 0).

**ZIP 금지** · operator 「ZIP 발행」 전까지.

---

## FAIL = STOP

ImportedTradePage 미마운트 · vitest fail · i18n ≠1165 · sitemap≠43 · §GREEN/ZIP 주장.

---END---
