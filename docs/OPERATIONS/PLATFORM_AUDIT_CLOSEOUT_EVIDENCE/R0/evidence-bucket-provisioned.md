# R0 — Evidence bucket provisioned

> **Finding:** `EXT-02`  
> **Date:** 2026-07-13T00:40:00+09:00  
> **SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`  
> **type:** sql

## Result

| 항목      | 값                                                                                      |
| --------- | --------------------------------------------------------------------------------------- |
| bucket id | `platform-audit-evidence`                                                               |
| public    | `false`                                                                                 |
| project   | `yocjhjsdwoijfdrehzoq`                                                                  |
| method    | Supabase MCP `execute_sql` INSERT into `storage.buckets`                                |
| verify    | `SELECT id,name,public FROM storage.buckets WHERE id='platform-audit-evidence'` → 1 row |

Index: [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/`](../README.md) · Retention: [`PLATFORM_EVIDENCE_RETENTION.md`](../../PLATFORM_EVIDENCE_RETENTION.md)
