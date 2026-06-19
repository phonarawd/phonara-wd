# LOVABLE Phase 12 · Tier Guide v0.1 LOCK (L1-13b)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — after L1-13a.1 §GREEN
> **Scope:** NEW leaf `/tier` — VIP ladder table · XP thresholds · perks · FAQ JSON-LD
> **상위:** PHONARA_LOVABLE_CANVAS_GAP_AUDIT.md · TierProgressPanel (Home) reuse OK · **no Hub reorder**

---

## Scope (1줄)

Dedicated **`/tier`** leaf — Stake-grade tier guide table · 5-tier perks copy · `tier.guide.*` i18n — **presentation/mock only** · engine tier RPC **0**.

---

## L1-13b vs L3-06 VIP tier engine (operator 정본)

| | L1-13b (이 슬라이스) | L3-06 (별도 · scope 밖) |
|---|---------------------|-------------------------|
| **트랙** | L1 Lovable canvas | L3 Cursor Engine |
| **산출** | `/tier` UI · 목업 ladder · i18n | VIP tier **schema + RPC** · XP read |
| **숫자 SOT** | canvas `tier.*` + Plan 목업 | DB/RPC (GO 후) |
| **GO** | 큐 head 순차 EXECUTE | operator **「VIP tier Engine GO」** 필수 |
| **혼동 금지** | — | `profiles.kyc_tier`(KYC) ≠ VIP casino tier |

**기본 경로 (권장):** L1-13b 목업 안내표 → GATE/ZIP → paste(L2) → (원하면) L3-06 wire.

**엔진 우선 경로:** operator GO → L3-06 Plan 먼저 → UI는 RPC SOT에 맞춤 · **L1-13b에서 Supabase/RPC invent 금지**.

**정본:** PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md §3.1.1 · §3.3 L3-06

---

## 산출물

| # | 항목 |
|---|------|
| T1 | `routes/tier.tsx` + ImportedTierGuidePage |
| T2 | Ladder table: bronze→diamond · threshold · cashback · withdraw · support · bonus (**목업**) |
| T3 | JSON-LD FAQPage or BreadcrumbList |
| T4 | catalog **+12~16** keys `tier.guide.*` ko=en |

---

## NO-TOUCH

- Home Hub mount reorder · TierProgressPanel regression OK (link CTA to `/tier` allowed)
- **engine/RPC · Supabase · real tier balance · VIP schema**
- ZIP/paste (GATE 전)

---

## LOCK Footer

**FAIL =** Hub layout reorder · JSX [가-힣] · catalog DIFF≠0 · vitest regression · only 5 name keys reused without guide copy · engine/RPC invent · kyc_tier를 VIP tier로 착각

---

*operator REVIEW after L1-13a.1 §GREEN*
