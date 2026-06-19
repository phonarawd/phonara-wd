# Lovable Zenith — 새 채팅 지존급 인계 (복붙용 · 2026-06-15 · v68)

> **아래 `---BEGIN---` ~ `---END---` 전체를 Lovable 새 채팅 첫 메시지에 붙여넣기.**  
> **정본 SOT:** [`LOVABLE_ZENITH_PHASE12_B_LOCK.md`](LOVABLE_ZENITH_PHASE12_B_LOCK.md) · 12-E [`LOVABLE_ZENITH_PHASE12_E_LOCK.md`](LOVABLE_ZENITH_PHASE12_E_LOCK.md)

---BEGIN---

# PHONARA Lovable Zenith — 인계 v68 · 12-B EXECUTE GO (분기 A1)

---

## 0. AI 상태 머신 (필독 · 대기 가능)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  워크스페이스: LOVABLE CANVAS (여기서만 코드 변경)                              │
│  PHONARA Cursor repo = docs/handoff only · paste = 12-Z FINAL 후 1회         │
├─────────────────────────────────────────────────────────────────────────────┤
│  12-E ✅ §GREEN · NO-TOUCH (referral/partner 파일 diff 금지)                  │
│  12-B ⏳ EXECUTE GO 수령 · LOCK v0.3.1 baked · 분기 A1                        │
│  §GREEN 미완료 → 12-C/A/D EXECUTE 금지                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

| 모드 | 조건 | AI 행동 |
|------|------|---------|
| **STANDBY** | operator 「대기」「기다려」「GO 전」 | 코드 변경 **0** · 이 인계문 숙지 · 질문만 답변 · Step 0 pre-flight **읽기만** |
| **EXECUTE** | operator 「EXECUTE GO」「Step 0부터」「진행」 | Step 0→10 순서 실행 · RED 즉시 STOP + REVISE 보고 |
| **GREEN** | Step 8 gates 전부 OK | §GREEN G-B1~G-B14 보고 · ZIP Step 9 · Step 10 = 12-C LOCK DRAFT **텍스트만** |

**지금 기본 가정:** operator가 **12-B EXECUTE GO (분기 A1)** 를 이미 내렸음.  
새 채팅 첫 응답 = **「12-B EXECUTE 수령 · Step 0 pre-flight 착수할까요?」** 1줄 ACK 후, operator 추가 지시 없으면 **Step 0부터 자동 진행**.

**절대 금지:** 12-E 재작업 · 12-C/A/D 코드 · engine/RPC/Supabase · PHONARA paste.

---

## 1. 한 줄 맥락 (초등학생 버전)

- **미션 화면**(`/earn/missions`)에 할 일 카드를 **6종류로 꽉 채우는** 작업 중.
- **A/B 카드 6개**는 그대로 두고, **C~F 카드**를 preview 1개 → **풀 세트**로 늘림.
- 위·아래 **꾸밈(히어로·푸터)** 추가 · **돈/서버 연결은 아직 안 함** (12-Z 후 paste).
- **12-E(총판/추천)** 화면은 **손대지 않음**.

---

## 2. baseline 실측 (12-E §GREEN · NO-TOUCH)

```text
catalog ko=en=1099 · DIFF=0 · DUP=0
vitest 356/356 · red-grep OK
sitemap <url> = 42 · JSON-LD routes = 8
ZIP user 104323 B · admin 53109 B
E1 /referral carry Δ=0 + BreadcrumbList
E2 /partner gated · noindex · nav 숨김 · mock gate (?partner=0/1)
referral.partner.* +24 · ReferralTree reuse
```

**12-E NO-TOUCH 파일 (diff = 0 필수):**
`src/routes/referral*` · `src/routes/partner*` · `Partner*` · `ImportedReferralPage` carry

---

## 3. Phase 12 매크로 · 지금 위치

| ID | 상태 | World Crush |
|----|------|-------------|
| 12-E | ✅ GREEN | Stake agent · E1+E2 |
| **12-B** | **⏳ EXECUTE GO · §GREEN 대기** | Rollbit/앱테크 · 6-lane full · FOMO hero |
| 12-C | pending (Step 10 DRAFT only) | Home 첫 3초 FOMO |
| 12-A | pending | Games |
| 12-D | pending | Trade |
| 12-Z | pending | paste OK |

**operator ROI 순서:** ~~12-E~~ → **12-B** → 12-C → 12-A → 12-D → 12-Z

---

## 4. 12-B Scope (한 줄)

`/earn/missions` — C~F **full mock rows (route)** · Checklist **lane subtitle render only** · `MissionProgressHero` · `Phase12MissionsFooter` · head/meta/canonical/JSON-LD **Δ=0** · engine=0.

**World Crush bar:** Rollbit season + TikTok Lite — 6-lane full · viral · FOMO progress hero.

---

## 5. 분기 A1 (operator 확정 · 유일 정본)

| | A1 ✅ | A2/B defer → LOCK v0.4 |
|---|------|-------------------------|
| row 데이터 | `src/routes/earn.missions.tsx` `const missions: MissionItem[]` | Checklist 내부로 이전 |
| mount | `<MissionChecklist items={missions} />` **required 유지** | `items?` optional |
| Checklist | **lane subtitle 렌더만** · Props/interface/onClaim/LANE_ORDER/items **Δ=0** | interface 변경 |

**Step 0 RED 조건:** `missions[]` 또는 `items={missions}` 없음 → **STOP** · LOCK v0.4 분리 보고.

---

## 6. Row id pin (R-B17a · FAIL=RED)

**형식:** `{lane}-{camelCaseSuffix}` · lane 접두 **hyphen 1개만** · suffix camelCase (추가 hyphen/underscore/공백 금지)

| 레인 | id (총) |
|------|---------|
| **A daily** (기존 2) | `daily-todaySpin` · `daily-streak7` |
| **B growth** (기존 4) | `growth-completeProfile` · `growth-firstGame` · `growth-firstDeposit` · `growth-kyc` |
| **C viral** (4) | `viral-invite1` · `viral-invite3` · `viral-inviteFirstPaid` · `viral-partnerHubVisit` |
| **D weekly** (4) | `weekly-play5` · `weekly-win3` · `weekly-spinDaily` · `weekly-depositOnce` |
| **E tier** (3) | `tier-reachSilver` · `tier-reachGold` · `tier-fomoStreak` |
| **F social** (3) | `social-followX` · `social-joinTelegram` · `social-shareWin` |

**총 20 rows** (A/B 6 + C~F 14).

**`/partner` href:** `viral-partnerHubVisit` row CTA **단 1건** · shell/home/earn.index/fomo = **0**.

---

## 7. 금지 (FAIL = RED)

- `mission.ad.*` · `mission.survey.*` · offer wall · rewarded video
- `WorldCrushBar.tsx` **생성 금지** (대신 `MissionProgressHero.tsx`)
- engine: `@supabase` · `rpc_*` · `localStorage` · `Math|toFixed|reduce` (money 재계산)
- `howler` · `emoji` · `app_install` · `bet.result.grid`
- Footer/i18n 금지문: `LOCK|mock policy|PHONARA|operator|dev-only`
- Checklist contract 변경 (Step 4/7 8-b rg)
- `earn.missions.tsx` head/meta/canonical/JSON-LD diff
- `earn.index.tsx` diff (R-B13)
- 12-E 파일 diff

---

## 8. EXECUTE 0→10 (최종 플랜 · ZIP = Step 9 only)

### Step 0 — Pre-flight
- `earn.missions.tsx`: `const missions: MissionItem[]` + `<MissionChecklist items={missions} />`
- `MissionChecklist.tsx` contract baseline (Props · interface · onClaim · MissionLane · LANE_ORDER · items)
- `WorldCrushBar.tsx` 부재
- `mission.tab.*` i18n 충돌 rg (R-B14)
- 12-E referral/partner baseline 해시

### Step 1 — i18n (en/ko) · catalog 1099→~1127
- `mission.footer.note` · `mission.footer.learnMore` (각 2파일)
- `mission.lane.subtitle.{daily|growth|viral|weekly|tier|social}` ×6
- C~F full row용 `mission.*` 키 (~28 net)
- Footer #18 금지문 0

### Step 2 — `Phase12MissionsFooter.tsx`
- `mission.footer.note` + `learnMore` only · 단독 rg hit=0

### Step 3 — `MissionProgressHero.tsx`
- mount-only · mock progress/FOMO display · A/B 6 id 비파괴

### Step 4 — `MissionChecklist.tsx`
- **허용:** `LANE_ORDER.map` 내부 `mission.lane.subtitle.*` 렌더만
- **금지:** row 데이터 · Props/interface/items/onClaim/LANE_ORDER 변경

### Step 5 — `earn.missions.tsx`
- C +4 · D +4 · E +3 · F +3 rows
- body = `<MissionProgressHero />` + `<MissionChecklist items={missions} />` + `<Phase12MissionsFooter />`
- A/B 6 id 보존 · head Δ=0

### Step 6 — `earn.index.tsx` Δ=0

### Step 7 — Self-check 8-a / 8-b
- 8-a: A/B 6 · head Δ=0 · engine 금지 0 · partner nav · R-B17a
- 8-b: **R-B17b** Checklist contract rg **Step 4와 동일 반복** · isolation stat · sitemap 42 · JSON-LD 8

### Step 8 — `bash scripts/red-grep.sh` full · app_install=0

### Step 9 — ZIP + §GREEN G-B1~G-B14

### Step 10 — 12-C Home Hub LOCK DRAFT **텍스트만** · 코드 0

---

## 9. Self-check 명령 (복붙 실행)

```bash
# R-B17b / G-B1 — Checklist contract (Step 4 + 8-b 반복)
git diff src/components/earn/MissionChecklist.tsx \
  | rg "^[+-].*(onClaim|MissionLane|LANE_ORDER|Props|interface\s+MissionChecklist|items\??:\s*MissionItem)" \
  && echo FAIL || echo OK

# head Δ=0
git diff src/routes/earn.missions.tsx \
  | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" && echo FAIL || echo OK

# A/B 6 id 보존
rg -n "daily-todaySpin|daily-streak7|growth-completeProfile|growth-firstGame|growth-firstDeposit|growth-kyc" \
  src/routes/earn.missions.tsx | wc -l   # ≥ 6

# partner nav leak
rg -n '"/partner"' src/components/shell/ src/routes/home.tsx src/routes/earn.index.tsx src/components/fomo/   # 0
rg -n '"/partner"' src/routes/earn.missions.tsx | wc -l   # 1

# R-B17a id naming (single + double quote)
rg -oN "id:\s*['\"][^'\"]+['\"]" src/routes/earn.missions.tsx \
  | rg -v "id: ['\"](daily|growth|viral|weekly|tier|social)-[a-z][a-zA-Z0-9]*['\"]" \
  && echo FAIL || echo OK

# Footer #18
rg -ni "LOCK|mock policy|PHONARA|operator|dev[- ]?only" src/components/earn/Phase12MissionsFooter.tsx   # 0
rg -c "mission\.footer\.note" src/i18n/en.ts src/i18n/ko.ts    # = 2
rg -c "mission\.footer\.learnMore" src/i18n/en.ts src/i18n/ko.ts   # = 2

# gates
bash scripts/red-grep.sh
bunx vitest run
bash scripts/i18n-parity.sh   # KO=EN=~1127 DIFF=0 DUP=0

# isolation
git diff --stat src/games/   # 0
git diff --stat src/components/referral/ src/routes/partner.tsx src/routes/referral.tsx   # 0
git diff --stat src/routes/earn.index.tsx   # 0
rg -n "vite-plugin-pwa" package.json   # 0
rg -l "addEventListener\s*\(\s*['\"]beforeinstallprompt|addEventListener\s*\(\s*['\"]appinstalled" src/   # InstallPromptProvider.tsx 1
rg -c "<url>" public/sitemap.xml   # 42
rg -l "application/ld\+json" src/routes/ | wc -l   # 8
```

---

## 10. §GREEN 보고 템플릿 (G-B1~G-B14)

```text
Phase 12-B GREEN (A1 · /earn/missions 6-lane full · catalog 1099→N · DIFF=0 · DUP=0)
G-B1  Checklist contract OK (R-B17b 8-b 반복)
G-B2  A/B 6 id route ≥6
G-B3  earn.missions head Δ=0 · C~F full rows · items={missions}
G-B4  earn.index Δ=0
G-B5  catalog 1099→N (target ~1127)
G-B6  sitemap 42 · JSON-LD 8
G-B7  red-grep ALL OK · app_install=0
G-B8  footer R-B15/R-B16 (note=2 · learnMore=2 · 금지문 0)
G-B9  partner nav leak 0 · route /partner CTA 1
G-B10 MissionProgressHero · WorldCrushBar 부재
G-B11 12-E isolation Δ=0
G-B12 games Δ=0 · vite-plugin-pwa=0 · addEventListener 1 file
G-B13 vitest N/N · ZIP user KB · admin KB
G-B14 R-B17a id naming rg OK
NEXT: 12-C Home Hub LOCK DRAFT (EXECUTE 금지)
PHONARA handoff v68 bake 대기
```

---

## 11. FAIL = RED 즉시 STOP

- Step 0 pre-flight 불일치 (A1 조건 미충족)
- Step 4 / Step 7 8-b Checklist contract rg ≥1 hit
- Step 5 R-B17a id naming FAIL
- Step 8 red-grep 임의 hit
- 12-E 파일 diff ≠ 0
- operator 「STOP」「REVISE」

**RED 시:** 구현 중단 · 원인 1줄 · REVISE 제안 · operator 확인 대기.

---

## 12. Defer (불변)

- **12-A** Games · **12-C** Home Hub · **12-D** Trade · **12-F** admin
- **12-E** NO-TOUCH · **engine wire** / `rpc_mission_*` / payout → **12-Z 후 paste 1회**
- **분기 A2/B** (row Checklist 이전 · items optional) → LOCK v0.4 별도
- Pixi 2.5 · tier §E v35 (12-C) · Phase 13 carry KR

---

## 13. North Star §10 미션 taxonomy (참고)

6레인: A daily · B growth · C viral · D weekly · E tier · F social  
`mission.tab.*` · 행 필드: id · titleKey · descKey · rewardDisplay(string) · progress · status  
**금지 카테고리:** ad watch · survey · offer wall — **행 자체 없음**

---

## 14. PHONARA parallel (AI 인지용 · Lovable에서 수정 금지)

- Operator는 **PHONARA Cursor**에서 LOCK/docs만 bake 중 (코드 0).
- Lovable §GREEN 수치를 operator가 검증 후 PHONARA `CURRENT_STATUS` / handoff v68 갱신.
- **paste는 12-Z FINAL GREEN 후 1회.**

---

## 15. 첫 응답 템플릿 (AI)

```
12-B EXECUTE GO (분기 A1 · LOCK v0.3.1) 수령 · 12-E NO-TOUCH 확인.
baseline catalog 1099 · target ~1127 · §GREEN 전 12-C/A/D 금지.
Step 0 pre-flight 착수합니다. (operator 「대기」 시 코드 변경 0)
```

---

*handoff v68 · 12-E GREEN baked · 12-B EXECUTE GO A1 · STANDBY/EXECUTE/GREEN 상태 머신 · 2026-06-15*

---END---
