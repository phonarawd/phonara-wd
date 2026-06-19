# Phase 12-D Trade Surface Pro — LOCK v0.2.2 FINAL + EXECUTE 0→10 (정본)

> **SOT carry:** [`LOVABLE_ZENITH_PHASE12_C_LOCK.md`](LOVABLE_ZENITH_PHASE12_C_LOCK.md) · [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md) · [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md)  
> **상태:** LOCK v0.2.2 + v0.1.1 **§GREEN** (2026-06-15) · NEXT **12-A Games World-Class LOCK DRAFT**  
> **실측:** catalog **1143→1165** (Δ +22) · vitest **356/356** · sitemap **42→43** · JSON-LD **8** · scaffold **8** + `trade.hub.tsx` · `/trade`=ImportedTradePage · `/trade/hub`=TradeHub · **ZIP = operator 「ZIP 발행」 전까지 금지**

---

## 0. Scope

**v0.2 EXECUTE = 12-D scaffold slice.** T1~T6 teaser + Footer #20 + Link gate · `/trade` route component swap · head Δ=0.  
**engine / orderbook / payout / websocket → 12-Z defer.**  
**FOMO / tier / depth / order UI → 12-D v0.2 defer.**

---

## 1. Mission (한 줄)

`/trade` — `ImportedTradePage` **file 보존 (R-D10)** · `TradeHub` 6-card scaffold · `<AppShell density="trade">` · 12-C home + earn + E + games + fomo **NO-TOUCH**.

---

## 2. 분기 (1a · 2a · 3a · #D-5)

| # | 항목 | 확정 |
|---|------|------|
| 1 | Layout | `TradeHub` = `<AppShell density="trade">` + 6 cards + Footer (**#D-5** · 12-C `app` 아님) |
| 2 | Footer #20 | `TradeHubFooter.tsx` 단일 하단 |
| 3 | route | `trade.tsx` **component만** `TradeHub` · head Δ=0 |

Step 0: `rg -n 'AppShell density=' src/components/pages/ImportedTradePage.tsx` baseline 스냅샷 · Hub **동일 literal**.

---

## 3. Files

**CREATE (8):** `src/components/trade/` — TradeHub · T1~T6 cards · TradeHubFooter  
**EDIT (3):** `trade.tsx` · `en.ts` · `ko.ts` (+22 each)  
**PRESERVE (R-D10):** `ImportedTradePage.tsx` — DELETE 금지 · **file stat = 0** (#D-2 · #D-6)

| T | card | data-hub-id | Link |
|---|------|-------------|------|
| T1 | TradeMarketsMirrorCard | trade-markets | — |
| T2 | TradeOrderTeaserCard | trade-order | scaffold |
| T3 | TradePositionsTeaserCard | trade-positions | stub |
| T4 | TradeHistoryTeaserCard | trade-history | stub |
| T5 | TradeReferralTeaserCard | trade-referral | `/referral` only |
| T6 | TradeGamesTeaserCard | trade-games | `/games` only |

---

## 4. LOCK contract — R-D1 ~ R-D10 + carry

| ID | 규칙 | FAIL |
|----|------|------|
| R-D1 | `trade.tsx` head/meta/canonical/JSON-LD Δ=0 only (**route full quiet 금지 #D-6**) | #26 regex on `git diff trade.tsx` |
| R-D2 | 6 슬롯 only · 7번째 금지 | count=6 |
| R-D3 | `data-hub-id="trade-{markets\|order\|positions\|history\|referral\|games}"` | allowlist rg |
| R-D4 | earn NO-TOUCH + **components/trade/** cross-import ban (#D-9) | stat · import rg |
| R-D5 | banned tokens 0 in **8 CREATE files only** (#D-11 · legacy `components/trade/` 제외) | rg on allowlist |
| R-D6 | Footer #20 · 12 fixed rg lines | #33/#44 |
| R-D7 | 12-E glob + ImportedReferralPage | #36/#39 |
| R-D8 | `games.*` · `casino.*` · **`src/games/` only** (#D-7) | quiet |
| R-D9 | **12-C home carry** — `home.tsx` · `components/home/` | quiet |
| R-D10 | `ImportedTradePage.tsx` file stat = 0 | test -f · quiet file only |

**carry:** #29 density=trade · #30 fomo · #37 earn.index + `/partner` · G-D14 trade `/partner`=0

---

## 5. i18n (#D-1)

en +22 · ko +22 · catalog **1143 → 1165** (Δ +22 · DIFF=0 · DUP=0).

Keys: `trade.hub.hero.{title,desc}` · `trade.section.{markets|order|positions|history|referral|games}.{title,desc,cta}` · `trade.footer.{note,learnMore}`.

---

## 6. ZIP 게이트 (#D-3)

operator **「ZIP 발행」** 전까지 ZIP/CHANGELOG KB **금지** (`92-lovable-lock-execute.mdc` §ZIP 게이트).

---

## 7. Defer

- **12-D v0.2:** FOMO/tier badge · market depth · hover tooltip · order UI
- **12-D v0.3:** order ticket interaction+ · positions filter
- **12-Z:** engine wire · orderbook realtime · payout · websocket

---

## 8. EXECUTE GO — ✅ 완료

Step 9~10 · §GREEN **G-D1~G-D15** · amend **#D-11~#D-15** — 본 파일 §9~§13. (구 EXECUTE paste는 정리·흡수됨.)

---

## 9. §GREEN gate ID

**G-D1~G-D15** (12-C G-C 동형 · scope=`trade` · carry=12-C home). G-D11 sitemap = `rg -c` 단일 파일 (#D-12) · JSON-LD = `rg -l` route count (#D-8). **G-D13** = i18n-parity + vitest **summary output assert** (#D-13 · exit code alone 금지) · catalog **1143→1165** Δ +22.

---

## 10. amend #D-11 · #D-12 (Step 9 RED=2 · EXECUTE 1차)

| ID | RED | 원인 | amend |
|----|-----|------|-------|
| #D-11 | R-D5 | `components/trade/` legacy 4건(MobileTradeView 등) Math·toFixed — scaffold 무관 | R-D5 scope = **8 CREATE 파일 explicit list** |
| #D-12 | G-D11 | `rg -c` 단일 파일 출력 `42`만 → `awk -F:` $2 빈값 → 0 | `URLN=$(rg -c '<url>' public/sitemap.xml)` (**awk 제거**) |

**FAIL =** Step 9에서 구 scope R-D5 디렉터리 전체 scan · G-D11 awk 합산 재사용.

---

## 11. amend #D-13 (Step 9 RED=1 · vitest exit flake · EXECUTE 2차)

| ID | RED | 원인 | amend |
|----|-----|------|-------|
| #D-13 | G-D13 | `bunx vitest run \|\| fail` — jsdom `plinko/Stage.tsx` canvas `setTransform` unhandled · **356/356 PASS** but exit 1·0·1 flaky | vitest = **summary line output assert** (Tests N passed (N) · Test Files N passed (N) · 0 failed) · **exit code 무시** |

**plinko guard:** `src/games/plinko/Stage.tsx` 수정 = **12-A scope** · 12-D NO-TOUCH.  
**FAIL =** G-D13에서 exit code만으로 fail · 또는 Tests summary mismatch / failed > 0.

---

## 12. v0.1.1 route split (#D-14~#D-15 · operator GO · 2026-06-15)

**문제:** v0.2 분기 3a `/trade`→TradeHub = LOCK PASS · **PRODUCT_PLAN/North Star FAIL** (터미널 UX 회귀).

**조치:** v0.1.1 route split — §GREEN §13 · 상세는 본 파일 §12~§13

| path | component |
|------|-----------|
| `/trade` | `ImportedTradePage` 복원 |
| `/trade/hub` | `TradeHub` (hero i18n 재사용 · sitemap **43**) |

| #D-15 | G-D11 **42→43** · `/trade/hub` priority **0.5** changefreq **weekly** · i18n **+0** · JSON-LD **8** |

**FAIL =** `/trade` hub 유지 · sitemap≠43 · catalog≠1165.

---

## 13. §GREEN (operator 실측 · 2026-06-15 · v0.1.1 route split)

```text
Phase 12-D GREEN (scaffold v0.2 + v0.1.1 UX revert · catalog 1143→1165 · Δ +22)
/trade → ImportedTradePage (호가/차트/주문 UI 복원) · /trade/hub → TradeHub 6-card
8 scaffold components + TradeHubFooter 보존 · ImportedTradePage file stat=0
i18n 1165=1165 · sitemap 43 · JSON-LD routes 8
G-D15 scaffold PASS · FOMO/tier/depth/sub-route → 12-D v0.2 defer
amend trail: #D-11~#D-15 · vitest 356/356 (#D-13 output assert)
ZIP operator 「ZIP 발행」 전 금지
NEXT: 12-A Games World-Class LOCK DRAFT · PHONARA handoff v73 baked
```

---

*v0.2.2 + v0.1.1 §GREEN · amend #D-1~#D-15 · 2026-06-15*
