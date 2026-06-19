# LOVABLE World Crush · Stake-equivalent Typography LOCK — L1-24 v0.2 EXECUTE

> **상태:** **✅ §GREEN** · **Pass 1.1 ✅ §GREEN** (D2+D3 · 2026-06-17) · D1 **held (L1-24b)** · vitest **586/586** · i18n **2620/2620** · ZIP defer  
> **큐 ID:** **L1-24** (Stake-grade system font + type scale · Lovable canvas · ZIP defer)  
> **레퍼런스:** Stake.com Playwright 실측 (desktop 1440 / mobile 390)  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4

---

## Scope (1줄)

**pass 1 = global CSS only.** 5 webfont (Sofia Sans · Sofia Condensed · Inter · Archivo Black · full Pretendard CDN bloat) → **system-ui + Pretendard ko subset (1 webfont)** · Stake type scale · root **16px** mobile+desktop · **컴포넌트 JSX 0**.

---

## Files

| ID | path | action |
|----|------|--------|
| T24-1 | `src/routes/__root.tsx` | Purge `<link>` Sofia Sans / Inter / Archivo Black / googleapis preconnect for those families · **Pretendard subset stylesheet only** (jsdelivr · already present) |
| T24-2 | `src/styles.css` | Rewrite `--font-sans` / `--font-display` / `--font-skin-sans` / `--font-skin-display` → Pretendard+system-ui stack · `@layer base` Stake scale · remove `.font-display` Sofia override (re-map same stack · weight 600) |
| T24-3 | `src/components/typography/__tests__/stake-typography.test.tsx` | **NEW** — `--font-sans` Pretendard-leading stack · html computed **16px** |

**DELETE 0** · packages/* 0 · i18n **Δ=0**

---

## Type scale (`@layer base` · styles.css)

```css
html, body { font-size: 16px; line-height: 1.15; font-weight: 400; }
h1 { font-size: 2.5rem;  font-weight: 600; line-height: 1.25; }
h2 { font-size: 1.5rem;  font-weight: 600; line-height: 1.25; }
h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
p  { font-size: 1rem;    font-weight: 400; line-height: 1.5; }
small, .text-meta { font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
button { font-size: 0.875rem; font-weight: 600; }
.font-money { font-variant-numeric: tabular-nums; font-weight: 600; }
```

**Mobile 390:** root **16px** — **no shrink**.

**Font stack:**

```css
--font-sans: "Pretendard Variable", Pretendard, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
  "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", ...;
```

`--font-display` / `--font-skin-*` → **same stack** (weight 600 for display · no Archivo).

---

## NO-TOUCH (pass 1)

Wallet · home · trade · casino **components** · routes (except `__root.tsx` links) · i18n keys · engines · RPC · Crash FROZEN · L1-17 TradeModeShell · `[data-skin="mobile-crush"]` **semantic mapping** (font-family literal swap only · behavior 0)

---

## World Crush bar

| # | 필수 | FAIL |
|---|------|------|
| TY1 | Sofia/Archivo **0** · Inter **0** in styles.css + __root.tsx | 5-font LCP |
| TY2 | Pretendard **≤1** (ko subset · jsdelivr) · googleapis **0** | fonts.googleapis |
| TY3 | root **16px** mobile + desktop | 14px shrink |
| TY4 | vitest **581/581** (580 + 1 smoke) · DIFF=0 | regression |
| TY5 | wallet navy+mint tone carry (L1-10-W-T) | tone break |

---

## LOCK Footer T24-F1 ~ F6

| # | 고정 |
|---|------|
| F1 | Sofia / Inter / Archivo **0** in src (i18n string "Inter" OK) |
| F2 | system-ui + Pretendard(ko) · 4 font CSS vars unified |
| F3 | html **16px** root carry mobile+desktop |
| F4 | weight **400/600** only in base layer |
| F5 | vitest **carry (measured)** · i18n DIFF=**0** |
| F6 | wallet navy+mint tone carry · ZIP defer |
| F7 | **Cursor/operator:** Lovable canvas **≠ `main` unprotected** · branch protection 확인 후 EXECUTE GO |

---

## Pass 1.1 — D2 + D3 only (**✅ §GREEN** · D1 held)

**Scope:** test tighten + i18n parity confirm · **`styles.css` NO-TOUCH** (`line-height: 1.15` preserved until dense-row screenshot).

| # | File | Change |
|---|------|--------|
| **D2** | `src/components/typography/__tests__/stake-typography.test.tsx` | Pretendard **startsWith** lock · `__root.tsx` googleapis lock · carry 5 assertions |
| **D3** | (grep/script only) | i18n parity · expect **DIFF=0** · no key edits |
| — | `src/styles.css` | **held** — D1 `line-height 1.15→1.5` pending trade orderbook + bet feed screenshot |
| — | `src/routes/__root.tsx` | **NO-TOUCH** |

### D2 assertions (+2 · 0 removed · 0 weakened)

1. Extract `--font-sans` value · strip whitespace · **`startsWith('"Pretendard Variable"')`** (demote Pretendard = FAIL)
2. **`expect(root).not.toMatch(/fonts\.googleapis/)`** on loaded `__root.tsx` string only — **no** redundant `styles.css` googleapis test (§GREEN `rg` is defender)
3. Carry existing 5 assertions unchanged · `system-ui` presence check stays

**FAIL =** Pretendard not first in stack · googleapis in `__root.tsx` · any carried assertion weakened · vitest file count ≠ 1

### D3 verification (paste raw output · revised fallback)

**Primary:**

```bash
bash scripts/i18n-parity.sh
```

**Fallback (script absent or non-zero):** **do not** `node -e 'require("./src/i18n/ko.ts")'` — Node cannot load TS at runtime (always errors). Use pure `rg` key-count diff:

```bash
KO=$(rg -c '^\s*[a-zA-Z0-9_."\[\]]+:\s' src/i18n/ko.ts)
EN=$(rg -c '^\s*[a-zA-Z0-9_."\[\]]+:\s' src/i18n/en.ts)
echo "ko=$KO en=$EN diff=$((KO-EN))"
```

Report **ko**, **en**, and **diff** — `0=0` false-positive (both empty/unreadable) must be visible.

**Full verification block:**

```bash
bunx vitest run    # BASELINE = N pre-edit

# (edit D2)

bunx vitest run    # POST — +2 assertions · file count unchanged · fail=0

rg -i 'Sofia|Archivo Black' src/
rg -i "['\"]Inter['\"]" src/styles.css src/routes/__root.tsx
rg -n 'fonts\.googleapis' src/

bash scripts/i18n-parity.sh || (
  KO=$(rg -c '^\s*[a-zA-Z0-9_."\[\]]+:\s' src/i18n/ko.ts)
  EN=$(rg -c '^\s*[a-zA-Z0-9_."\[\]]+:\s' src/i18n/en.ts)
  echo "ko=$KO en=$EN diff=$((KO-EN))"
)
```

**PASS (reviewer 3-point):** (1) BASELINE→POST fail=0 · file count unchanged · (2) all 4 greps **0 hits** · (3) i18n **measured diff=0** with ko/en counts visible — not a fallback error message · D1 css **unchanged**

### Pass 1.1 §GREEN evidence (operator · 2026-06-17)

| Check | Result |
|-------|--------|
| vitest BASELINE→POST | **586/586** · **118** files · fail=**0** · file count unchanged |
| D2 | +2 assertions **inside existing `it` blocks** (not new tests — intentional) |
| rg Sofia\|Archivo Black | **0** real refs (comments + test self-refs only) |
| rg Inter styles+root | **0** |
| rg fonts.googleapis | **0** real refs (test comment only) |
| i18n | **KO=2620 EN=2620 DIFF=0** |
| LOCK F1–F6 | ✅ · F7 operator branch check |
| D1 | **parked** — orderbook + bet-feed screenshot pending |

**§GREEN template (Pass 1.1):**

```text
L1-24 Pass 1.1 §GREEN — D2 test lock + D3 parity · vitest 586/586 carry · KO=2620 EN=2620 DIFF=0 · Sofia/Inter/Archivo/googleapis 0 · line-height 1.15 held · ZIP defer.
```

### D1 held (L1-24b · operator screenshot gate)

Trade orderbook + bet feed densest rows screenshot → judge:

- rows inherit base leading → keep `1.15` or compromise `1.3` · target `p`/`li` for `1.5` only
- rows carry own `leading-*` → safe to flip base to `1.5`

### F7 branch gate (Cursor verified · operator action)

| Surface | Finding |
|---------|---------|
| **PHONARA repo** | `git branch` = **`main`** · ahead 57 · **uncommitted WIP** · `gh` auth unavailable → protection **UNVERIFIED** |
| **Lovable canvas** | Agent cannot create branch/PR · operator must confirm canvas **not** writing unreviewed to protected `main` |

**FAIL =** operator cannot confirm Lovable target branch before D2 merge · route through `feat/L1-24-typography` (or equivalent) first

---

## EXECUTE Steps 0→5

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 580/580 |
| 1 | T24-1 `__root.tsx` link purge |
| 2 | T24-2 `styles.css` font vars + `@layer base` |
| 3 | T24-3 stake-typography.test.tsx |
| 4 | full vitest |
| 5 | §GREEN + **9b-TY manual** |

---

## §GREEN full block

```bash
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -i 'Sofia|Archivo Black' src/
rg -i 'Inter' src/styles.css src/routes/__root.tsx
rg -n 'fonts\.googleapis' src/
```

**PASS:** vitest **586/586** (+6 smoke) · Sofia/Archivo **0** · Inter **0** in styles+root · googleapis **0** · DIFF=**0** · root **16px** · visual home/casino/trade/wallet OK.

**§GREEN template:**

```text
L1-24 §GREEN — Stake-equivalent typography · system-ui+Pretendard(ko) · 5→1 webfont · vitest 586/586 · DIFF=0 · Sofia/Inter/Archivo 0 · googleapis 0 · root 16px · ZIP defer.
```

---

## 9b-TY manual (1440 + 390)

1. Network — webfont **≤1** Pretendard (jsdelivr) · Sofia/Inter/Archivo **0**
2. body **16px** · button **14/600** · KR=Pretendard · EN=system-ui
3. Wallet mint CTA · navy surface carry
4. Mobile **390** — root **16px** (no shrink)

**FAIL =** Sofia visible · googleapis font link · 14px mobile root

---

## Defer (pass 2 · L1-24b)

- Per-component `font-family` / arbitrary `text-[Npx]` purge
- `--text-meta-ko` 13px token if 12px tight in KR QA

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — operator 1번 GO |
| 2026-06-17 | **v0.2** — `__root.tsx` link purge · 4 font CSS vars · h3 scale · rg scope · 581 vitest |
| 2026-06-17 | **§GREEN** — 5→1 webfont · vitest **586/586** · Sofia/Inter/Archivo 0 · googleapis 0 · root 16px |
| 2026-06-17 | **Pass 1.1 APPROVE** — D2 test tighten + D3 parity · D1 `line-height` held · F7 branch gate documented |
| 2026-06-17 | **Pass 1.1 rev** — D3 fallback: `rg` key-count (no Node `require(.ts)`) · reviewer 3-point PASS criteria |
| 2026-06-17 | **Pass 1.1 §GREEN** — D2 +2 assertions in existing blocks · 586/586 · KO=2620 EN=2620 · D1 held |

---

*Lovable canvas only · §GREEN · next HEAD **L1-20** · parallel L1-16f non-blocking*
