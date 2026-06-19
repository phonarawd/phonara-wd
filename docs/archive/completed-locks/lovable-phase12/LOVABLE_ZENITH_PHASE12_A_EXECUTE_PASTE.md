# Phase 12-A EXECUTE GO — Lovable 붙여넣기

> **선행:** **12-F §GREEN** · catalog **1177**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_A_LOCK.md`](LOVABLE_ZENITH_PHASE12_A_LOCK.md)

---BEGIN---

# 12-A EXECUTE GO · Casino Hub v0.1 (GAP #2·#3 P0)

**첫 응답 1줄:** `12-A EXECUTE GO 수령 · catalog baseline 1177 · Step 0 착수.`

**target:** catalog **1201** (Δ +24) · sitemap **43**

---

## Step 0 — Pre-flight

```bash
test -f src/routes/casino.index.tsx || exit 1
git diff --quiet -- src/games/ || exit 1
git diff --quiet -- src/routes/trade.tsx src/components/pages/ImportedTradePage.tsx || exit 1
echo "OK Step 0"
```

---

## Step 1~4 — 구현

1. **CREATE 8** in `src/components/casino/`: CasinoHub · FeaturedCarousel · LiveWinTicker · ProvablyFairBadge · GameCardHover · CategoryRail · JackpotMeter · RTPChip
2. **data-hub-id:** `casino-featured` · `casino-ticker` · `casino-pf` · `casino-hover` · `casino-rail` · `casino-jackpot` · `casino-rtp` (+ hub)
3. **EDIT** `casino.index.tsx` — component **CasinoHub** only · head Δ=0 · inner catalog grid **보존**
4. **i18n** +24 (`casino.hub.*`)

**NO-TOUCH:** `src/games/**` · 11 casino game routes · trade/home/earn

---

## Step 5 — Self-check

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }

git diff src/routes/casino.index.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && fail "R-A1" || echo "OK R-A1"

HUB_IDS=$(rg -oN 'data-hub-id="casino-[^"]+"' src/components/casino/ | wc -l | tr -d ' ')
[ "$HUB_IDS" = "7" ] && echo "OK R-A2 ids=7" || fail "R-A2 ids=$HUB_IDS"

git diff --quiet -- src/games/ && echo "OK R-A3" || fail "R-A3 games drift"

bash scripts/i18n-parity.sh || fail "i18n"
URLN=$(rg -c '<url>' public/sitemap.xml)
[ "$URLN" = "43" ] || fail "sitemap=$URLN"

[ $RED -eq 0 ] && echo "===== 12-A GREEN catalog=1201 =====" || exit 1
```

---

## Step 6 — §GREEN G-A1~G-A15 · **12-G EXECUTE 대기**

ZIP 금지.

---END---
