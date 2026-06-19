# Phase 12-D Step 9 RED=2 — operator amend GO (Lovable 복붙용)

> **아래 `---BEGIN---` ~ `---END---` 전체를 Lovable 채팅에 붙여넣기.**  
> **정본:** [`LOVABLE_ZENITH_PHASE12_D_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_LOCK.md) v0.2.1 · Step 9 전문 = [`LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md`](LOVABLE_ZENITH_PHASE12_D_EXECUTE_PASTE.md)

---BEGIN---

# 12-D amend GO · Step 9 re-run (#D-11 · #D-12)

**첫 응답 1줄:** `12-D amend GO (v0.2.1 · #D-11·#D-12) 수령 · Step 9 re-run 착수.`

Step 0~8 PASS 유지 · **코드 변경 0** · Step 9 FULL bash만 #D-11·#D-12 패치 반영 재실행.

---

## #D-11 — R-D5 scope (explicit 8 file list)

legacy 디렉터리 recursive scan 제거. CREATE 8파일만 banned token scan:

```bash
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
```

MobileTradeView · useFakeTicker · MobileOrderBook · LeverageSlider = **legacy · NO-TOUCH · R-D5 scope 밖**.

---

## #D-12 — G-D11 sitemap (awk 제거)

단일 파일 `rg -c` 직접 비교:

```bash
URLN=$(rg -c '<url>' public/sitemap.xml)
JLDN=$(rg -l 'application/ld\+json' src/routes/ | wc -l | tr -d ' ')
[ "$URLN" = "42" ] || fail "G-D11 sitemap=$URLN"
[ "$JLDN" = "8" ]  || fail "G-D11 jsonld routes=$JLDN"
```

---

## Step 9 re-run (전문 · #D-11·#D-12 baked)

`EXECUTE_PASTE.md` Step 9 그대로 + 위 두 패치만 치환. 나머지 gate 전부 그대로:

R-D1 · R-D2 · R-D3 · R-D4 · R-D6~R-D10 · #29 · #30 · #37 · G-D5 · G-D12 · G-D14 · red-grep · i18n-parity · vitest

---

## 기대

RED=0 → Step 10 §GREEN **G-D1~G-D15** 보고 · vitest N/N · **12-A Games World-Class LOCK DRAFT 텍스트만** (코드 0).

**G-D15:** scaffold PASS · FOMO/tier/depth/order UI → 12-D v0.2 defer.

---

## 금지

재구현 · Step 0~8 재실행 · 신규 `src/**` edit · gate 축약 · §GREEN/ZIP 주장.

**ZIP/CHANGELOG:** operator **「ZIP 발행」** 전까지 **금지**.

---

## FAIL = RED STOP

Step 9 RED=1 시 honest 보고 · ZIP 금지.

---END---
