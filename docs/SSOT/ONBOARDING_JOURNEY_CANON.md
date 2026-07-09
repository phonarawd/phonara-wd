# Onboarding Journey Canon — First 7 Days (31차)

> **상태:** `[x] operator 흡수` · `[x] p6-doc-platform-canon-sync` (2026-07-05)  
> **Authority:** Plan §13.11 · [`EARN_UX_CANON.md`](EARN_UX_CANON.md) · [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) · `onboarding-journey-display-contract.ts`  
> **구현:** `p6-page-onboarding*` · P7 missions handoff · i18n `onboarding.journey.*`

## 목표

가입 후 **7일 안에** “부업 습관 + 첫 PHON + (선택) 첫 활동” 루프를 완성.  
**광고·설문 미션 없음** (§13.0).

---

## Day arc (display contract)

| Day    | Theme             | Primary CTA route           | Engine                     |
| ------ | ----------------- | --------------------------- | -------------------------- |
| **D0** | Welcome + 첫 미션 | `/onboarding/missions`      | `rpc_claim_welcome_bonus`  |
| **D1** | 출석 루틴         | `/home/attendance`          | `rpc_claim_daily_reward`   |
| **D2** | 친구 초대 소개    | `/referral/invite`          | viral read                 |
| **D3** | 링크 공유         | Web Share → claim           | `share_referral_link`      |
| **D4** | 프로필 완성       | `/account/profile`          | `complete_profile` trigger |
| **D5** | 첫 입금 (선택)    | `/wallet/deposit`           | `first_deposit`            |
| **D6** | 첫 플레이 (선택)  | `/casino` or `/trade`       | `first_trade`              |
| **D7** | 주간 미션 전환    | `/home/missions` weekly tab | `weekly_*`                 |

**D0 mission id 격리:** onboarding claim ≠ hub duplicate (§3.4.3 `ONBOARDING_D0`).

---

## Funnel rules

1. Auth complete → `/onboarding` until handoff complete (`onboarding-handoff-display-contract.ts`)
2. `/home` “오늘의 3가지” = Day arc와 **충돌 0** — recommended RPC 우선
3. Push/toast: journey step당 **1 channel** (§3.4)

---

## i18n keys

Prefix: `onboarding.journey.day{d}.*` · `onboarding.journey.cta.*`

---

## FAIL

- Day마다 duplicate welcome bonus toast
- D5/D6을 필수로 강제 (선택 copy 명시)
- Journey progress client-side invent (RPC/display contract only)
