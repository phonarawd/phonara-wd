# Phase 12-D EXECUTE GO — Lovable 채팅 붙여넣기 (v0.2.2 FINAL · #D-11~#D-13)

> **아래 `---BEGIN---` ~ `---END---` 전체를 Lovable 채팅에 붙여넣기.**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_D_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_LOCK.md)

---BEGIN---

# 12-D amend GO · LOCK v0.2.1 FINAL (분기 1a·2a·3a · Step 9 re-run)

operator 확정: **`12-D amend GO`** — Step 0~8 **재구현 금지** · **Step 9만** #D-11·#D-12 반영 재실행 → Step 10. amend **#D-1~#D-12** baked. **REVISE·gate 축약·§GREEN/ZIP 주장·trade route full quiet 금지.**

```
12-C ✅ §GREEN · catalog 1143 → target 1165 (Δ +22)
분기: 1a TradeHub · 2a Footer #20 · 3a component swap · density="trade" (#D-5)
FOMO/tier/depth/order UI → 12-D v0.2 defer
```

**첫 응답 1줄:** `12-D amend GO (v0.2.1 · #D-11·#D-12) 수령 · Step 9 re-run 착수.` → **Step 9 FULL bash 재실행** → GREEN이면 Step 10.

---

## Step 0 — Pre-flight (#D-6 · routes/trade.tsx NO-TOUCH glob 제외)

```bash
test -f src/components/pages/ImportedTradePage.tsx          || { echo "FAIL R-D10"; exit 1; }
test -f src/components/pages/ImportedHomePage.tsx           || { echo "FAIL 12-C carry"; exit 1; }
test -f src/routes/games.index.tsx                          || { echo "FAIL games"; exit 1; }
test -f src/routes/casino.index.tsx                         || { echo "FAIL casino"; exit 1; }
rg -n 'AppShell density=' src/components/pages/ImportedTradePage.tsx \
  || { echo "FAIL #D-5 AppShell baseline"; exit 1; }

git diff --quiet -- \
  src/routes/earn.missions.tsx src/routes/earn.index.tsx src/routes/earn.tsx \
  src/components/earn/ \
  src/components/fomo/ \
  src/routes/home.tsx \
  src/components/home/ \
  src/routes/referral.tsx src/routes/referral.* \
  src/routes/partner.tsx  src/routes/partner.* \
  src/components/referral/ \
  src/components/pages/ImportedReferralPage.tsx \
  src/routes/games.* src/routes/casino.* \
  src/games/ \
  || { echo "FAIL Step 0 NO-TOUCH baseline drift"; exit 1; }
echo "OK Step 0 pre-flight"
```

---

## Step 1~8 — 구현

1. i18n en/ko +22 (`trade.hub.hero.*` · `trade.section.*` · `trade.footer.*`) · 1143→1165
2. `TradeHubFooter.tsx` (Footer #20 · banned 주석 0)
3~7. T1~T6 cards (`data-hub-id="trade-{section}"` · Link only · earn/home import 0)
8. `TradeHub.tsx` `<AppShell density="trade">` + 6 + Footer · `trade.tsx` component만 `TradeHub` (head Δ=0)

**파일:**

- `src/routes/trade.tsx` (component만 교체)
- `src/components/trade/TradeHub.tsx`
- `src/components/trade/TradeMarketsMirrorCard.tsx` (T1)
- `src/components/trade/TradeOrderTeaserCard.tsx` (T2)
- `src/components/trade/TradePositionsTeaserCard.tsx` (T3)
- `src/components/trade/TradeHistoryTeaserCard.tsx` (T4)
- `src/components/trade/TradeReferralTeaserCard.tsx` (T5 · `/referral`)
- `src/components/trade/TradeGamesTeaserCard.tsx` (T6 · `/games`)
- `src/components/trade/TradeHubFooter.tsx` (Footer #20)
- `src/i18n/en.ts` / `src/i18n/ko.ts` (+22 each)

---

## Step 9 — Self-check FULL (#D-1~#D-10 · 축약·생략·trade full quiet 금지)

```bash
set -u
RED=0
fail() { echo "FAIL $*"; RED=1; }

echo "=== R-D1 #26 head regex (NOT full trade.tsx quiet · #D-6) ==="
git diff src/routes/trade.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && fail "R-D1 head Δ≠0" || echo "OK R-D1"

echo "=== R-D2 6 slot ==="
SLOTS=$(rg -c 'data-hub-id="trade-' src/components/trade/ | awk -F: '{s+=$2} END {print s+0}')
[ "$SLOTS" = "6" ] && echo "OK R-D2 ($SLOTS)" || fail "R-D2 slot count=$SLOTS"

echo "=== R-D3 data-hub-id allowlist ==="
rg -oN 'data-hub-id="[^"]+"' src/components/trade/ \
  | rg -v 'data-hub-id="trade-(markets|order|positions|history|referral|games)"' \
  && fail "R-D3 unknown data-hub-id" || echo "OK R-D3"

echo "=== R-D4 earn stat ==="
git diff --quiet -- \
  src/routes/earn.missions.tsx src/routes/earn.index.tsx src/routes/earn.tsx \
  src/components/earn/ \
  && echo "OK R-D4 stat" || fail "R-D4 earn drift"

echo "=== R-D4 #D-9 cross-import ban (components/trade/) ==="
rg -n 'DailyCheckIn|MissionChecklist|MissionProgressHero|Phase12MissionsFooter|HomeHub|components/home' src/components/trade/ \
  && fail "R-D4 cross-import" || echo "OK R-D4 imports"

echo "=== R-D5 banned tokens (#D-11 · 8 CREATE only · legacy excluded) ==="
R_D5_FILES=(
  src/components/trade/TradeHub.tsx
  src/components/trade/TradeMarketsMirrorCard.tsx
  src/components/trade/TradeOrderTeaserCard.tsx
  src/components/trade/TradePositionsTeaserCard.tsx
  src/components/trade/TradeHistoryTeaserCard.tsx
  src/components/trade/TradeReferralTeaserCard.tsx
  src/components/trade/TradeGamesTeaserCard.tsx
  src/components/trade/TradeHubFooter.tsx
)
for f in "${R_D5_FILES[@]}"; do test -f "$f" || fail "R-D5 missing $f"; done
rg -nN "Math|toFixed|reduce|localStorage|@supabase|rpc_" "${R_D5_FILES[@]}" \
  && fail "R-D5 banned token" || echo "OK R-D5"

echo "=== R-D6 Footer #20 — 12 fixed lines ==="
F=src/components/trade/TradeHubFooter.tsx
rg -nN "app_install"        $F && fail "R-D6 app_install"     || echo "OK 1/12"
rg -wnN "ad"                $F && fail "R-D6 ad"              || echo "OK 2/12"
rg -nN "survey"             $F && fail "R-D6 survey"          || echo "OK 3/12"
rg -nN "howler"             $F && fail "R-D6 howler"          || echo "OK 4/12"
rg -nN "emoji"              $F && fail "R-D6 emoji"           || echo "OK 5/12"
rg -nN "bet\.result\.grid"  $F && fail "R-D6 betgrid"         || echo "OK 6/12"
rg -nN "Math"               $F && fail "R-D6 Math"            || echo "OK 7/12"
rg -nN "toFixed"            $F && fail "R-D6 toFixed"         || echo "OK 8/12"
rg -nN "reduce"             $F && fail "R-D6 reduce"          || echo "OK 9/12"
rg -nN "localStorage"       $F && fail "R-D6 localStorage"    || echo "OK 10/12"
rg -nN "@supabase"          $F && fail "R-D6 supabase"        || echo "OK 11/12"
rg -nN "rpc_"               $F && fail "R-D6 rpc_"            || echo "OK 12/12"

echo "=== R-D7 12-E ==="
git diff --quiet -- \
  src/routes/referral.tsx src/routes/referral.* \
  src/routes/partner.tsx  src/routes/partner.* \
  src/components/referral/ \
  src/components/pages/ImportedReferralPage.tsx \
  && echo "OK R-D7" || fail "R-D7 12-E drift"

echo "=== R-D8 #D-7 games/casino + src/games/ ==="
git diff --quiet -- src/routes/games.* src/routes/casino.* src/games/ \
  && echo "OK R-D8" || fail "R-D8 games drift"

echo "=== R-D9 12-C home carry ==="
git diff --quiet -- src/routes/home.tsx src/components/home/ \
  && echo "OK R-D9" || fail "R-D9 home drift"

echo "=== R-D10 ImportedTradePage file only (#D-2/#D-6) ==="
test -f src/components/pages/ImportedTradePage.tsx \
  || fail "R-D10 missing"
git diff --quiet -- src/components/pages/ImportedTradePage.tsx \
  && echo "OK R-D10 file stat" || fail "R-D10 ImportedTradePage drift"

echo "=== #29 #D-5 AppShell density=trade ==="
rg -n 'AppShell density="trade"' src/components/trade/TradeHub.tsx \
  && echo "OK #29" || fail "#29 AppShell density=trade missing"

echo "=== #30 fomo ==="
git diff --quiet -- src/components/fomo/ \
  && echo "OK #30" || fail "#30 fomo drift"

echo "=== #37 12-B carry ==="
git diff --quiet -- src/routes/earn.index.tsx \
  && echo "OK #37 stat" || fail "#37 earn.index drift"
rg -n '"/partner"' src/components/shell/ src/routes/earn.index.tsx src/components/fomo/ \
  && fail "#37 /partner leak" || echo "OK #37 leak"

echo "=== G-D5 footer keys ==="
NOTE_CNT=$(rg -c 'trade\.footer\.note' src/i18n/en.ts src/i18n/ko.ts | awk -F: '{s+=$2} END {print s+0}')
LM_CNT=$(rg -c 'trade\.footer\.learnMore' src/i18n/en.ts src/i18n/ko.ts | awk -F: '{s+=$2} END {print s+0}')
[ "$NOTE_CNT" = "2" ] && [ "$LM_CNT" = "2" ] \
  && echo "OK G-D5" || fail "G-D5 note=$NOTE_CNT learnMore=$LM_CNT"

echo "=== G-D11 #D-8 sitemap 42 · JSON-LD 8 routes ==="
URLN=$(rg -c '<url>' public/sitemap.xml)
JLDN=$(rg -l 'application/ld\+json' src/routes/ | wc -l | tr -d ' ')
echo "sitemap=$URLN jsonld_routes=$JLDN"
[ "$URLN" = "42" ] || fail "G-D11 sitemap=$URLN"
[ "$JLDN" = "8" ]  || fail "G-D11 jsonld routes=$JLDN"

echo "=== G-D12 PWA · addEventListener ==="
rg -n "vite-plugin-pwa" package.json \
  && fail "G-D12 pwa plugin" || echo "OK pwa=0"
AEL=$(rg -l "addEventListener\s*\(\s*['\"]beforeinstallprompt|addEventListener\s*\(\s*['\"]appinstalled" src/ | wc -l | tr -d ' ')
[ "$AEL" = "1" ] && echo "OK addEventListener 1 file" || fail "G-D12 addEventListener files=$AEL"

echo "=== G-D14 trade /partner = 0 ==="
rg -n '"/partner"' src/routes/trade.tsx src/components/trade/ \
  && fail "G-D14 /partner leak" || echo "OK G-D14"

echo "=== red-grep FULL ==="
bash scripts/red-grep.sh || fail "red-grep"

echo "=== G-D13 i18n + vitest (#D-13 · output assert · jsdom plinko flake) ==="
bash scripts/i18n-parity.sh || fail "i18n-parity"
VLOG=$(mktemp)
set +e
bunx vitest run 2>&1 | tee "$VLOG"
V_EC=$?
set -e
T_LINE=$(rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1)
TF_LINE=$(rg 'Test Files\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1)
[ -n "$T_LINE" ] || fail "G-D13 vitest Tests summary missing (exit=$V_EC)"
[ -n "$TF_LINE" ] || fail "G-D13 vitest Test Files summary missing (exit=$V_EC)"
T_PASS=$(echo "$T_LINE" | sed -E 's/.*Tests[[:space:]]+([0-9]+) passed.*/\1/')
T_TOTAL=$(echo "$T_LINE" | sed -E 's/.*\(([0-9]+)\).*/\1/')
TF_PASS=$(echo "$TF_LINE" | sed -E 's/.*Test Files[[:space:]]+([0-9]+) passed.*/\1/')
TF_TOTAL=$(echo "$TF_LINE" | sed -E 's/.*\(([0-9]+)\).*/\1/')
rg 'Tests\s+[1-9][0-9]* failed' "$VLOG" \
  && fail "G-D13 vitest has failed tests (exit=$V_EC)" || true
[ "$T_PASS" = "$T_TOTAL" ] && [ "$TF_PASS" = "$TF_TOTAL" ] && [ "$T_PASS" != "0" ] \
  && echo "OK G-D13 vitest Tests ${T_PASS}/${T_TOTAL} Files ${TF_PASS}/${TF_TOTAL} (exit=$V_EC · #D-13)" \
  || fail "G-D13 vitest mismatch Tests=${T_PASS}/${T_TOTAL} Files=${TF_PASS}/${TF_TOTAL} exit=$V_EC"

[ $RED -eq 0 ] && echo "===== ALL GREEN =====" || { echo "===== RED ====="; exit 1; }
```

---

## Step 10

§GREEN **G-D1~G-D15** 보고 · vitest N/N · **12-A Games World-Class LOCK DRAFT 텍스트만** (코드 0).

**ZIP/CHANGELOG:** operator **「ZIP 발행」 명시 전까지 금지** (non-negotiable).

**G-D15 (#D-10):** v0.1 scaffold PASS · FOMO/tier/depth/order UI → **12-D v0.2 defer**.

---

## FAIL = RED STOP

Step 9 `RED=1` · gate 축약 · §GREEN ZIP 주장 · **`routes/trade.tsx` full quiet 검사** 금지.

---END---
