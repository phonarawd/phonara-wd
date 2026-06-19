# LOVABLE Phase 12 · SEO Leaf v0.1 LOCK (L1-12)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — L1-11 §GREEN · catalog baseline **1512**
> **Scope:** 12-G leaf route head audit — canonical · JSON-LD · og/twitter meta · sitemap alignment
> **상위:** LOVABLE_ZENITH_PHASE12_G_LOCK.md (부분 §GREEN) · PHONARA_SEQUENTIAL_EXECUTION_CONTRACT L1-12
> **Paste defer:** og:image · og:url · canonical **absolute URL** — Lovable relative OK · paste 시 origin swap

---

## Scope (1줄)

**leaf route** head 전수 audit/fix — i18n SEO keys · BreadcrumbList/JSON-LD 누락 · canonical 상대 경로 정합 · **hub/games mount 0-touch**.

---

## 산출물 (Plan에서 route 목록 확정)

| # | 항목 | 대상 |
|---|------|------|
| S1 | leaf inventory | 12-Z 실측 **54 routes** 대비 head hit 전수 |
| S2 | JSON-LD | route file별 schema명 hit · wc -l 실측 N |
| S3 | og/twitter | title/desc/image relative · i18n key |
| S4 | sitemap | public/sitemap.xml route parity |
| S5 | catalog Δ | Plan **+N** · ko=en strict |

---

## NO-TOUCH

- Hub/games/routes **mount reorder** · `/sports` L1-08 defer
- og **absolute URL** 강제 치환 (paste memo)
- engine · ZIP · paste

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | **route head + i18n + public/sitemap only** |
| F2 | JSON-LD: schema명 route file hit + wc -l **실측 N** (고정 8 금지) |
| F3 | catalog **1512 + N** · ko=en DIFF=0 |
| F4 | vitest **82/2 · 384/4 NO-REGRESSION** |
| F5 | ZIP · paste · engine **0** |

**FAIL =** hub layout touch · absolute og invent · catalog DIFF≠0 · vitest regression

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LOCK APPROVE · catalog **1512** |
| 1 | Plan: leaf route table · head gap · +N keys → Cursor APPROVE |
| 2 | head/JSON-LD fixes |
| 3 | sitemap parity |
| 4 | vitest |
| 5 | §GREEN report |
| 6 | §GREEN self-check full block |

---

## §GREEN self-check (Step 6)

```bash
rg "BreadcrumbList|WebApplication|FAQPage" src/routes/ --count
wc -l <(rg "application/ld\+json" src/routes/ -l)  # 실측 N in report
rg "og:image|twitter:image|canonical" src/routes/
rg "seo\." src/i18n/ko.ts | wc -l
# catalog KO=EN · baseline 1512 · Δ=N
# vitest 82/2 · 384/4
# games/ hub mount diff = 0
```

---

*operator REVIEW → APPROVE / REVISE → Plan first*