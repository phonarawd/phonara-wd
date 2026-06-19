# LOVABLE Games Polish · G#1 Crash — LOCK v0.1 + World Crush Moment Bar (FINAL)

> **상태:** ✅ §GREEN APPROVE · 2026-06-17 · REVISE #9 반영  
> **큐:** L1-GP Game #1 · PHONARA_LOVABLE_GAMES_POLISH_MASTER.md  
> **갱신:** 2026-06-17

## Scope

Crash presentation-only: CrashAutoSlot · skin/gradient cache · World Crush moment · 4-state cashout · CrashHistoryStrip. 엔진·shared-core·styles.css 0-touch.

## PRE-WORK

(b) getComputedStyle 3×/frame → ref cache + gradient (color,H) cache. render loop 안 getComputedStyle = FAIL.

## CREATE

CrashAutoSlot.tsx · CrashHistoryStrip.tsx · __tests__/CrashAutoSlot.test.tsx · __tests__/Stage.renderPath.test.tsx

## EDIT

Controls.desktop/mobile (autoSlot wire) · Controls.shared CrashCashoutSlot 4-state (cashoutMultiplier mirror) · Stage.tsx moment+perf · i18n additive

## 4-state

armed: commitment&&!busy&&!bet · pending: busy · success: cashedOut&&cashoutMultiplier>=1.01 · miss: phase crashed read-only&&!cashedOut

## NO-TOUCH

styles.css · packages/game-engine/** · useAutoBetQueue · AutoBetPanel · BetModeTabs · FROZEN 3 · 기존 crash __tests__

## §GREEN

§3 raw 1~10 + screenshots 3. Dice after APPROVE. ZIP defer.

상세: operator chat FINAL LOCK v0.1 + World Crush Moment Bar (REVISE #9) 정본.


## §GREEN

Crash Polish G#1 §GREEN — vitest 603/603 · §3.1 1280+390 PASS · Stage withAlpha hotfix approved · i18n DIFF=0 · perf p50=33.3ms@4x deferred compare · mobile 0 · WC shots 3.
