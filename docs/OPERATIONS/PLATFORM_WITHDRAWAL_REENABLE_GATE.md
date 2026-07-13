# Withdrawal 재개 게이트 (H-10 · Feature Flag 5조건)

> **날짜:** 2026-07-13  
> **Finding:** H-10 · Plan todo `audit-r2b-withdrawal-copy`  
> **Decision:** [`PLATFORM_AUDIT_DECISION_LOG.md`](PLATFORM_AUDIT_DECISION_LOG.md) **DL-R2B-H10**  
> **코드 fail-closed:** `feature_withdrawal_enabled=false` → `platform-gate-contract` · `withdrawalBlocked`  
> **재개 시점:** R10 soak 단계 (Live Crash → Trade → Sports → Giftcard → **Withdrawal** 순서)

---

## 1. 현재 운영 상태 (의도적 OFF)

| 항목                                    | 값                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app_config.feature_withdrawal_enabled` | **`false`** (의도 · 코드 결함 아님)                                                      |
| Soft Launch / T1                        | [`P13_T1_LIVE_RAMP_FEATURE_GATES.md`](P13_T1_LIVE_RAMP_FEATURE_GATES.md) §2.3 Launch OFF |
| 사용자 UI                               | 사유 + 다음 행동 i18n · rail CTA disabled · RPC submit fail-closed                       |
| 잔액                                    | 조회·입금 가능 · 잔액 보존                                                               |

**금지:** Owner 승인·본 체크리스트 Green 없이 `feature_withdrawal_enabled=true` flip.

### Phase 5 재검증 (2026-07-14)

| 항목 | 결과 |
| --- | --- |
| remote `app_config.feature_withdrawal_enabled` | **`false`** (MCP SELECT 2026-07-14 · 문서와 일치) |
| UI fail-closed contract | `wallet-withdrawal-off-display-contract` · owner vitest green |
| 본 Phase flag flip | **0** — Soft Launch 재개 게이트(§2·§3)만 참조 |

정본: [`PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md`](../PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md) Phase 5 · rail 재노출 금지.

---

## 2. Feature Flag 활성화 5조건 (Playbook §8)

신규/재개 rail을 `live`로 켜려면 아래 **5가지 전부 Green**. 하나라도 red면 `false` 유지.

| #     | 조건             | Withdrawal 판정 근거                                                | Green 기준                           |
| ----- | ---------------- | ------------------------------------------------------------------- | ------------------------------------ |
| **1** | Feature Flag     | `feature_withdrawal_enabled` 명시 OFF/ON + Admin kill audit         | flip 직전에만 ON · reason/audit 기록 |
| **2** | Capability       | KYC/AML · MFA(AAL2) · tier cap · `withdrawal_ready` · queue/runbook | 준비 조건 전부 충족 (§3)             |
| **3** | Provider Health  | KRW 송금 경로 · (재개 시) crypto withdraw provider                  | false-green 금지 · health OK         |
| **4** | Runtime          | 성공 + negative E2E 1쌍 (money Σ=0)                                 | CI e2e 또는 승인 orchestrator green  |
| **5** | Browser Evidence | Stage1 `/wallet/withdraw` (+ rail)                                  | paused→live 전환 후 Browser MCP PASS |

R10은 재개 단계마다 본 표를 **재확인**한다.

---

## 3. Withdrawal 추가 준비 조건 (Plan R2 · H-10)

5조건 **Capability**에 포함되는 withdrawal-specific 체크리스트:

| #   | 항목                                                                    | 확인 |
| --- | ----------------------------------------------------------------------- | ---- |
| W1  | KYC/AML 정책·심사 큐 가동                                               | [ ]  |
| W2  | MFA(AAL2) withdraw path live                                            | [ ]  |
| W3  | Tier/cap · per-user limit 문서화                                        | [ ]  |
| W4  | Admin `/withdrawals` queue SLA · runbook                                | [ ]  |
| W5  | 기존 audited RPC만 사용 (`rpc_create_*_withdrawal` 등) · 신규 mutator 0 | [ ]  |
| W6  | Ledger conservation Σ=0 · hash-chain SQL/CI green                       | [ ]  |
| W7  | Rollback Trigger(§20b) + Observability(§39) 매핑                        | [ ]  |

---

## 4. Flip 절차 (요약)

```text
1. §2 5조건 + §3 W1–W7 전부 Green · Decision Log에 Owner 승인 행
2. Admin ops kill: feature_withdrawal_enabled = true (reason + audit)
3. Stage1 Browser `/wallet/withdraw` — paused banner 0 · rail CTA live
4. R10 soak 감시 · Trigger hit 시 즉시 OFF
```

**Rollback:** `feature_withdrawal_enabled=false` (Known Good) · migration rewrite 금지.

---

## 5. 교차 참조

- Playbook §8 Feature Flag 5조건 · R10 재개 순서
- [`PLATFORM_STANDING_GRANT.md`](PLATFORM_STANDING_GRANT.md) — Domain/Release flip은 Owner gate
- UI copy SOT: `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts`
