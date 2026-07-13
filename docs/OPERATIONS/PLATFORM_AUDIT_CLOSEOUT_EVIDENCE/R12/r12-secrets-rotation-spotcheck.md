# R12 — Secrets Rotation Spotcheck (operator)

> **Plan todo:** `audit-r12-post-release`  
> **Authority:** [`PLATFORM_SECRETS_ROTATION.md`](../../PLATFORM_SECRETS_ROTATION.md) §53  
> **YAML:** [`PLATFORM_SECRETS_ROTATION.yaml`](../../PLATFORM_SECRETS_ROTATION.yaml)

## Policy

| Field                               | Value      |
| ----------------------------------- | ---------- |
| Rotation policy                     | 90일       |
| RC anchor                           | 2026-07-13 |
| Default next due (if never rotated) | 2026-10-11 |

**비밀 값 본문 git/Evidence 금지** — 경로·마지막 rotation 시각·담당만.

## Secret inventory

| secret_id         | Location              | last_rotated_at | next_due_at | status           | OK  |
| ----------------- | --------------------- | --------------- | ----------- | ---------------- | --- |
| SEC-SERVICE-ROLE  | server-only · Edge/CI | _fill_          | 2026-10-11  | pending_operator | [ ] |
| SEC-ACCESS-TOKEN  | .env / Windows cred   | _fill_          | 2026-10-11  | pending_operator | [ ] |
| SEC-PROVIDER-KEYS | Edge secrets          | _fill_          | 2026-10-11  | pending_operator | [ ] |
| SEC-CI-TOKENS     | GitHub Secrets        | _fill_          | 2026-10-11  | pending_operator | [ ] |

## Browser exposure (R0 + R8 carryover)

```powershell
rg "SERVICE_ROLE|service_role" apps/web --glob "!**/*.test.*"
rg "VITE_.*SERVICE" apps/web
```

| Check                              | Result             | OK  |
| ---------------------------------- | ------------------ | --- |
| VITE\_ + service role pattern      | PENDING_OPERATOR   | [ ] |
| Browser bundle service role string | R8 parity re-check | [ ] |

## Sign-off (Security owner)

```yaml
spotcheck_id: SEC-SPOTCHECK-YYYYMMDD
checked_at: ''
overdue_count: 0
browser_exposure: pass # pass|fail|pending
result: PASS # PASS|FAIL
evidence_uri: docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-secrets-rotation-spotcheck.md
signed_by:
  security: { at: '' }
```

Rotation **기한 초과** = Risk High + Release Gate Block.
