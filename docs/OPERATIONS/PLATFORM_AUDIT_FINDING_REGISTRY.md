# Platform Audit Finding Registry

> **기계 정본:** [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](PLATFORM_AUDIT_FINDING_REGISTRY.yaml) (불일치 시 YAML 우선)
> **schema_version:** 1 · **playbook:** 1.0.0 · **updated:** 2026-07-13T03:10:00+09:00
> **Known Good / baseline SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`
> **상태 enum:** OPEN · INVESTIGATING · APPROVED_FOR_IMPLEMENT · IN_PROGRESS · VERIFYING · VERIFIED_FIXED · VERIFIED_GATED · VERIFIED_NOT_DEFECT · UNVERIFIED · BLOCKED_STOP · BLOCKED_DEP · CLOSED
> **dod_profile:** `ui-route` · `backend-db` · `type-hygiene`

## Summary

| 항목       | 값                                              |
| ---------- | ----------------------------------------------- |
| Finding 수 | 36 (감사 34 + EXT 2)                            |
| CRITICAL   | 4                                               |
| HIGH       | 10                                              |
| MEDIUM     | 22                                              |
| CLOSED     | 0 (R1 C-01/C-02/H-01/M-01 = **VERIFIED_FIXED**) |

## Registry

| Finding | Severity | Score | Domain    | Stage | Status         | dod_profile | Symptom               | Fix                 | Evidence    | UpdatedAt                 |
| ------- | -------- | ----- | --------- | ----- | -------------- | ----------- | --------------------- | ------------------- | ----------- | ------------------------- |
| C-01    | CRITICAL | 21    | Marketing | R1    | VERIFIED_FIXED | ui-route    | 합성 social proof     | fail-closed hide    | Stage1 PASS | 2026-07-13T02:35:00+09:00 |
| C-02    | CRITICAL | 20    | Marketing | R1    | VERIFIED_FIXED | ui-route    | `/status` false-green | unknown badges      | Stage1 PASS | 2026-07-13T02:35:00+09:00 |
| H-01    | HIGH     | 18    | Marketing | R1    | VERIFIED_FIXED | ui-route    | 1 PHON = 1 KRW        | FiatHint omit       | Stage1 PASS | 2026-07-13T02:35:00+09:00 |
| M-01    | MEDIUM   | 14    | Earn      | R1    | VERIFIED_FIXED | ui-route    | P vs PHON             | landing PHON labels | Stage1 PASS | 2026-07-13T02:35:00+09:00 |
| M-18    | MEDIUM   | 14    | Ops       | R0    | VERIFIED_FIXED | ui-route    | Browser MCP 부재      | Probe5              | R0 probe    | 2026-07-13T01:52:00+09:00 |

> 전체 36행 상세 필드는 YAML 정본을 본다. 위 표는 R1 활성 Finding 요약이다.

## Severity formula (§35)

`score = Impact + Likelihood + Exploitability + CustomerImpact + RevenueImpact`

- CRITICAL: score ≥ 20 또는 Impact=5+Exploitability≥4 또는 Money/Permission 직접 파괴
- HIGH: score 15–19
- MEDIUM: score ≤ 14
