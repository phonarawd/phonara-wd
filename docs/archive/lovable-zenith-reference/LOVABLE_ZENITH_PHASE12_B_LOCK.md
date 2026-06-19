# Phase 12-B Missions 6-Lane Full — LOCK v0.3.1 (A1) + EXECUTE 0→10 v2.2 (정본)

> **SOT:** [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md) (12-E NO-TOUCH)  
> **상태:** LOCK v0.3.1 **분기 A1** · EXECUTE v2.2 **§GREEN** (2026-06-15) · NEXT **12-D / 12-C v0.3**  
> **Pre-flight:** row = `earn.missions.tsx` · `items={missions}` · Checklist contract Δ=0

---

## Scope (한 줄)

`/earn/missions` — C~F **full rows (route)** · lane subtitle (Checklist render only) · `MissionProgressHero` · footer · head Δ=0 · engine=0.

**12-B World Crush:** Rollbit season + TikTok Lite — **6-lane full rows · viral · FOMO progress hero**.

---

## 아키텍처 분기 (operator 확정 · A1)

| 분기 | 선택 | 이유 |
|------|------|------|
| **A1** | ✅ **본 슬라이스** | row = route · Checklist contract Δ=0 · EXECUTE 즉시 가능 |
| A2 | defer | row 컴ponent 이전 → LOCK v0.4 별도 |
| B | defer | `items?` Props amend → LOCK v0.4 |

### Track (A1)

| Track | 파일 | 변경 |
|-------|------|------|
| A | `MissionProgressHero.tsx` | 신규 |
| B rows | `earn.missions.tsx` | C~F row 확장 · hero/footer mount · `items={missions}` **유지** |
| B render | `MissionChecklist.tsx` | **lane subtitle 렌더만** · Props/interface/items/onClaim/LANE Δ=0 |
| C | `Phase12MissionsFooter.tsx` | 신규 |
| D | i18n ~28 | 1099→~1127 |
| E | red-grep +2 | ad · survey |

**FAIL:** Checklist `items?` · interface diff · mount-only Step 5 (v0.3 구문 — A1에서 **폐기**).

---

## LOCK Footer (#1–#25 · A1 amend)

1–15, 18–25 — v0.3 동일.

**#16 A1:** A/B 6 id `earn.missions.tsx` 내 hit ≥ 6.

**#17 A1:** `git diff MissionChecklist.tsx | rg onClaim|MissionLane|LANE_ORDER|Props|interface MissionChecklist|items?: MissionItem` = **0줄**. 허용: lane subtitle ±N LOC.

**#19 A1:** `/partner` route 내 **1행** (`viral-partnerHubVisit` CTA) · shell/home/earn.index/fomo = 0.

### R-B17a — row id naming (FAIL = RED)

- 형식: `{lane}-{camelCaseSuffix}` · lane 접두 1 hyphen만 · suffix 공백/추가 hyphen/underscore 금지
- Pin: A/B 6 + C~F 신규 (v2.2 id 목록)

```bash
rg -oN "id:\s*['\"][^'\"]+['\"]" src/routes/earn.missions.tsx \
  | rg -v "id: ['\"](daily|growth|viral|weekly|tier|social)-[a-z][a-zA-Z0-9]*['\"]" && echo FAIL || echo OK
```

### R-B17b — 8-b Checklist contract rg (FAIL = RED)

Step 4와 **동일** rg를 8-b에 **반복** (§GREEN G-B1).

---

## Footer #18 (R-B15/R-B16)

```bash
rg -ni "LOCK|mock policy|PHONARA|operator|dev[- ]?only" src/components/earn/Phase12MissionsFooter.tsx   # 0
rg -ni "LOCK|mock policy|PHONARA|operator|dev[- ]?only" src/i18n/en.ts src/i18n/ko.ts | rg "mission\.footer\."   # 0
rg -c "mission\.footer\.note" src/i18n/en.ts src/i18n/ko.ts    # = 2
rg -c "mission\.footer\.learnMore" src/i18n/en.ts src/i18n/ko.ts   # = 2
```

---

## EXECUTE 0→10 — 최종 플랜 (A1 · ZIP = Step 9 only)

### Step 0 — Pre-flight (RED → 즉시 중단)

- `src/routes/earn.missions.tsx`: `const missions: MissionItem[]` · `<MissionChecklist items={missions} />` → **A1 충족** · 미충족 = LOCK v0.4 보고
- `MissionChecklist.tsx` contract baseline 해시 (Props · interface · onClaim · MissionLane · LANE_ORDER · items)
- `WorldCrushBar.tsx` 부재 (R-B5)
- `mission.tab.*` i18n 충돌 rg (R-B14)
- 12-E NO-TOUCH: `referral*` · `partner*` baseline 해시

### Step 1 — i18n (en/ko)

- `mission.footer.note` · `mission.footer.learnMore` ×2 each
- `mission.lane.subtitle.{daily|growth|viral|weekly|tier|social}` (Step 4)
- Footer #18 금지문자열 0

### Step 2 — `Phase12MissionsFooter.tsx` (Footer #18)

- `mission.footer.note` + `learnMore` only
- 금지: `Math|toFixed|reduce|localStorage|@supabase|rpc_*|howler|emoji|app_install|ad |survey|bet.result.grid`
- 단독 rg hit=0 (R-B12 pipe 제거 정본)

### Step 3 — `MissionProgressHero.tsx`

- mount-only · 금지 동일 · A/B 6 id 비파괴 · WorldCrushBar 금지

### Step 4 — `MissionChecklist.tsx` (contract Δ=0)

- 허용: `LANE_ORDER.map` 내부 `mission.lane.subtitle.*` 렌더만
- row 데이터 0줄 (Step 5 route)

### Step 5 — `earn.missions.tsx` (A1 route-rows)

- C viral +4 · D weekly +4 · E tier +3 · F social +3 · id `{lane}-{camelCase}` (R-B17a)
- body: Hero + Checklist `items={missions}` + Footer
- A/B 6 id 보존 · `/partner` href = `viral-partnerHubVisit` 1건 · head Δ=0

### Step 6 — `earn.index.tsx` Δ=0 (R-B13)

### Step 7 — Self-check 8-a / 8-b

- 8-a: A/B 6 · head Δ=0 · engine 금지 0 · WorldCrushBar 부재 · partner nav 0 · R-B17a rg
- 8-b: R-B17b Checklist contract rg **반복** · games/referral/partner/earn.index Δ=0 · sitemap 42 · JSON-LD 8 · vite-plugin-pwa 0 · addEventListener 1 file

### Step 8 — `red-grep.sh` full (Footer #25 · app_install=0)

### Step 9 — ZIP + §GREEN G-B1~G-B14

### Step 10 — 12-C Home Hub LOCK DRAFT only (코드 0)

### FAIL = RED 즉시 중단

- Step 0 pre-flight 불일치 · Step 4 contract hit ≥1 · Step 5 R-B17a FAIL · Step 7 8-b hit ≥1 · Step 8 red-grep hit · 12-E diff ≠0

### Step 5/7/8-b 핵심 self-check

```bash
git diff src/components/earn/MissionChecklist.tsx | rg "^[+-].*(onClaim|MissionLane|LANE_ORDER|Props|interface\s+MissionChecklist|items\??:\s*MissionItem)" && echo FAIL || echo OK
git diff src/routes/earn.missions.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" && echo FAIL || echo OK
rg -n '"/partner"' src/components/shell/ src/routes/home.tsx src/routes/earn.index.tsx src/components/fomo/   # 0
rg -n '"/partner"' src/routes/earn.missions.tsx | wc -l   # 1
rg -oN "id:\s*['\"][^'\"]+['\"]" src/routes/earn.missions.tsx | rg -v "id: ['\"](daily|growth|viral|weekly|tier|social)-[a-z][a-zA-Z0-9]*['\"]" && echo FAIL || echo OK
bash scripts/red-grep.sh   # ALL OK · app_install=0
```

---

## §GREEN template (G-B1~G-B14)

- G-B1 Checklist contract OK (R-B17b 8-b)
- G-B2 A/B 6 id route ≥6
- G-B3 earn.missions head Δ=0 · C~F rows · A1
- G-B4 earn.index Δ=0
- G-B5 catalog 1099→N
- G-B6 sitemap 42 · JSON-LD 8
- G-B7 red-grep ALL · app_install=0
- G-B8 footer R-B15/R-B16
- G-B9 partner nav 0 · route CTA 1
- G-B10 MissionProgressHero · no WorldCrushBar
- G-B11 12-E Δ=0
- G-B12 games · vite-plugin-pwa · addEventListener 1파일
- G-B13 vitest · ZIP KB
- **G-B14** R-B17a id naming rg OK

---

## Defer

- **LOCK v0.4 (A2/B):** row → Checklist internal · mount-only · paste 전 refactor optional
- 12-A Games · 12-C Home · 12-D Trade · 12-E NO-TOUCH · engine 12-Z

---

## §GREEN (operator 실측 · 2026-06-15 · EXECUTE v2.2 · A1)

```text
Phase 12-B GREEN (분기 A1 · /earn/missions 6-lane full · catalog 1099→~1127)
G-B1  Checklist contract Δ=0 (R-B17b) OK
G-B2  A/B 6 baseline ids OK (6/6)
G-B3  head/meta/canonical Δ=0 OK
G-B4  C+4 D+4 E+3 F+3 OK (viral 1→5 · weekly 1→5 · tier 1→4 · social 1→4)
G-B5  R-B17a id {lane}-{camelCase} OK
G-B6  Hero/Footer banned tokens=0 OK
G-B7  Footer #18 app_install=0 OK
G-B8  mission.footer.note=2 · learnMore=2 (en+ko) OK
G-B9  WorldCrushBar absent OK
G-B10 earn.index.tsx Δ=0 OK
G-B11 12-E referral/partner Δ=0 OK
G-B12 partner nav leak 0 OK
G-B13 mount Hero + Checklist + Footer OK
EXECUTE 0→9 완료 · ZIP/CHANGELOG operator 신호 시 · Step 10 defer
NEXT: 12-C Home Hub LOCK DRAFT
PHONARA handoff v69 baked
```

---

*v0.3.1 A1 · EXECUTE v2.2 §GREEN · R-B17a/b · 2026-06-15*
