# LOVABLE Games Polish · G#4 HiLo — LOCK v0.1

> **상태:** ✅ §GREEN APPROVED · 2026-06-17  
> **큐:** L1-GP Game #4  
> **선행:** G#1–G#3 §GREEN · vitest **611/611** carry

## Scope

HiLo polish-only: Stage card-flip · cumulative multiplier · settle burst · §3.2 outcome-leak (selection-building phase) · §3.1 Path B not-applicable (pre-committed parlay).

## PRE-FLIGHT (confirmed)

- No HiLoAutoSlot · no autoSlot/autoChildren wiring
- No rAF in hilo surface (clean baseline)
- Guesses committed up-front via addGuess → bet → reveal (not live per-card commit)

## §3.2 outcome-leak (blocking)

Leak window: selection-building phase (bet null, guesses growing). CREATE outcome-leak.test.tsx + Playwright pre-addGuess DOM scan.

## §3.1 auto-slot Path B

not-applicable — pre-committed parlay; auto.wiring.test green; no HiLoAutoSlot created.

## EDIT

Stage.tsx flip + multiplier + settle burst · Controls/HUD touch only if data-game-id needed · i18n additive

## NO-TOUCH

styles.css · engine · shared-core 3 · crash/dice/limbo · hilo/index.tsx · existing hilo tests (sibling add OK)

## §GREEN template

HiLo Polish G#4 §GREEN — vitest N/N carry · §3.2 outcome-leak PASS · §3.1 not-applicable (pre-committed parlay) · NO-TOUCH empty · DIFF=0 · rapid replay OK · mobile 0 · WC shots 3 · §3.10 defer · Roulette defer · ZIP defer.

상세: operator chat HiLo G#4 Plan v0.1 APPROVED.

