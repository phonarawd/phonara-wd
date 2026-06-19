# Phase 12-C Home Hub scaffold — LOCK v0.2.2 FINAL + EXECUTE 0→10 (정본)

> **SOT:** [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md) (12-B NO-TOUCH) · [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md) (12-E NO-TOUCH)  
> **상태:** LOCK v0.2.2 **§GREEN** (2026-06-15 · EXECUTE v0.2.2 FINAL) · NEXT **12-D LOCK DRAFT** · **12-C v0.3** FOMO/tier defer  
> **실측:** catalog **1143** (Δ +22) · vitest **356/356** · sitemap **42** · JSON-LD **8** · 신규 **9** 파일 · **ZIP = operator 「ZIP 발행」 전까지 금지**

---

## Scope

**v0.2.2 EXECUTE = 12-C scaffold.** H1~H6 teaser + Footer #19 + Link gate.  
**FOMO / tier §E v35 / live feed → 12-C v0.3 micro** (North Star §6 [ ] 12-C는 v0.3에서 닫힘).

---

## LOCK contract — R-C1 ~ R-C10 + amends

| ID | 규칙 | FAIL |
|----|------|------|
| R-C1 | `home.tsx` head/meta/canonical/JSON-LD Δ=0 | #26 regex |
| R-C2 | 6 슬롯 H1~H6 only · 7번째 금지 | #47 count=6 |
| R-C3 | `data-hub-id="home-{welcome\|checkin\|mission\|referral\|trade\|games}"` | #31 allowlist rg |
| R-C4 | 12-B Earn NO-TOUCH · earn 컴포넌트 import 0 | #28 stat · #52 import rg |
| R-C5 | banned tokens 0 in `components/home/` | rg |
| R-C6 | Footer #19 · 12 토큰 단독 rg | #33 · #44 12 lines |
| R-C7 | 12-E glob + ImportedReferralPage | #36 · #39 · #43 |
| R-C8 | trade glob diff=0 | #40 · #43 |
| R-C9 | games/casino diff=0 · Link `/games` | #27 · #43 |
| R-C10 | ImportedHomePage 보존 | test -f |
| #29 | AppShell `density="app"` | HomeHub rg |
| #30 | fomo diff=0 | #43 |
| G-C14 | home `/partner` = 0 | rg |
| #37 | earn.index + shell/fomo `/partner` carry | 12-B |

---

## i18n

en +22 · ko +22 · catalog **1121→1143** (Δ +22 · DIFF=0 · DUP=0) · 실측 2026-06-15.

---

## EXECUTE GO paste

Lovable operator 답장: §GREEN 본 파일 §6~§8 (EXECUTE paste 정리·흡수됨).

---

## §GREEN (operator 실측 · 2026-06-15 · EXECUTE v0.2.2 FINAL)

```text
Phase 12-C GREEN (scaffold · 1a·2a·3a · /home HomeHub · catalog 1121→1143 · Δ +22)
G-C1  head Δ=0 OK · G-C2 data-hub-id 6/6 OK · G-C3 banned=0 OK
G-C4  Footer #19 12/12 OK · G-C5 footer keys 2+2 OK
G-C6  12-B earn stat+import 0 OK · G-C7 trade Δ=0 · G-C8 12-E Δ=0
G-C9  games/casino Δ=0 · G-C10 ImportedHomePage OK · G-C11 sitemap 42 JSON-LD 8
G-C12 pwa=0 addEventListener 1 file · G-C13 i18n 1143 vitest 356/356
G-C14 home /partner 0 · G-C15 scaffold PASS · FOMO/tier → v0.3
#29 AppShell · #30 fomo · #37 carry · #53 games · #34 red-grep ALL OK
신규 9 files · home.tsx component only · ZIP operator 「ZIP 발행」 전 금지
NEXT: 12-D Trade Surface Pro LOCK DRAFT · 12-C v0.3 FOMO defer
PHONARA handoff v71 baked
```

---

*v0.2.2 FINAL §GREEN · gate amend #42~#53 · 2026-06-15*
