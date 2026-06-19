# Phase 12-C EXECUTE GO — Lovable 채팅 붙여넣기 (v0.2.2 FINAL · 1a·2a·3a)

> **아래 `---BEGIN---` ~ `---END---` 전체를 Lovable 채팅에 붙여넣기.**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_C_LOCK.md`](LOVABLE_ZENITH_PHASE12_C_LOCK.md)

---BEGIN---

# 12-C EXECUTE GO · LOCK v0.2.2 FINAL (분기 1a·2a·3a)

operator 확정: **`12-C EXECUTE GO`** — v0.2.1 gate 3건(#49~#51) + carry(#52~#53) **본문 반영 완료**. **추가 REVISE·gate 축약·Step 9 생략 금지.**

```
12-B ✅ §GREEN · 12-E NO-TOUCH · catalog ~1127 → target ~1149 (Δ +22)
분기: 1a H2 mirror · 2a Footer 하단 단일 · 3a component: HomeHub
FOMO/tier/live → v0.3 defer (이번 EXECUTE = scaffold only)
```

**첫 응답 1줄:** `12-C EXECUTE GO (v0.2.2 FINAL · 1a·2a·3a) 수령 · Step 0 pre-flight 착수.` → operator 추가 지시 없으면 **Step 0→10 자동 진행**.

---

## Step 0 — Pre-flight

```bash
test -f src/components/pages/ImportedHomePage.tsx          || { echo "FAIL R-C10"; exit 1; }
test -f src/routes/games.index.tsx                          || { echo "FAIL #27 games"; exit 1; }
test -f src/routes/casino.index.tsx                         || { echo "FAIL #27 casino"; exit 1; }
rg -n 'AppShell density="app"' src/components/pages/ImportedHomePage.tsx \
  || { echo "FAIL #29 AppShell baseline"; exit 1; }

git diff --quiet -- \
  src/routes/earn.missions.tsx src/routes/earn.index.tsx src/routes/earn.tsx \
  src/components/earn/ src/components/fomo/ src/games/ \
  src/routes/referral.tsx src/routes/referral.* \
  src/routes/partner.tsx  src/routes/partner.* \
  src/components/referral/ \
  src/components/pages/ImportedReferralPage.tsx \
  src/routes/trade.tsx src/routes/trade.* \
  src/routes/games.* src/routes/casino.* \
  || { echo "FAIL Step 0 NO-TOUCH baseline drift"; exit 1; }
echo "OK Step 0 pre-flight"
```

---

## Step 1~8 — 구현 (v0.2.1 동일 · 요약)

1. i18n en/ko +22 (`home.hub.hero.*` · `home.section.*` · `home.footer.*`)
2. `HomeHubFooter.tsx` (note + learnMore · banned 주석 0)
3~7. H1~H6 카드 (`data-hub-id` · Link only · DailyCheckIn import 0)
8. `HomeHub.tsx` `<AppShell density="app">` + 6 + Footer · `home.tsx` component만 `HomeHub` (head Δ=0)

---

## Step 9 — Self-check FULL (#42~#53 · 축약·생략 금지)

```bash
set -u
RED=0
fail() { echo "FAIL $*"; RED=1; }

echo "=== R-C1 #26 head regex ==="
git diff src/routes/home.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && fail "R-C1 head Δ≠0" || echo "OK R-C1"

echo "=== R-C2 #47 6 slot ==="
SLOTS=$(rg -c 'data-hub-id="home-' src/components/home/ | awk -F: '{s+=$2} END {print s+0}')
[ "$SLOTS" = "6" ] && echo "OK R-C2 ($SLOTS)" || fail "R-C2 slot count=$SLOTS"

echo "=== R-C3 #31 data-hub-id allowlist ==="
rg -oN 'data-hub-id="[^"]+"' src/components/home/ \
  | rg -v 'data-hub-id="home-(welcome|checkin|mission|referral|trade|games)"' \
  && fail "R-C3 unknown data-hub-id" || echo "OK R-C3"

echo "=== R-C4 #28 #42 earn stat ==="
git diff --quiet -- \
  src/routes/earn.missions.tsx src/routes/earn.index.tsx src/routes/earn.tsx \
  src/components/earn/ \
  && echo "OK R-C4 stat" || fail "R-C4 earn drift"

echo "=== R-C4 #52 earn import ban ==="
rg -n 'DailyCheckIn|MissionChecklist|MissionProgressHero|Phase12MissionsFooter' src/components/home/ \
  && fail "R-C4 earn import in home/" || echo "OK R-C4 imports"

echo "=== R-C5 banned tokens ==="
rg -nN "Math|toFixed|reduce|localStorage|@supabase|rpc_" src/components/home/ \
  && fail "R-C5 banned token" || echo "OK R-C5"

echo "=== R-C6 #33 #44 Footer 12 fixed lines ==="
F=src/components/home/HomeHubFooter.tsx
rg -nN "app_install"        $F && fail "R-C6 app_install"     || echo "OK 1/12"
rg -wnN "ad"                $F && fail "R-C6 ad"              || echo "OK 2/12"
rg -nN "survey"             $F && fail "R-C6 survey"          || echo "OK 3/12"
rg -nN "howler"             $F && fail "R-C6 howler"          || echo "OK 4/12"
rg -nN "emoji"              $F && fail "R-C6 emoji"           || echo "OK 5/12"
rg -nN "bet\.result\.grid"  $F && fail "R-C6 betgrid"         || echo "OK 6/12"
rg -nN "Math"               $F && fail "R-C6 Math"            || echo "OK 7/12"
rg -nN "toFixed"            $F && fail "R-C6 toFixed"         || echo "OK 8/12"
rg -nN "reduce"             $F && fail "R-C6 reduce"          || echo "OK 9/12"
rg -nN "localStorage"       $F && fail "R-C6 localStorage"    || echo "OK 10/12"
rg -nN "@supabase"          $F && fail "R-C6 supabase"        || echo "OK 11/12"
rg -nN "rpc_"               $F && fail "R-C6 rpc_"            || echo "OK 12/12"

echo "=== R-C7 #36 #39 #43 12-E ==="
git diff --quiet -- \
  src/routes/referral.tsx src/routes/referral.* \
  src/routes/partner.tsx  src/routes/partner.* \
  src/components/referral/ \
  src/components/pages/ImportedReferralPage.tsx \
  && echo "OK R-C7" || fail "R-C7 12-E drift"

echo "=== R-C8 #40 trade ==="
git diff --quiet -- src/routes/trade.tsx src/routes/trade.* \
  && echo "OK R-C8" || fail "R-C8 trade drift"

echo "=== R-C9 #43 games/casino ==="
git diff --quiet -- src/routes/games.* src/routes/casino.* \
  && echo "OK R-C9" || fail "R-C9 games/casino drift"

echo "=== #53 games/ carry ==="
git diff --quiet -- src/games/ \
  && echo "OK #53 games" || fail "#53 games drift"

echo "=== R-C10 ImportedHomePage ==="
test -f src/components/pages/ImportedHomePage.tsx \
  && echo "OK R-C10" || fail "R-C10 deleted"

echo "=== #29 AppShell ==="
rg -n 'AppShell density="app"' src/components/home/HomeHub.tsx \
  && echo "OK #29" || fail "#29 AppShell missing"

echo "=== #30 fomo ==="
git diff --quiet -- src/components/fomo/ \
  && echo "OK #30" || fail "#30 fomo drift"

echo "=== #37 12-B carry ==="
git diff --quiet -- src/routes/earn.index.tsx \
  && echo "OK #37 stat" || fail "#37 earn.index drift"
rg -n '"/partner"' src/components/shell/ src/routes/earn.index.tsx src/components/fomo/ \
  && fail "#37 /partner leak" || echo "OK #37 leak"

echo "=== G-C5 #51 footer keys (12-B pattern) ==="
NOTE_CNT=$(rg -c 'home\.footer\.note' src/i18n/en.ts src/i18n/ko.ts | awk -F: '{s+=$2} END {print s+0}')
LM_CNT=$(rg -c 'home\.footer\.learnMore' src/i18n/en.ts src/i18n/ko.ts | awk -F: '{s+=$2} END {print s+0}')
[ "$NOTE_CNT" = "2" ] && [ "$LM_CNT" = "2" ] \
  && echo "OK G-C5" || fail "G-C5 note=$NOTE_CNT learnMore=$LM_CNT"

echo "=== G-C11 #49 sitemap 42 · JSON-LD 8 routes ==="
URLN=$(rg -c "<url>" public/sitemap.xml | awk -F: '{s+=$2} END {print s+0}')
JLDN=$(rg -l 'application/ld\+json' src/routes/ | wc -l | tr -d ' ')
echo "sitemap=$URLN jsonld_routes=$JLDN"
[ "$URLN" = "42" ] || fail "G-C11 sitemap=$URLN"
[ "$JLDN" = "8" ]  || fail "G-C11 jsonld routes=$JLDN"

echo "=== G-C12 #50 PWA · addEventListener ==="
rg -n "vite-plugin-pwa" package.json \
  && fail "G-C12 pwa plugin" || echo "OK pwa=0"
AEL=$(rg -l "addEventListener\s*\(\s*['\"]beforeinstallprompt|addEventListener\s*\(\s*['\"]appinstalled" src/ | wc -l | tr -d ' ')
[ "$AEL" = "1" ] && echo "OK addEventListener 1 file" || fail "G-C12 addEventListener files=$AEL"

echo "=== G-C14 home /partner ==="
rg -n '"/partner"' src/routes/home.tsx src/components/home/ \
  && fail "G-C14 /partner leak" || echo "OK G-C14"

echo "=== #34 red-grep FULL ==="
bash scripts/red-grep.sh || fail "red-grep"

echo "=== G-C13 i18n + vitest ==="
bash scripts/i18n-parity.sh || fail "i18n-parity"
bunx vitest run             || fail "vitest"

[ $RED -eq 0 ] && echo "===== ALL GREEN =====" || { echo "===== RED ====="; exit 1; }
```

---

## Step 10

§GREEN **G-C1~G-C15** 보고 · vitest N/N · ZIP KB (operator 신호 시) · **12-D Trade Surface Pro LOCK DRAFT 텍스트만** (코드 0).

**G-C15:** v0.2.2 scaffold PASS · FOMO/tier → **12-C v0.3**.

---

## FAIL = RED STOP

Step 9 `RED=1` · gate 축약으로 §GREEN 주장 금지 · ZIP 금지.

---END---
