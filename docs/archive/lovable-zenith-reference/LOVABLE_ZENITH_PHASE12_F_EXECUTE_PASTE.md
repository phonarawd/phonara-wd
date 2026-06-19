# Phase 12-F EXECUTE GO — Lovable 붙여넣기

> **정본:** [`LOVABLE_ZENITH_PHASE12_F_LOCK.md`](LOVABLE_ZENITH_PHASE12_F_LOCK.md)  
> **매크로:** [`LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md`](LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md)

---BEGIN---

# 12-F EXECUTE GO · Home FOMO v0.1 (GAP #1 P0)

**첫 응답 1줄:** `12-F EXECUTE GO 수령 · Step 0 pre-flight 착수.`

**baseline:** catalog **1165** → **1177** (Δ +12) · sitemap **43** hold

---

## Step 0 — Pre-flight

```bash
test -f src/components/home/HomeHub.tsx || exit 1
test -f src/routes/home.tsx || exit 1
git diff --quiet -- src/components/pages/ImportedHomePage.tsx || exit 1
git diff --quiet -- src/components/fomo/ || exit 1
echo "OK Step 0"
```

---

## Step 1~4 — 구현

1. **CREATE 3:** `LiveActivityFeed.tsx` · `StreakRing.tsx` · `LimitedDropCard.tsx`  
   - `data-hub-id`: `home-fomo-live` · `home-fomo-streak` · `home-fomo-drop`
2. **EDIT** `HomeHub.tsx` — 6 legacy + 3 FOMO = **9 slot** · H1~H6 **변경 0**
3. **i18n** +12 (`home.fomo.live|streak|drop.*`)
4. **NO-TOUCH:** `home.tsx` head · earn/casino/trade · `components/fomo/`

---

## Step 5 — Self-check

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }

git diff src/routes/home.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && fail "R-F1" || echo "OK R-F1"

SLOTS=$(rg -oN 'data-hub-id="home-[^"]+"' src/components/home/ | wc -l | tr -d ' ')
[ "$SLOTS" = "9" ] && echo "OK R-F2 slots=9" || fail "R-F2 slots=$SLOTS"

git diff --quiet -- src/components/fomo/ && echo "OK R-F3" || fail "R-F3 fomo drift"

bash scripts/i18n-parity.sh || fail "i18n"
VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
T_LINE=$(rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1)
[ -n "$T_LINE" ] || fail "vitest summary"
URLN=$(rg -c '<url>' public/sitemap.xml)
[ "$URLN" = "43" ] || fail "sitemap=$URLN"

[ $RED -eq 0 ] && echo "===== 12-F GREEN catalog=1177 =====" || exit 1
```

---

## Step 6 — §GREEN G-F1~G-F6 보고 · **12-A EXECUTE 대기**

ZIP 금지.

---END---
