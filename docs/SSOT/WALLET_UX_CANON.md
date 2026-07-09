# Wallet UX Canon

> **상태:** D1 narrative SSOT (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Wallet  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Wallet  
> **Payment structure:** [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md)  
> **Display contract:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) — Wallet/Ledger rows  
> **Routes:** `/wallet` · `/ledger` · `/staking` — [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

## 목표 경험

잔액 우선 — "지금 쓸 수 있는 금액" 즉시 이해, deposit/withdraw 1–2 tap visible, timeline에서 pending/settled/failed와 원인 설명.

## Reference

**Primary:** Toss  
**Secondary:** Revolut · Apple Wallet · Coinbase Wallet

---

## Layout canon

**Desktop:** top total assets (available/locked) · main asset cards · side deposit/withdraw/transfer/KYC · bottom transaction timeline

**Mobile:** top summary · immediate CTA row (deposit/withdraw/transfer) · balance cards · recent timeline

---

## Required modules

Total Asset Summary · Available/Locked Balance · Deposit/Withdraw/Transfer CTA · Pending/Settled/Failed Status · Transaction Timeline · KYC/Restriction Notice · Fee/Network/Settlement Explanation · Staking APR/rewards ( `/staking` )

---

## Priority order

1. User balance clarity (“how much can I use?”)
2. Deposit/withdraw action
3. Pending or restricted state
4. Transaction history
5. Details and support

---

## Display data (contract-bound)

**Exposed:** heroBalanceDisplay · phonAvailableDisplay · usdtAvailableDisplay · withdrawAvailableDisplay · giftcardPreviewFeeDisplay · ledger rows · staking balanceDisplay/rewardsDisplay/aprDisplay

**Rule:** `@phonara/money` display helpers · no JS number arithmetic for balances/fees

---

## Payment integration

Provider card pattern — crypto · bank · gift card · future PG share grammar ([`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md))

**KRW bank (Hybrid L3 · E1a):** show reference code · transfer amount · expected PHON (RPC field) · status timeline · SLA copy from `sla_hours`. Ingest is operator SOP — **forbidden:** “자동 입금 감지” · instant/auto-detect claims. Contract: [`REBUILD_ENGINE_SSOT.md`](REBUILD_ENGINE_SSOT.md) §E1a.

---

## Forbidden

- Hiding locked balance
- Ambiguous pending status
- Small/buried deposit/withdraw CTAs
- Client-side money arithmetic
- Fake auto-detect / instant bank credit copy when Hybrid L3 (E1a) active

---

## Completion signals

- Beginner answers balance question immediately
- Obvious deposit/withdraw path
- Every transaction state explains outcome
- Money helpers and controller contracts unchanged
