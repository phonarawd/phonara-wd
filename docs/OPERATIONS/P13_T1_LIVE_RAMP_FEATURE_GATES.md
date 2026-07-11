# P13 T1 Live Ramp — Feature Gates · Caps · Daily Loop (§20.14.4–§20.14.7)

> **상태:** Active OPS canon · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `launch-ramp-t1-feature-gates` (#237)  
> **선행:** Soft Launch `p13-soft-launch-bundle` (#233) **`[x]`** · Closeout GO `p13-closeout-bundle` (#236) **`[x]`**  
> **후행:** T2 scale `launch-scale-t2-triggers` (#238)  
> **코드 계약:** [`p13-t1-live-ramp-display-contract.ts`](../../apps/admin/src/domain/p13-t1-live-ramp-display-contract.ts)  
> **Spotcheck:** [`scripts/p13-t1-live-ramp-spotcheck.sql`](../../scripts/p13-t1-live-ramp-spotcheck.sql)  
> **엔진 경계:** migration · `packages/*-engine` **코드 diff 0** (non-waivable)

본 문서는 **공식 GO 이후** T1 트래픽 ramp 정본이다.  
주간 feature gate(spot · futures isolated · casino · sports) · cap · 1인 Admin daily loop.

---

## 1. 30초 요약

| 항목 | T1 의미 | 판정 |
| ---- | ------- | ---- |
| 주간 rails ON | spot · futures · game · sports · deposit = **true** | app_config + `/admin/ops` |
| Futures | **isolated only** (cross OFF) | §20.14.7 |
| Cap | OI **40%** · lev **5** · KRW 50만 / USDT 100 | futures + CB |
| Launch OFF | cross · funding · withdrawal · Tier-B UI | §20.14.7 |
| Daily loop | 09:00 queues/ops · 12/22 pager · 18:00 risk | §20.14.6 |
| 코드 diff 0 | migration / `*-engine` **0** | PR |

---

## 2. 체크리스트 (5섹션)

### 2.1 주간 feature gates (spot · futures isolated · casino · sports)

| Key | T1 기대 | Admin `/ops` |
| --- | ------- | ------------ |
| `feature_spot_enabled` | **true** | spot kill |
| `feature_futures_enabled` | **true** (isolated only) | futures kill |
| `feature_game_enabled` | **true** (casino) | game kill |
| `feature_sports_enabled` | **true** | sports kill |
| `feature_deposit_enabled` | **true** | deposit kill |

**주간 리뷰 (월요일 KST):** rails ON 유지 · open alerts · exception queues · OI 40% · launch OFF 재확인.

| # | 확인 | 완료 |
| - | ---- | ---- |
| W1 | 4 rails + deposit = true | [ ] |
| W2 | `/admin/ops` kill 스위치로 동일 키 확인 | [ ] |
| W3 | 월요일 주간 리뷰 체크리스트 수행 | [ ] |

### 2.2 Cap 설정 (§20.14.2 · §20.14.5)

| 항목 | CB (Soft Launch) | **T1** |
| ---- | ---------------- | ------ |
| max leverage | 5 | **5** (유지) |
| OI utilization | 50% of seed | **40%** of seed |
| majors `max_open_interest` | `250000` | **`200000.000000`** |
| `PHONUSDT-PERP` OI | `50000` | **`40000.000000`** |
| insurance | OI × 20% USDT | 동일 |
| per-user cap | KRW 50만 / USDT 100 | 동일 |
| `max_open_positions_per_user` | 50 | **50** |

적용 SQL (Dashboard / service_role · 1회):

```sql
UPDATE futures_markets
   SET max_open_interest = '200000.000000',
       max_leverage = '5'
 WHERE is_active AND symbol LIKE '%USDT-SIM';

UPDATE futures_markets
   SET max_open_interest = '40000.000000',
       max_leverage = '5'
 WHERE is_active AND symbol = 'PHONUSDT-PERP';
```

| # | 확인 | 완료 |
| - | ---- | ---- |
| C1 | majors OI = 200000 · lev 5 | [ ] |
| C2 | PHON OI = 40000 · lev 5 | [ ] |
| C3 | spotcheck ASSERT green | [ ] |

### 2.3 Launch gates OFF (§20.14.7)

| Key | T1 기대 |
| --- | ------- |
| `feature_cross_margin_enabled` | **false** |
| `feature_funding_enabled` | **false** |
| `feature_withdrawal_enabled` | **false** (별도 승인 전) |
| `system_halt` / `system_readonly` | **false** |
| Tier-B hedge · reduce-only UI | **built_hidden** (E21까지) |

| # | 확인 | 완료 |
| - | ---- | ---- |
| G1 | cross = false | [ ] |
| G2 | funding = false | [ ] |
| G3 | withdrawal = false | [ ] |
| G4 | Tier-B UI 노출 0 | [ ] |

### 2.4 Admin daily loop (1인 · KST · §20.14.6)

| 시각 | 초점 | Admin 경로 |
| ---- | ---- | ---------- |
| **09:00** | `/admin/ops` alerts · deposit/withdrawal **exception queues** | `/ops` · `/queues` · `/deposits` · `/withdrawals` |
| **12:00** | Telegram **critical pager only** (`launch-engine-e3-*`) | — |
| **18:00** | insurance balance · OI utilization · ledger drift spot-check | `/ops` + spotcheck SQL |
| **22:00** | Telegram **critical pager only** | — |

09:00 체크:

1. `/admin/ops` — open alerts · kill 상태 · market halt  
2. `/admin/queues` — pending/in_review  
3. `/admin/deposits` — 예외 입금  
4. `/admin/withdrawals` — pending (출금 OFF여도 큐 잔여 확인)

| # | 확인 | 완료 |
| - | ---- | ---- |
| D1 | 09:00 4 desk 루프 숙지 | [ ] |
| D2 | 12:00 / 22:00 pager-only (노이즈 0) | [ ] |
| D3 | 18:00 insurance · OI · drift | [ ] |
| D4 | 부재 시 Web Push `/queues` deep-link (`#231`) | [ ] |

### 2.5 코드 diff 0

| # | 확인 | 완료 |
| - | ---- | ---- |
| Z1 | 본 todo PR에 `supabase/migrations/**` 변경 **0** | [ ] |
| Z2 | `packages/*-engine` 변경 **0** | [ ] |
| Z3 | 산출물 = docs · display-contract · spotcheck SQL only | [ ] |

---

## 3. Live audit (prod · 2026-07-11 · read-only + OI apply)

프로젝트: `yocjhjsdwoijfdrehzoq`

| 섹션 | 결과 | 비고 |
| ---- | ---- | ---- |
| **spot / futures / game / sports / deposit** | **PASS** all `true` | 주간 rails |
| **cross / funding / withdrawal** | **PASS** all `false` | Launch OFF |
| **halt / readonly** | **PASS** false | |
| **OI / leverage (적용 후)** | **PASS** | majors **200k** · PHON **40k** · lev **5** |
| **코드 diff 0** | **PASS** | migration 0 |

**판정:** T1 **feature gate + cap policy Implemented** · daily loop = operator 운영 숙지.

### 3.1 Operator DEFER (T0-A 유지)

| # | 항목 | 상태 |
| - | ---- | ---- |
| D1 | Admin MFA enroll | **`[ ]` DEFER** (유료) |
| D2 | 실입금 · insurance/treasury 자본 | **`[ ]` DEFER** |

---

## 4. 명령 치트시트

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb

# 계약 게이트
bun run gate:ai-impl -- --test apps/admin/src/domain/__tests__/p13-t1-live-ramp-display-contract.test.ts

# SQL spotcheck (Dashboard / service_role — agent 로컬 test:sql 금지)
# scripts/p13-t1-live-ramp-spotcheck.sql
```

---

## 5. 교차 참조

| 문서 | 용도 |
| ---- | ---- |
| [`P13_LAUNCH_CLOSEOUT_BUNDLE.md`](P13_LAUNCH_CLOSEOUT_BUNDLE.md) | 공식 GO 선행 |
| [`P13_SOFT_LAUNCH_BUNDLE.md`](P13_SOFT_LAUNCH_BUNDLE.md) | Soft Launch · CB |
| [`P13_T0A_PROD_PREFLIGHT.md`](P13_T0A_PROD_PREFLIGHT.md) | T0-A · MFA/자본 DEFER |
| [`setup/MANUAL_TASKS.md`](../../setup/MANUAL_TASKS.md) §11–§11b | Launch-Ops · T1 daily |
| Plan §20.14.4–§20.14.7 | GO · caps · daily · launch OFF |

---

**Implemented:** display-contract · spotcheck · 본 canon · OI 40% apply · live audit  
**다음:** `ew-e1-decay-wave` (#240) — E0 `#239` **`[x]` DONE** · T2 scale `#238` **`[x]` DONE** · [`P13_T2_SCALE_TRIGGERS.md`](P13_T2_SCALE_TRIGGERS.md)
