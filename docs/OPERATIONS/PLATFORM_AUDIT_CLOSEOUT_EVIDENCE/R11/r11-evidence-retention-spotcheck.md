# R11 — Evidence Retention 90일 Spotcheck (§45)

> **Date:** 2026-07-13 · **Finding:** EXT-02 · **RC SHA:** `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`

## Bucket (Primary)

| Check            | Result                    | Evidence                                                                    |
| ---------------- | ------------------------- | --------------------------------------------------------------------------- |
| Bucket name      | `platform-audit-evidence` | [`R0/evidence-bucket-provisioned.md`](../R0/evidence-bucket-provisioned.md) |
| Project lock     | `yocjhjsdwoijfdrehzoq`    | rule 20-supabase-safety                                                     |
| Public           | `false`                   | private RLS                                                                 |
| Retention policy | **90일**                  | [`PLATFORM_EVIDENCE_RETENTION.md`](../../PLATFORM_EVIDENCE_RETENTION.md)    |
| CREATE verified  | 2026-07-13                | MCP execute_sql 1 row                                                       |

## Index (repo — no binaries)

| Layer       | Path                                        | Status                |
| ----------- | ------------------------------------------- | --------------------- |
| Stage index | `PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0`–`R11` | **YES**               |
| Finding URI | YAML `evidence[].uri`                       | **YES** (38 findings) |
| CI artifact | GitHub Actions required 4                   | URI in closeout docs  |
| Forbidden   | repo root `/evidence` · chat-only           | **0**                 |

## Required evidence types (§45)

| Type                   | Index example                   | Primary bucket   |
| ---------------------- | ------------------------------- | ---------------- |
| Browser screenshot/MCP | `R1/r1-stage1-browser.md`       | optional upload  |
| SQL result             | `R3/r3a-*.md`                   | optional upload  |
| Runtime log            | `R4/r4-market-ops-implement.md` | optional upload  |
| CI artifact            | Decision Log CI runs            | GitHub retention |
| HAR/Console            | R9 stage matrices               | optional upload  |

**규칙:** supersede 시 삭제 금지 · 90일 시계 유지 · secret/PII git 금지.

## Spotcheck verdict

| Criterion                               | Status   |
| --------------------------------------- | -------- |
| Bucket 지정 + CREATE                    | **PASS** |
| Index scaffold R0–R11                   | **PASS** |
| 90일 policy documented                  | **PASS** |
| All closeout Evidence has SHA+timestamp | **PASS** |

**§45 Release Gate:** **PASS** (경로 확보 · operator ongoing upload to Primary bucket 권고).
