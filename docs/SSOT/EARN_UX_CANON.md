# Earn UX Canon

> **상태:** D1 narrative SSOT (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Earn  
> **Home hub:** [`HOME_UX_CANON.md`](HOME_UX_CANON.md)  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Earn · §Home  
> **Routes:** `/home` (canonical Earn hub) · `/home/missions` · `/dashboard` · `/events` — [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

## 목표 경험

쉬운 미션 · 누적 보상 · 초보자 설명 — action · reward · effort · cashout 즉시 이해. 과장·거짓 urgency·숨겨진 eligibility 금지.

## Reference

**Primary:** Toss  
**Secondary:** Cashwalk · PanelNow · Obey · Coupang Partners · reward apps

**Redirect:** `/earn` → `/home` — standalone `/earn` rebuild **금지**

---

## Layout canon

**Desktop:** today earnings · available reward · cashout path · recommended missions · category sections (survey · app install · shopping · partner · referral · check-in) · streak/tier side panel

**Mobile:** today earnings top · category quick tabs · mission cards (reward · time · difficulty · progress) · cashout/referral CTA bottom

---

## Required modules

Today Earnings · Available Reward · Recommended Missions · Mission Category Tabs · Mission Card (reward/time/difficulty) · Progress/Completion · Partner/Referral Entry · Cashout CTA · Reward timing/eligibility explanation · bonus/real/wagering display (RPC-backed)

---

## Priority order

1. What can I earn today?
2. What should I do next?
3. How long and how hard?
4. When can I cash out?
5. How do referral/partner rewards work?

---

## Tone

- Warm · novice-friendly · natural Korean ([`UX_WRITING_GUIDE.md`](UX_WRITING_GUIDE.md))
- Light emoji OK in general earn copy ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md))
- **Forbidden:** exaggerated rewards · false urgency/deadline · hidden eligibility · deceptive FOMO

Conversion surfaces (activity feed · streaks · participation counters) allowed as **presentation string display props** — not engine mutations.

---

## Home hub relationship

`/home` = canonical Earn hub — single product entry ([`UI_INVENTORY.md`](UI_INVENTORY.md)). No duplicate Earn/Home hub.

Home blueprint modules: account status · balance/reward snapshot · next best action · product entry cards · activity feed · trust cues — [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Home.

---

## Forbidden

- Multiple competing home hubs
- False activity misleading social proof
- `/earn` as parallel rebuild surface

---

## Onboarding journey (§13.11)

First 7-day arc — [`ONBOARDING_JOURNEY_CANON.md`](ONBOARDING_JOURNEY_CANON.md) · `onboarding-journey-display-contract.ts` · i18n `onboarding.journey.*`. D5/D6 deposit·play are **optional** — never force-required copy.

---

## Completion signals

- Novice understands action · reward · effort · cashout
- Repeat participation without deception
- Canonical `/home` only · check:ui-architecture dual-earn-hub 0
