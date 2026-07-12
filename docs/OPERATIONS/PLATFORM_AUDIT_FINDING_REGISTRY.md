# Platform Audit Finding Registry

> **기계 정본:** [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](PLATFORM_AUDIT_FINDING_REGISTRY.yaml) (불일치 시 YAML 우선)
> **schema_version:** 1 · **playbook:** 1.0.0 · **updated:** 2026-07-13T10:00:00+09:00
> **Release SHA (R9):** `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`
> **Known Good / baseline SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`
> **상태 enum:** OPEN · INVESTIGATING · APPROVED_FOR_IMPLEMENT · IN_PROGRESS · VERIFYING · VERIFIED_FIXED · VERIFIED_GATED · VERIFIED_NOT_DEFECT · UNVERIFIED · BLOCKED_STOP · BLOCKED_DEP · CLOSED
> **dod_profile:** `ui-route` · `backend-db` · `type-hygiene`

## Summary

| 항목           | 값                                      |
| -------------- | --------------------------------------- |
| Finding 수     | 38 (감사 34 + EXT 2 + R9 2)             |
| CRITICAL       | 4                                       |
| HIGH           | 11                                      |
| MEDIUM         | 23                                      |
| CLOSED         | 0                                       |
| VERIFIED_FIXED | 35                                      |
| OPEN           | 1 (R9-PERF-JS · ACCEPTED_RISK baseline) |
| BLOCKED_DEP    | 1 (H-09 Pro+ HIBP)                      |

## Registry

| Finding        | Severity | Score | Domain    | Stage | Status         | dod_profile  | Symptom                   | Fix                                       | Evidence      | UpdatedAt                 |
| -------------- | -------- | ----- | --------- | ----- | -------------- | ------------ | ------------------------- | ----------------------------------------- | ------------- | ------------------------- |
| C-01           | CRITICAL | 21    | Marketing | R1    | VERIFIED_FIXED | ui-route     | 합성 social proof         | fail-closed hide                          | Stage1 PASS   | 2026-07-13T02:35:00+09:00 |
| C-02           | CRITICAL | 20    | Marketing | R1    | VERIFIED_FIXED | ui-route     | `/status` false-green     | unknown badges                            | Stage1 PASS   | 2026-07-13T02:35:00+09:00 |
| H-01           | HIGH     | 18    | Marketing | R1    | VERIFIED_FIXED | ui-route     | 1 PHON = 1 KRW            | FiatHint omit                             | Stage1 PASS   | 2026-07-13T02:35:00+09:00 |
| H-02           | CRITICAL | 18    | Security  | R3    | VERIFIED_FIXED | backend-db   | rpc_lock_wallet 노출      | client EXECUTE revoke · live crash secret | R3-a SQL      | 2026-07-13T03:57:00+09:00 |
| H-03           | HIGH     | 19    | Wallet    | R2    | VERIFIED_FIXED | ui-route     | crypto rail 노출          | hub omit + redirect                       | R2-a Stage1   | 2026-07-13T03:07:00+09:00 |
| H-04           | HIGH     | 18    | Trade     | R4    | VERIFIED_FIXED | backend-db   | edge_ops false-green      | outcome counts · Edge                     | R4 implement  | 2026-07-13T04:42:00+09:00 |
| H-05           | HIGH     | 18    | Sports    | R2    | VERIFIED_FIXED | ui-route     | stale odds 선택 가능      | freshness · `—`                           | R2-c Stage1   | 2026-07-13T03:30:00+09:00 |
| H-10           | CRITICAL | 20    | Wallet    | R2    | VERIFIED_FIXED | ui-route     | 출금 OFF 전역             | decision+copy+5조건                       | R2-b Stage1   | 2026-07-13T03:30:00+09:00 |
| H-11           | HIGH     | 15    | Wallet    | R2    | VERIFIED_FIXED | ui-route     | giftcard market 0         | hub omit                                  | R2-a Stage1   | 2026-07-13T03:07:00+09:00 |
| M-01           | MEDIUM   | 14    | Earn      | R1    | VERIFIED_FIXED | ui-route     | P vs PHON                 | landing PHON labels                       | Stage1 PASS   | 2026-07-13T02:35:00+09:00 |
| M-05           | MEDIUM   | 13    | Security  | R3    | VERIFIED_FIXED | backend-db   | search_path mutable 8     | ALTER SET search_path × 8                 | R3-c SQL      | 2026-07-13T04:35:00+09:00 |
| M-04           | MEDIUM   | 14    | Security  | R3    | VERIFIED_FIXED | backend-db   | anon SIWE/analytics flood | HMAC dual-bucket ingress                  | R3-d SQL      | 2026-07-13T04:25:00+09:00 |
| M-06           | MEDIUM   | 12    | Security  | R3    | VERIFIED_FIXED | backend-db   | service-write DML GRANT   | allowlist + trigger revoke + defacl       | R3-b SQL      | 2026-07-13T04:20:00+09:00 |
| M-18           | MEDIUM   | 14    | Ops       | R0    | VERIFIED_FIXED | ui-route     | Browser MCP 부재          | Probe5 + headless-shell                   | R0+R1 Stage1  | 2026-07-13T02:35:00+09:00 |
| M-21           | MEDIUM   | 14    | Wallet    | R2    | VERIFIED_FIXED | ui-route     | KRW proof Web caller 0    | upload wire + gate                        | R2-d Stage1   | 2026-07-13T03:35:00+09:00 |
| M-20           | MEDIUM   | 9     | Ops       | R4    | VERIFIED_FIXED | backend-db   | advisor initplan/multi    | wrap+consolidate · residual 2             | R4 implement  | 2026-07-13T04:42:00+09:00 |
| EXT-01         | HIGH     | 17    | Ops       | R4    | VERIFIED_FIXED | backend-db   | 관측 스택 미구축          | ADR-021 dry-fire 6/6                      | R4 implement  | 2026-07-13T04:42:00+09:00 |
| EXT-02         | MEDIUM   | 11    | Ops       | R0    | VERIFIED_FIXED | type-hygiene | Evidence bucket 미지정    | private bucket CREATE                     | SQL verify    | 2026-07-13T00:40:00+09:00 |
| R9-PERF-JS     | HIGH     | 17    | Ops       | R9    | OPEN           | ui-route     | Web JS 539>450 SLO        | code-split · DL-R10-PERF-JS               | R9 Stage1     | 2026-07-13T08:00:00+09:00 |
| R9-INSTALL-CTX | MEDIUM   | 12    | Ops       | R9    | VERIFIED_FIXED | ui-route     | /install Provider 누락    | PwaShell children wrap                    | R10 implement | 2026-07-13T08:00:00+09:00 |

> 전체 38행 상세 필드는 YAML 정본을 본다. OPEN 1건 (R9-PERF-JS) · R11 Freeze ACTIVE · Release candidate **BLOCKED**.

## Severity formula (§35)

`score = Impact + Likelihood + Exploitability + CustomerImpact + RevenueImpact`

- CRITICAL: score ≥ 20 또는 Impact=5+Exploitability≥4 또는 Money/Permission 직접 파괴
- HIGH: score 15–19
- MEDIUM: score ≤ 14
