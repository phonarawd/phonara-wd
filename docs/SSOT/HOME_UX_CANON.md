# Home UX Canon (D1)

> **상태:** D1 narrative SSOT (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Home  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Home  
> **Earn detail:** [`EARN_UX_CANON.md`](EARN_UX_CANON.md) — missions/cashout depth  
> **Routes:** `/home` (canonical Earn hub) — [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

## 목표 경험

한눈에 **상태·기회·다음 행동** — Toss·Coinbase·Robinhood·Telegram Mini App에서 추출한 **at-a-glance hub** 경험. `/home`은 Earn funnel entry이며 **parallel Earn hub 0** ([`88-ui-consolidation-wave`](../../.cursor/rules/88-ui-consolidation-wave.mdc) C1).

## Reference

**Primary:** Toss  
**Secondary:** Coinbase · Robinhood · Telegram Mini App

Pattern only — no competitor copy · logo · asset clone.

---

## Layout canon

**Desktop**

- Account/status summary (top)
- Balance/reward snapshot (RPC-backed display only)
- Next best action (single prominent CTA or card)
- Product entry cards: Earn missions · Wallet · **navigate CTAs** → Trade · Sports · Casino (각각 `/trade` · `/sports` · `/casino` — embed **금지** · [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19)
- Activity feed · trust/restriction cues (side or below on wide)

**Mobile**

- Status summary compact top
- Value-ordered feed/cards — minimal scroll to primary action
- Sticky canonical BottomNav — `/home` tab active
- Safe-area aware · 48px+ touch on primary entries

---

## Required modules

Status Summary · Balance/Reward Snapshot · Next Best Action · Product Entry Cards (Earn/Wallet/Trade·Sports·Casino navigate) · Activity Feed · Trust Cues (KYC/RG/halt/restriction) · Onboarding/Restriction Banner (when applicable)

---

## Priority order

1. Current status (who am I · any blockers)
2. Next best action (one clear recommendation)
3. Money/reward snapshot
4. Product entry (Earn · Wallet · Trade · Sports · Casino — navigate only)
5. Recent activity · social proof (truthful presentation props only)

---

## Interaction · density · trust

| Dimension     | Rule                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| **Density**   | Low–medium on mobile · avoid card clutter on desktop                                                        |
| **Hierarchy** | status → action → money → entry points → feed                                                               |
| **Trust**     | restrictions visible with next step — never hidden to improve conversion                                    |
| **Tone**      | warm natural Korean in i18n · no exaggerated reward claims ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)) |
| **FOMO**      | restrained · eligibility-visible · presentation strings only                                                |

Activity feed · streaks · participation counters — **presentation string display props**, not engine/RPC mutations ([`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)).

---

## Relationship to Earn

| Surface                                           | Role                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| **`/home`**                                       | Hub — status · next action · entry cards · light feed (`p8-page-home`) |
| **`/home/missions`** · **`/home/attendance`** · … | Earn depth — [`EARN_UX_CANON.md`](EARN_UX_CANON.md)                    |
| **`/dashboard`** · **`/earn`**                    | Redirect → `/home` — **standalone rebuild 금지**                       |

---

## Engine boundary

- Home/Earn controllers and hooks — display only, no client reward/balance recompute
- Canonical nav: BottomNav · HomeSideNav · MoreMenu · WelcomeSheet — all `/home` for Earn hub

---

## Forbidden

- Random promo feed · false social proof · duplicate Earn hubs
- `/earn` as parallel U-phase surface
- Client-side balance/reward arithmetic
- Hidden eligibility for missions or cashout
- Bet hub embed on `/home` · `/trade?section=sports|casino` CTA

---

## Completion signals

- User understands value and next step within seconds
- Canonical `/home` only · `check:ui-architecture` dual-earn-hub **0**
- Responsive 390/768/1024 · token-only styling
- Lightweight vitest on Home desk surface green
