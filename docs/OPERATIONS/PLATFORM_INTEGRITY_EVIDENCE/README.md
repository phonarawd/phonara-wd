# Platform Integrity Remediation — Evidence Repository

> **목적:** PIR 감사·장애 시 문서보다 먼저 찾는 **증거 인덱스**  
> **Plan:** `platform_integrity_remediation_v1` · execute SSOT = [`ACTIVE_WORK_SSOT.md`](../../SSOT/ACTIVE_WORK_SSOT.md) §Platform Integrity  
> **상태:** **`[x]` DONE** 2026-07-11 — Track A `#205` **UNBLOCKED**  
> **바이너리:** CI artifact 링크만 — repo root `/evidence` **금지** (G12)

**경로 (단일 SOT):** `docs/OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/`

---

## 디렉터리 · 명명 규칙

```text
docs/OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/
  README.md                    # 본 인덱스 (Wave 0 스캐폴드)
  W0/ssot-bootstrap.md         # ACTIVE_WORK_SSOT · #205 BLOCKED · ADR-008 §PIR
  P0/autobet-session.md        # pir-p0-autobet-session · vitest RED/green
  P0/autobet-gate.md           # pir-p0-autobet-gate · gate:ai-impl
  P1/admin-rbac.md             # pir-p1-admin-rbac
  P1/sports-odds-debounce.md   # pir-p1-sports-odds-debounce
  E1/system-lock-order.md      # pir-e1 · migration + SQL concurrency
  E2/realtime-narrow.md        # pir-e2 · publication DROP + index
  E3/golden-earth.md           # pir-e3
  E4/sweep-chunk.md            # pir-e4
  E5/idempotency-handlers.md   # pir-e5
  P2/quantize-odds.md          # pir-p2-quantize-odds
  P2/pf-golden-vectors.md      # pir-p2-pf-golden-vectors
  GATE/platform-integrity.md   # pir-gate-platform-integrity · CI 4 jobs
  GATE/unblock-205.md          # pir-closeout-unblock-205 · §82
```

| Wave     | 슬롯        | 증거 유형                                                    | 상태                                                        |
| -------- | ----------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| **W0**   | `W0/`       | SSOT 형제 큐 · Evidence 스캐폴드 · `#205` BLOCKED            | **`[x]` DONE** 2026-07-11                                   |
| P0       | `P0/`       | auto-bet session + `gate:ai-impl`                            | session **`[x]`** · gate **`[x]`** 2026-07-11               |
| P1       | `P1/`       | Admin RBAC · sports odds debounce                            | admin-rbac **`[x]`** · sports debounce **`[x]`** 2026-07-11 |
| E1–E5    | `E1/`…`E5/` | migration + SQL test · `stack:push-remote` · advisor 0 ERROR | E1–E5 **`[x]`** 2026-07-11                                  |
| P2       | `P2/`       | quantize6 · PF golden vectors                                | quantize-odds **`[x]`** · pf-golden **`[x]`** 2026-07-11    |
| **GATE** | `GATE/`     | presentation bundle · CI required 4 · unblock `#205`         | platform-integrity **`[x]`** · unblock **`[x]`** 2026-07-11 |

---

## CI 링크 템플릿

```text
Implemented: gate:ai-impl --test <path> green · vitest N/N
Verified: gh run list --workflow=ci.yml --limit 3
         GitHub Actions → quality · sql · e2e · advisors green
Engine: db reset → CI sql · stack:push-remote · advisor 0 ERROR
```

PHONARA 정합: 로컬 = `gate:ai-impl` · heavy = **GitHub CI** · Engine Wave E = migration + SQL test per todo

---

## W0 슬롯 (현재)

| 파일                                           | 역할                                                                 | 상태                      |
| ---------------------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| [`W0/ssot-bootstrap.md`](W0/ssot-bootstrap.md) | ACTIVE_WORK_SSOT 형제 큐 · `#205` BLOCKED · ADR-008 §PIR · 본 README | **`[x]` DONE** 2026-07-11 |

**전역 NEXT:** `p2-admin-table-primitive` (#206)  
**Fiat#11 `#205`:** **`[x]` DONE** 2026-07-11 — Casino fiat hint session-lock
**Track A `#205`:** **UNBLOCKED** — `pir-closeout-unblock-205` `[x]`

---

## GATE 슬롯

| 파일                                                       | 역할                                               | 상태                      |
| ---------------------------------------------------------- | -------------------------------------------------- | ------------------------- |
| [`GATE/platform-integrity.md`](GATE/platform-integrity.md) | presentation bundle · CI 4 · security-auditor PASS | **`[x]` DONE** 2026-07-11 |
| [`GATE/unblock-205.md`](GATE/unblock-205.md)               | §82 · NEXT = `#205`                                | **`[x]` DONE** 2026-07-11 |

---

## E1 슬롯

| 파일                                                 | 역할                                                                     | 상태                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------- |
| [`E1/system-lock-order.md`](E1/system-lock-order.md) | `_lock_system_accounts` · buy/sell/fill · SQL 118/118 · remote advisor 0 | **`[x]` DONE** 2026-07-11 |

---

## E2 슬롯

| 파일                                             | 역할                                                                                                     | 상태                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------- |
| [`E2/realtime-narrow.md`](E2/realtime-narrow.md) | publication DROP ledger/fills · `ledger_user_created_idx` · wallets invalidate · SQL 119/119 · advisor 0 | **`[x]` DONE** 2026-07-11 |

---

## E3 슬롯

| 파일                                       | 역할                                                                         | 상태                      |
| ------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------- |
| [`E3/golden-earth.md`](E3/golden-earth.md) | lock-late global · `gjp` idempotency · `gen_random_bytes` · remote advisor 0 | **`[x]` DONE** 2026-07-11 |

---

## E4 슬롯

| 파일                                     | 역할                                                                          | 상태                      |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| [`E4/sweep-chunk.md`](E4/sweep-chunk.md) | liq/funding/stop/affiliate `LIMIT`+`has_more` · cron drain · remote advisor 0 | **`[x]` DONE** 2026-07-11 |

---

## E5 슬롯

| 파일                                                       | 역할                                                                           | 상태                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------- |
| [`E5/idempotency-handlers.md`](E5/idempotency-handlers.md) | place/claim `unique_violation` → 기존 결과 · wallet recheck · remote advisor 0 | **`[x]` DONE** 2026-07-11 |

---

## P2 슬롯

| 파일                                                 | 역할                                          | 상태                      |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------- |
| [`P2/quantize-odds.md`](P2/quantize-odds.md)         | `quantize6` number 제거 · ingest string-only  | **`[x]` DONE** 2026-07-11 |
| [`P2/pf-golden-vectors.md`](P2/pf-golden-vectors.md) | 12게임 PF 골든 벡터 pin · `check:determinism` | **`[x]` DONE** 2026-07-11 |

---

## P0 슬롯

| 파일                                             | 역할                                          | 상태                      |
| ------------------------------------------------ | --------------------------------------------- | ------------------------- |
| [`P0/autobet-session.md`](P0/autobet-session.md) | 순수 세션 리듀서 · stakeOverride · 이중 Start | **`[x]` DONE** 2026-07-11 |
| [`P0/autobet-gate.md`](P0/autobet-gate.md)       | `gate:ai-impl` bundle · vitest **13/13**      | **`[x]` DONE** 2026-07-11 |

---

## P1 슬롯

| 파일                                                       | 역할                                                          | 상태                      |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| [`P1/admin-rbac.md`](P1/admin-rbac.md)                     | grants fail-closed · localStorage DEV-only · vitest **17/17** | **`[x]` DONE** 2026-07-11 |
| [`P1/sports-odds-debounce.md`](P1/sports-odds-debounce.md) | odds INSERT ≥500ms debounce · fixture scope                   | **`[x]` DONE** 2026-07-11 |

---

## ADR-008 교차 (C-2)

[`008-engine-wave-db-tx-race-defer.md`](../../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md) §PIR:

- Engine Wave **전체** DB TX deep audit는 여전히 defer
- **부분 Accepted (본 Plan):** wallet/system_accounts 잠금순서 — `pir-e1-system-lock-order` (`_lock_system_accounts` · spot buy∥sell)

---

## `#205` 재개 조건

```text
pir-gate-platform-integrity [x] + pir-closeout-unblock-205 [x]  ← 충족 2026-07-11
  → phase_r Track A 첫 pending = p2-admin-table-primitive (#206)
  → Fiat#11 `#205` `[x]` DONE 2026-07-11
```
