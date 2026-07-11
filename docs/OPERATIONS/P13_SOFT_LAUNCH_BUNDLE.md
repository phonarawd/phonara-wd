# P13 Soft Launch Bundle Checklist (§20.5 · §20.14.5)

> **상태:** Active OPS/QA canon · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `p13-soft-launch-bundle` (#233)  
> **선행:** `p13-ops-prod-preflight` (#232) **`[x]`**  
> **후행:** `da-w7-enforcement-strict-tokens` (#234) **`[x]`** · `da-w7-operator-visual-dae-signoff` (#235) · T1 ramp `launch-ramp-t1-feature-gates` (#237)  
> **코드 계약:** [`p13-soft-launch-display-contract.ts`](../../apps/web/src/domain/p13-soft-launch-display-contract.ts)  
> **CB 매트릭스:** [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md)  
> **엔진 경계:** migration · `packages/*-engine` **코드 diff 0** (non-waivable)

본 문서는 Soft Launch **UI/QA + Closed Beta 준비** 정본이다.  
실돈 입출금 리허설·MFA enroll은 T0-A §3.1 **DEFER**와 독립 — operator 재개 전까지 prod money **금지**.

---

## 1. 30초 요약

| 항목 | Soft Launch 의미 | 판정 |
| ---- | ---------------- | ---- |
| ko/en QA | `check:i18n` · EN에 한글 0 | agent gate |
| multi-viewport · axe 0 | 390/768/1024 · critical 0 | vitest + axe-core |
| CB-01~06 | matrix `ready` · cap/OI/lev 숫자 pin | contract + operator |
| Admin 초등어 | §29.5 금지어 product surface 0 | spot-check |
| Exception dry-run | `/queues`·입출금 · owner path | operator |
| Team viewer negative | viewer ≠ `/team`·`/withdrawals` | vitest pin |
| PWA | `/install` · `/offline` · `check:pwa` | agent + 실기기 |
| 코드 diff 0 | migration 0 | PR |

---

## 2. 체크리스트 (9섹션)

### 2.1 ko / en QA

| # | 확인 | 완료 |
| - | ---- | ---- |
| L1 | `bun run check:i18n` green | [ ] |
| L2 | EN 모드에 한글(Hangul) UI 잔존 0 | [ ] |
| L3 | Admin nav 초등어 ko pin (`처리 대기함` · `시스템 상태`) | [ ] |

### 2.2 multi-viewport · axe 0

| Viewport | 필수 |
| -------- | ---- |
| 390 | mobile |
| 768 | tablet (`md:`) |
| 1024 | desktop (`lg:`) |

Smoke routes: `/home` · `/wallet` · `/trade` · `/sports` · `/casino` · `/install` · `/offline` · `/legal/terms` · `/tier/me`

| # | 확인 | 완료 |
| - | ---- | ---- |
| V1 | 3-tier viewport smoke (vitest) | [ ] |
| V2 | axe **critical 0** on Soft Launch owners | [ ] |
| V3 | dead control 0 (기존 Part VISUAL companions) | [ ] |

### 2.3 Closed Beta CB-01~06 (§20.14.5)

| ID | Domain | Cap / 정책 |
| -- | ------ | ---------- |
| CB-01 | deposit | KRW **50만** / USDT **100** |
| CB-02 | withdrawal | 동일 cap · claim idempotent |
| CB-03 | casino | small stake · Σ=0 |
| CB-04 | sportsbook | exposure within cap |
| CB-05 | price_feed | stale → ops alert |
| CB-06 | reconciliation | match · no prod tamper |

| 항목 | 목표 |
| ---- | ---- |
| max leverage | **5** |
| OI utilization | **50%** |
| insurance | OI × **20%** USDT |

| # | 확인 | 완료 |
| - | ---- | ---- |
| B1 | matrix CB-01~06 `status=ready` | [ ] |
| B2 | T0-A에 CB lev 5 · OI 50% 적용됨 | [ ] |
| B3 | 실돈 리허설 = operator 「Closed Beta gate 실행」만 (DEFER OK) | [ ] |

### 2.4 Admin 초등어 spot-check (§29.5)

| # | 확인 | 완료 |
| - | ---- | ---- |
| A1 | product surfaces에 금지어 하드코딩 0 (`queue`·`desk`·`rpc_` …) | [ ] |
| A2 | nav 라벨 = i18n 초등어 (영문 jargon 메뉴 0) | [ ] |

### 2.5 Admin exception dry-run

Owner 계정으로:

1. `/admin/queues` — 대기함 열림  
2. `/admin/deposits` — 입금 확인 행 조회 (승인 없이 dry-run OK)  
3. `/admin/withdrawals` — 출금 보내기 목록 (실전송 금지 if withdrawal OFF)  
4. `/admin/ops` — 시스템 상태 · 알림

| # | 확인 | 완료 |
| - | ---- | ---- |
| E1 | 4 desk 접근 가능 (owner) | [ ] |
| E2 | 고위험 액션 reason+confirm UX 존재 | [ ] |

### 2.6 Team viewer negative

| Role | 허용 | 금지 |
| ---- | ---- | ---- |
| viewer | `/` · `/ops` | `/team` · `/withdrawals` · `/deposits` · `/queues` · `/settings` |

| # | 확인 | 완료 |
| - | ---- | ---- |
| T1 | viewer allowlist pin vitest green | [ ] |
| T2 | `/admin/team` = owner-only | [ ] |

### 2.7 PWA install QA (§25.10)

```powershell
bun run check:pwa
```

| # | 확인 | 완료 |
| - | ---- | ---- |
| P1 | `check:pwa` exit 0 | [ ] |
| P2 | `/install` CTA · `/offline` 동작 | [ ] |
| P3 | (실기기) iOS/Android 홈 추가 스크린샷 — operator | [ ] |

### 2.8 Growth path smoke

경로: signup → referral → mission claim → wallet refresh · Decay warning `/tier/me`

| # | 확인 | 완료 |
| - | ---- | ---- |
| G1 | route/surface 존재 (agent contract) | [ ] |
| G2 | money E2E Σ=0 = CI / operator (G13) | [ ] |

### 2.9 코드 diff 0

| # | 확인 | 완료 |
| - | ---- | ---- |
| D1 | 본 todo PR에 `supabase/migrations/**` 변경 **0** | [ ] |
| D2 | `packages/*-engine` 변경 **0** | [ ] |

---

## 3. Agent Implemented evidence (2026-07-11)

| 산출 | 경로 |
| ---- | ---- |
| Display contract | `apps/web/src/domain/p13-soft-launch-display-contract.ts` |
| Contract tests | `apps/web/src/domain/__tests__/p13-soft-launch-display-contract.test.ts` |
| QA surface (viewport·axe·ko/en) | `apps/web/src/product/surfaces/__tests__/p13-soft-launch-qa.test.tsx` |
| Admin spot-check | `apps/admin/src/domain/__tests__/p13-soft-launch-admin-spotcheck.test.ts` |

**판정:** Soft Launch **UI/QA agent Implemented** — 실돈 CB·실기기 PWA 스크린샷은 operator Verified.

---

## 4. 명령 치트시트

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb

bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/p13-soft-launch-display-contract.test.ts
bun run check:i18n
bun run check:pwa
```

---

## 5. 교차 참조

| 문서 | 용도 |
| ---- | ---- |
| [`P13_T0A_PROD_PREFLIGHT.md`](P13_T0A_PROD_PREFLIGHT.md) | T0-A 선행 · MFA/자본 DEFER |
| [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) | CB-01~06 |
| [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](../SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md) | §29.5 초등어 |
| Plan §20.5 · §20.14.5 · §25.10 · §32.6 | Soft Launch DoD |

---

**Implemented:** display-contract · QA vitest · admin spot-check · 본 canon  
**다음:** `launch-ramp-t1-feature-gates` — P13 closeout `#236` **`[x]` DONE** · Soft Launch · W7 **`[x]`**
