# Phase 12-D v0.1.1 — route split micro-patch LOCK (정본 · operator GO)

> **선행:** 12-D scaffold 8파일 + i18n **1165** DONE · Step 9 #D-11~#D-13  
> **operator GO (2026-06-15):** **옵션 B · 진행** · i18n **+0** · sitemap **43** (priority **0.5** · changefreq **weekly**)  
> **상태:** v0.1.1 EXECUTE GO · Lovable Step 0→5  
> **NEXT after GREEN:** 12-A Games World-Class LOCK DRAFT

---

## 0. 문제

v0.2 분기 3a (`/trade`→TradeHub) = LOCK PASS · **PRODUCT/North Star FAIL** — 터미널 UX 회귀.

---

## 1. Mission

`/trade` → **ImportedTradePage** · `/trade/hub` → **TradeHub** · 8 scaffold + catalog **1165** 보존.

---

## 2. 변경 (3 touch · scaffold 8 NO-TOUCH)

| # | 파일 | 액션 |
|---|------|------|
| 1 | `src/routes/trade.tsx` | component → **ImportedTradePage** · head/meta/canonical/JSON-LD **Δ=0** |
| 2 | `src/routes/trade.hub.tsx` | **CREATE** · `createFileRoute("/trade/hub")` · **TradeHub** mount |
| 3 | `public/sitemap.xml` | **EDIT** · `/trade/hub` 1 `<url>` 추가 |

**`src/components/trade/TradeHub.tsx` + 7 cards/Footer:** **변경 0** (density=`trade` · 6 card + Footer 유지).

**T1~T4 cards:** 이미 `to="/trade"` 이면 **edit 0** · R-D4v gate로 검증만.

---

## 3. `trade.hub.tsx` head · i18n

- **i18n Δ +0** — 기존 `trade.hub.hero.title` · `trade.hub.hero.desc` **재사용** (catalog **1165** 유지)
- `seo.trade.hub.*` 신규 키 **금지** (operator 확정)
- route head: title/description = 위 hero 키 · **JSON-LD 불필요** (hub scaffold)

---

## 4. sitemap (#D-15)

| 항목 | 값 |
|------|-----|
| baseline | 42 |
| target | **43** |
| 신규 loc | `/trade/hub` |
| priority | **0.5** |
| changefreq | **weekly** |

**G-D11:** `URLN=43` · **JSON-LD routes = 8** 유지 (#D-12 parser · `rg -c` 단일 파일).

---

## 5. NO-TOUCH

- `ImportedTradePage.tsx` file diff = 0 (R-D10)
- earn · home · referral/partner · fomo · games/casino · `src/games/**`
- 12-C · 12-E carry

---

## 6. Gates (v0.1.1)

| ID | 규칙 |
|----|------|
| R-D1v | `trade.tsx` head Δ=0 |
| R-D2v | `trade.hub.tsx` + TradeHub mount |
| R-D3v | `trade.tsx` → ImportedTradePage |
| R-D4v | T1~T4 `to="/trade"` · cards에 `to="/trade/hub"` 0 |
| G-D11 | sitemap **43** · jsonld **8** (#D-15) |
| carry | R-D2~R-D10 · G-D5~G-D14 · #D-11~#D-13 |

---

## 7. §GREEN · defer

- catalog **1165** · vitest **356/356** (#D-13 output assert)
- **G-D15:** v0.1.1 route split PASS · sub-route/FOMO/depth → **12-D v0.2 defer**
- **ZIP 금지**

---

*v0.1.1 FINAL · #D-14~#D-15 · operator GO · 2026-06-15*
