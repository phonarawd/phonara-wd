# PHONARA · Lovable P2-Games · Operator 인계 (정본)

> **목적:** Cursor / Lovable AI가 **맥락 손실 없이** Lovable canvas 작업을 이어가기.  
> **갱신:** 2026-06-16 · L1-08 ✅ §GREEN · canvas catalog **1701** · **GATE ready**  
> **연결:** [`LOVABLE_AI_MASTER_PROMPT.md`](LOVABLE_AI_MASTER_PROMPT.md) · [`PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md`](PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md) · [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md) · [`CURRENT_STATUS.md`](CURRENT_STATUS.md) · [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md)

---

## 0. operator 워크플로 (고정)

**순차 실행:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) — **큐 head 1건만** · skip 금지 · §GREEN 후 다음.

**Lovable 매 작업:** [`LOVABLE_AI_MASTER_PROMPT.md`](LOVABLE_AI_MASTER_PROMPT.md) §1 끝판왕 블록 복붙 → LOCK → EXECUTE GO.

```text
Lovable 슬라이스: Plan → EXECUTE → §GREEN (반복)
ZIP 발행: operator가 Lovable 전체 100% 완료로 판단 + 「ZIP 발행 GO」 명시 시 1회
PHONARA paste: ZIP 수령 후 operator 「PHONARA paste GO Wave-1」 1회
중간 paste / 중간 ZIP / PHONARA repo UI = 금지
```

| 금지 | 허용 |
|------|------|
| P2-Games 10/10만으로 ZIP 자동 GO | defer·매크로·스포츠북 등 **operator 100% 판단 후** ZIP |
| Slice 중간 ZIP · Cursor paste | Lovable canvas 슬라이스 EXECUTE |
| GitHub clone **코드 copy/import** | Visual Reference Extraction (패턴만) |
| Lovable `packages/*` `supabase/*` engine touch | UI · i18n · `src/games/**` presentation |

---

## 1. Lovable canvas 스냅샷 (2026-06-16 실측)

### Phase 12 · 매크로

| 항목 | 상태 | 근거 |
|------|------|------|
| §B Home Bento (12-F.2) | **§GREEN** | `BentoCell` + HomeHub teasers |
| §Y FOMO Full Mount | **§GREEN** | `FomoFullSection` · fomo testid **8** (≥7) |
| 12-A Casino Hub | **§GREEN** | casino hub + 10 game routes |
| 12-G SEO scope B | **§GREEN** | 12-Z 실측 **54 routes** head 전수 |
| **§A Theme (12-H v0.1)** | **§GREEN** | styles.css hex 0 · oklch SOT · `html.dark` 고정 |
| **12-Z PRODUCT FINAL** | **§GREEN** | verify-only · checkpoints 3 · 12-G SEO **54 routes** |
| **12-C FOMO/tier v0.3** | **§GREEN** | catalog **1470** · testid 4/4 · F8 |
| **12-D Trade depth v0.2** | **§GREEN** | OrderBookDepthPanel · catalog **1478** · display-only label |
| catalog ko=en | **1502/1502** | L1-07 후 DIFF=0 (Δ=+10) |

### P2-Games Controls

| # | game | 상태 | vitest (보고) |
|---|------|------|---------------|
| 1–8 | Crash~Blackjack | **§GREEN** | wrapper-only 0 · named compose |
| 9 | Mint Reels | **§GREEN** | 8/10 · auto.wiring jsdom 2 = baseline |
| 10 | Gold Rush | **§GREEN** | 9/11 · auto.wiring jsdom 2 = baseline |

**재EXECUTE 사유 없음** — wrapper leak 0 일괄 확인.

### vitest (Lovable canvas · 마지막 보고)

| 구분 | 값 |
|------|-----|
| 전체 | **82 pass files / 2 fail** · **384 pass / 4 fail tests** |
| preview blackjack | **3/3 pass** · checkpoint `docs/checkpoints/preview-blackjack/` |
| SOFT baseline | gold-rush + mint-reels auto.wiring jsdom (MutationObserver) · NO-TOUCH |

**PHONARA repo:** paste 전 · `apps/web/src/components/games/*` = placeholder.

---

## 2. Lovable 다음 슬라이스 순서 (중복 방지)

> **정본 번호:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1

```text
L1-01 ~~12-Z~~ ✅ §GREEN
L1-02 ~~12-A v0.2~~ ✅ §GREEN
L1-03 ~~12-C tier~~ ✅ §GREEN
L1-04 ~~12-D Trade depth~~ ✅ §GREEN
L1-05 ~~Stage i18n~~ ✅ §GREEN
L1-06 ~~Pixi Plinko v2~~ ✅ §GREEN
L1-07 ~~Phase 7 viral~~ ✅ §GREEN
L1-08 Sportsbook UI  ✅ §GREEN (v0.2.1 · canvas 1701 · sports 66)
L1-09 ~~Phase 6 polish~~ ✅ §GREEN
L1-10 ~~Phase 10 carry~~ ✅ §GREEN
L1-11 ~~Phase 11 form/a11y~~ ✅ §GREEN
L1-12 ~~SEO leaf~~ ✅ §GREEN
L1-13a ~~Signup polish~~ ✅ §GREEN
L1-13a.1 ~~Signup CTA wiring~~ ✅ §GREEN
L1-13b ~~/tier guide route~~ ✅ §GREEN
L1-13b.1 ~~AccountSheet /tier CTA~~ ✅ §GREEN
L1-13c ~~PF verify~~ ✅ §GREEN
L1-13d ~~/account polish~~ ✅ §GREEN
L1-13e ~~settings Display~~ ✅ §GREEN
L1-13f ~~settings Notifications~~ ✅ §GREEN
L1-13g ~~settings Trade+Info~~ ✅ §GREEN  ← L1 settings 완료 · catalog 1644
GATE 「Lovable 100%」+ 「ZIP 발행 GO」  ← HEAD
```

**지금:** L1 active 큐 **소진** (L1-14 E defer) · operator **GATE** · 「Lovable 100%」→ ZIP GO → paste

---

## 3. 게임 UI 공통 패턴 (Crash v0.3 이후 정본)

### Product bar (매 슬라이스 §GREEN 필수)

| ID | gate |
|----|------|
| **P1** | `rg "XControlsShared\s*\{\.\.\.p" Controls.{mobile,desktop}` → **0** |
| **P2** | mobile: `min-h-14` + `fixed inset-x-0 bottom-0` |
| **P3** | desktop: `rounded-2xl border p-4 lg:sticky lg:top-4` |
| — | `fireDelayMs` **미주입** (320ms default) · countdown **Crash만** |
| — | Controls JSX **[가-힣] 0** · `casino-prepare-hash` reachable |

### Auto-bet

| 게임 | fireDelayMs | countdown |
|------|-------------|-----------|
| **Crash** | **5000** | `casino-autobet-countdown` |
| **나머지 9** | 320 (default) | 없음 |

---

## 4. §A Theme (12-H v0.1) — §GREEN 요약

- `src/styles.css` skin/bet 13 hex → oklch · hex leak **0**
- `__root.tsx` `theme-color` **#171221** (meta browser compat 예외 1건)
- `<html className="dark">` 기존 유지 · toggle **defer**
- checkpoints: `docs/checkpoints/theme-h/`

---

## 5. defer (Lovable · ZIP 전)

| 항목 | 상태 |
|------|------|
| TournamentStrip · RecentlyPlayed | **§GREEN** (2026-06-16) |
| 12-C FOMO/tier v0.3 | **§GREEN** (2026-06-16) |
| 12-D Trade depth v0.2 | **§GREEN** (2026-06-16) · catalog **1478** |
| Stage per-game i18n | **§GREEN** (2026-06-16) · 14 keys · catalog **1492** |
| Pixi Plinko v2 | **§GREEN** (2026-06-16) · Pixi · catalog **1492** |
| Phase 7 viral v0.1 | **§GREEN** (2026-06-16) · catalog **1502** |
| Sportsbook `/sports` UI mock | **DEFER** · L1-08 (스포츠 GO/API 후 재개) |
| Phase 6 polish | **§GREEN** (2026-06-16) · catalog **1502** |
| Phase 10 carry | **§GREEN** (2026-06-16) · catalog **1512** (Δ=+10) |
| Phase 11 form/a11y | **§GREEN** (2026-06-16) · catalog **1512** (Δ=0) |
| Phase 12 SEO leaf | **§GREEN** (2026-06-16) · JSON-LD 38 · og 24 · catalog **1521** Δ=0 |
| Signup `/signup` | **✅ §GREEN** (L1-13a + L1-13a.1) |
| Tier guide `/tier` | **✅ §GREEN** · 진입: Home TierProgressPanel + **AccountSheet** + URL |
| PF verify `/casino/fairness` | **✅ §GREEN** (L1-13c) · casino.fairness 20 |
| ZIP GO (audit) | **NO** · operator GATE |
| Engine Wave 1–3 | Cursor · paste 후 |
| E2E G9 | Cursor · paste 후 |

---

## 6. paste 이후 Cursor (지금 0)

| 순서 | 작업 |
|------|------|
| 1 | Lovable ZIP → presentation-import / `components/games/*` |
| 2 | `@phonara/i18n` merge · og:image 절대 URL |
| 3 | E2E G9 wire |
| 4–6 | Engine Wave 1–3 |

---

## 7. 문서 정본 (중복 방지)

| 읽을 것 | 무시 |
|---------|------|
| **본 파일** — P2-Games + Lovable canvas 진행 | archive/ 옛 LOCK EXECUTE |
| [`LOVABLE_ZENITH_INDEX.md`](LOVABLE_ZENITH_INDEX.md) — 목차 | `docs/` legacy 9개 = archive 복본 |
| [`CURRENT_STATUS.md`](CURRENT_STATUS.md) — PHONARA 엔진 대시보드 | catalog **1165** 구 단위 (canvas **1454**) |
| [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) — Lovable vs 엔진 | |

---

## 8. 새 채팅 첫 메시지 (복붙)

```text
PHONARA Lovable 인계 이어하기.

정본: docs/LOVABLE_AI_MASTER_PROMPT.md §1 복붙 · docs/PHONARA_LOVABLE_P2_GAMES_HANDOFF.md
12-Z §GREEN · 다음: 12-A v0.2 TournamentStrip (LOVABLE_ZENITH_PHASE12_A_V02_LOCK.md)
ZIP/paste: operator 100% + 명시 GO 전까지 0

역할: Plan 검토 → APPROVE/REVISE + GO. engine/packages/supabase 0-touch.
```

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — P2 8/10 · Crash v0.3/v0.4 |
| 2026-06-16 | v15 — L1-13c §GREEN · GATE · catalog 1613 |
| 2026-06-16 | v13 — L1-13a.1 §GREEN · L1-13b `/tier` HEAD · catalog 1541 |
| 2026-06-16 | v12 — L1-13a.1 shell CTA HEAD · catalog 1536 |
| 2026-06-16 | v11 — L1-12 SEO §GREEN · L1-13a Signup HEAD · catalog 1521 |
| 2026-06-16 | v10 — L1-11 §GREEN · L1-12 SEO HEAD |
| 2026-06-16 | v9 — L1-10 §GREEN · L1-11 form/a11y HEAD · catalog 1512 |
| 2026-06-16 | v8 — L1-09 §GREEN · L1-10 carry HEAD |
| 2026-06-16 | v7 — operator L1-08 defer · L1-09 polish HEAD |
| 2026-06-16 | v6 — L1-07 §GREEN · catalog 1502 · L1-08 Sportsbook HEAD |
| 2026-06-16 | v5 — L1-06 §GREEN · L1-07 viral HEAD |
| 2026-06-16 | v4 — L1-05 §GREEN · catalog 1492 · L1-06 Plinko HEAD |
| 2026-06-16 | v3 — L1-04 §GREEN · catalog 1478 · L1-05 Stage i18n HEAD |
| 2026-06-16 | v2 — P2 10/10 · Mint/Gold §GREEN · §A §GREEN · 12-Z §GREEN · TournamentStrip next |

---

*operator 정본 · Lovable canvas / Cursor 검토 공용*
