# R11 — 3-Owner Sign-off Template (§46)

> **RC SHA:** `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`  
> **AI 서명 금지** — operator만 역할별 체크리스트 완료 후 서명.  
> **1인 겸임:** 역할당 **별도 세션** · 시차 서명 필수 ([`PLATFORM_AUDIT_RACI.md`](../../PLATFORM_AUDIT_RACI.md)).

## Security Owner

```yaml
role: security
rc_sha: dcfd8c7eab0374296ffeecdc5cd3f79433786ebe
checklist:
  - '[ ] RLS/RPC/GRANT advisor 0 ERROR (remote)'
  - '[ ] SERVICE_ROLE browser 노출 0'
  - '[ ] H-02 wallet mutator revoke verified'
  - '[ ] H-09 BLOCKED_DEP documented (Pro+ HIBP)'
  - '[ ] Secrets rotation 기한 유효'
  - '[ ] Auth/session negative path Evidence'
verdict: PENDING # APPROVE|BLOCK
signed_at: ''
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-release-gate-checklist.md
notes: ''
```

## Runtime Owner

```yaml
role: runtime
rc_sha: dcfd8c7eab0374296ffeecdc5cd3f79433786ebe
checklist:
  - '[ ] Deploy parity remote green'
  - '[ ] EXT-01 alert dry-fire 6/6'
  - '[ ] SLO/Trigger YAML current'
  - '[ ] Rollback Known Good SHA documented'
  - '[ ] DR/Incident runbook exists'
  - '[ ] R9-PERF-JS triage: fix OR R11 waiver Decision Log'
verdict: PENDING
signed_at: ''
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix.md
notes: 'Stage1 JS SLO fail blocks APPROVE until green or waiver'
```

## Product Owner

```yaml
role: product
rc_sha: dcfd8c7eab0374296ffeecdc5cd3f79433786ebe
checklist:
  - '[ ] Capability honesty (withdrawal OFF · sports stale · crypto OFF)'
  - '[ ] Trust surfaces fail-closed (landing · status)'
  - '[ ] Medium Finding 0 for R11 final (or documented defer)'
  - '[ ] Post-Review 24h/72h/7d calendar registered'
  - '[ ] Release scope — compliance R11 scope-out acknowledged'
  - '[ ] Operator 24h soak snapshot filed'
verdict: PENDING
signed_at: ''
evidence_uri: docs/OPERATIONS/PLATFORM_POST_RELEASE_REVIEW.md
notes: ''
```

## Combined gate

| Role     | Verdict | Signed at |
| -------- | ------- | --------- |
| Security | PENDING | —         |
| Runtime  | PENDING | —         |
| Product  | PENDING | —         |

**Release Block 해제 조건:** 세 역할 모두 `verdict: APPROVE` + `signed_at` 기록 → Decision Log `DL-R11-SIGNOFF`.

## 1인 겸임 기록 (operator fill)

```yaml
concurrent_roles: true
operator_id: ''
security_signed_at: ''
runtime_signed_at: ''
product_signed_at: ''
min_session_gap_hours: 4
ai_verifier_pass: false
```

AI verifier는 Evidence URI 유효성만 검증 · 서명 대행 금지.
