# P13 T2 Scale — DAU/접속 Trigger Matrix (§20.14.4 · YAML #238)

> **상태:** Active OPS canon · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `launch-scale-t2-triggers` (#238)  
> **선행:** T1 ramp `launch-ramp-t1-feature-gates` (#237) **`[x]`** · Closeout GO `p13-closeout-bundle` (#236) **`[x]`**  
> **후행:** Track B `ew-e0-adr-approval` (#239) **`[x]` DONE** → `ew-e1-decay-wave` (#240)  
> **코드 계약:** [`p13-t2-scale-triggers-display-contract.ts`](../../apps/admin/src/domain/p13-t2-scale-triggers-display-contract.ts)  
> **Spotcheck:** [`scripts/p13-t2-scale-triggers-spotcheck.sql`](../../scripts/p13-t2-scale-triggers-spotcheck.sql)  
> **엔진 경계:** migration · `packages/*-engine` **코드 diff 0** (non-waivable)

본 문서는 **공식 GO + T1 ramp 이후** 트래픽·인프라 scale 정본이다.  
DAU/접속 band(500~2K / 2K~10K / 10K+) · per-user notional · read replica · hedge 검토.

**자동 적용 금지:** band 진입만으로 OI/cap/replica를 바꾸지 않는다. 월요일 scale 리뷰 + operator 승인 후 적용.

---

## 1. 30초 요약

| 항목 | T2 의미 | 판정 |
| ---- | ------- | ---- |
| Band S1 | DAU **500~2K** | notional ↑ · OI **50%** · primary only · B-book 유지 |
| Band S2 | DAU **2K~10K** | notional ↑ · OI **60%** · **read replica** · hedge ADR kickoff |
| Band S3 | DAU **10K+** | notional ↑ · OI **80%** · replica HA · hedge **GO/NO-GO** |
| Hedge | 제품 **B-book** 기본 · 외부 venue hedge ≠ E21 UI hedge | §20.14.1 |
| 코드 diff 0 | migration / `*-engine` **0** | PR |

---

## 2. 체크리스트 (5섹션)

### 2.1 DAU/접속 trigger matrix

| Band | DAU (24h distinct) | 접속 hint (peak concurrent) | 트리거 액션 |
| ---- | ------------------ | --------------------------- | ----------- |
| **below S1** | &lt; 500 | — | T1 유지 (OI 40% · KRW 50만 / USDT 100) |
| **S1 Early** `500~2K` | 500 ≤ DAU &lt; 2_000 | ~50–200 | §2.2 S1 notional · OI 50% · CPU 모니터링 |
| **S2 Growth** `2K~10K` | 2_000 ≤ DAU &lt; 10_000 | ~200–1_000 | §2.2 S2 · **read replica** (§2.3) · hedge ADR (§2.4) |
| **S3 Scale** `10K+` | DAU ≥ 10_000 | ≥ ~1_000 | §2.2 S3 · replica HA · hedge GO/NO-GO |

측정:

1. Dashboard SQL — `scripts/p13-t2-scale-triggers-spotcheck.sql` (DAU = `auth.users.last_sign_in_at` 24h · fallback `profiles.updated_at`)
2. Supabase Dashboard → Reports / Auth (보조)
3. `/admin/ops` — open alerts · DB pressure 신호

| # | 확인 | 완료 |
| - | ---- | ---- |
| M1 | spotcheck DAU_24h · band NOTICE 확인 | [ ] |
| M2 | 월요일 T1 rails 리뷰 **이후** scale band 분류 | [ ] |
| M3 | band 변경 시 reason을 ops note / chat에 기록 | [ ] |

### 2.2 Per-user notional cap

| Band | KRW | USDT | Majors OI | PHON OI | OI % seed |
| ---- | --- | ---- | --------- | ------- | --------- |
| T1 baseline | 500_000 | 100 | `200000.000000` | `40000.000000` | 40% |
| **S1** | **1_000_000** | **200** | `250000.000000` | `50000.000000` | **50%** |
| **S2** | **2_000_000** | **500** | `300000.000000` | `60000.000000` | **60%** |
| **S3** | **5_000_000** | **2_000** | `400000.000000` | `80000.000000` | **80%** |

공통 유지: `max_leverage = 5` · `max_open_positions_per_user = 50` · insurance = OI × **20%** USDT.

S1 적용 예시 (Dashboard / service_role · band 확정 후 1회):

```sql
UPDATE futures_markets
   SET max_open_interest = '250000.000000',
       max_leverage = '5'
 WHERE is_active AND symbol LIKE '%USDT-SIM';

UPDATE futures_markets
   SET max_open_interest = '50000.000000',
       max_leverage = '5'
 WHERE is_active AND symbol = 'PHONUSDT-PERP';
```

| # | 확인 | 완료 |
| - | ---- | ---- |
| C1 | 현재 band vs 표 notional/OI 일치 | [ ] |
| C2 | lev 5 · positions 50 유지 | [ ] |
| C3 | 적용 후 T1/T2 spotcheck green | [ ] |

### 2.3 Read replica 검토

| Band | 정책 | 비고 |
| ---- | ---- | ---- |
| S1 | **primary only** · CPU/IO 모니터링 | replica 미도입 |
| S2 | **read replica ON** (read-heavy) | Dashboard 프로비저닝 · 코드 migration **0** |
| S3 | **replica HA** + compute upgrade | 장애 시 primary failover playbook |

**Replica 허용 read:** market catalog · leaderboards · announcements · sports board reads.  
**Replica 금지:** wallet/ledger write · order place/settle · deposit/withdrawal queues · admin mutations.

| # | 확인 | 완료 |
| - | ---- | ---- |
| R1 | S1이면 replica 없이 CPU 추세만 | [ ] |
| R2 | S2+면 Dashboard read replica 계획/적용 | [ ] |
| R3 | money path가 replica를 쓰지 않음 | [ ] |

### 2.4 Hedge 검토

| 구분 | 의미 | T2 행동 |
| ---- | ---- | ------- |
| **제품 B-book** | oracle 정본 + `insurance_fund_*` · **외부 venue hedge 없음** (§20.14.1) | 기본 **유지** |
| **외부 venue hedge** | Binance/OKX 등 반대 포지션 | S2 ADR kickoff · S3 operator GO/NO-GO |
| **E21 user hedge UI** | dual-side position mode | **별개** — `built_hidden` until `ew-e21-*` |

| Band | Hedge checkpoint |
| ---- | ---------------- |
| S1 | B-book 유지 · insurance 20% 재확인 |
| S2 | 「외부 hedge vs B-book 강화」 ADR 초안 |
| S3 | operator **GO/NO-GO** (도입 시 Track B ADR · migration 별 todo) |

| # | 확인 | 완료 |
| - | ---- | ---- |
| H1 | 외부 hedge default = **OFF** (B-book) | [ ] |
| H2 | E21 UI hedge와 혼동 0 | [ ] |
| H3 | S2+면 hedge ADR note 작성 | [ ] |

### 2.5 코드 diff 0

| # | 확인 | 완료 |
| - | ---- | ---- |
| Z1 | 본 todo PR에 `supabase/migrations/**` 변경 **0** | [ ] |
| Z2 | `packages/*-engine` 변경 **0** | [ ] |
| Z3 | 산출물 = docs · display-contract · spotcheck SQL only | [ ] |

---

## 3. Live audit (prod · 2026-07-11 · read-only)

프로젝트: `yocjhjsdwoijfdrehzoq`

| 섹션 | 결과 | 비고 |
| ---- | ---- | ---- |
| **T1 선행** | **PASS** | rails ON · launch OFF · OI 40% (`#237`) |
| **DAU band** | spotcheck로 분류 | Soft Launch 직후 → 대개 **below_s1** / 측정 대기 |
| **코드 diff 0** | **PASS** | migration 0 |

**판정:** T2 **trigger matrix Implemented** · band 적용 = 트래픽 실측 후 operator.

### 3.1 Operator DEFER (T0-A 유지)

| # | 항목 | 상태 |
| - | ---- | ---- |
| D1 | Admin MFA enroll | **`[ ]` DEFER** (유료) |
| D2 | 실입금 · insurance/treasury 자본 | **`[ ]` DEFER** |
| D3 | 외부 venue hedge 실연동 | **S3 GO 전 금지** |

---

## 4. 명령 치트시트

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb

# 계약 게이트
bun run gate:ai-impl -- --test apps/admin/src/domain/__tests__/p13-t2-scale-triggers-display-contract.test.ts

# SQL spotcheck (Dashboard / service_role — agent 로컬 test:sql 금지)
# scripts/p13-t2-scale-triggers-spotcheck.sql
```

---

## 5. 교차 참조

| 문서 | 용도 |
| ---- | ---- |
| [`P13_T1_LIVE_RAMP_FEATURE_GATES.md`](P13_T1_LIVE_RAMP_FEATURE_GATES.md) | T1 선행 · daily loop |
| [`P13_LAUNCH_CLOSEOUT_BUNDLE.md`](P13_LAUNCH_CLOSEOUT_BUNDLE.md) | 공식 GO |
| [`P13_SOFT_LAUNCH_BUNDLE.md`](P13_SOFT_LAUNCH_BUNDLE.md) | Soft Launch · CB |
| [`setup/MANUAL_TASKS.md`](../../setup/MANUAL_TASKS.md) §11b–§11c | T1 daily · T2 scale |
| Plan §20.14.1 · §20.14.4 | B-book · GO 이후 ramp |

---

**Implemented:** display-contract · spotcheck · 본 canon · DAU matrix · notional · replica · hedge review · `gate:ai-impl` **6/6**  
**다음:** `ew-e1-decay-wave` (#240) — E0 `#239` **`[x]` DONE**
