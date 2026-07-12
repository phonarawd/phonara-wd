# Platform Evidence Retention (§45)

> **상태:** R0 고정 · **날짜:** 2026-07-13  
> **Playbook:** 1.0.0 · Finding `EXT-02`  
> **최소 보관:** **90일**

## Bucket 지정 (정본)

| 계층 | 경로 | 용도 | 바이너리 |
| --- | --- | --- | --- |
| **Primary (private)** | Supabase Storage bucket `platform-audit-evidence` · project `yocjhjsdwoijfdrehzoq` | Browser screenshot · HAR · SQL export · console dump | Yes · RLS private · service_role write |
| **Index (repo)** | [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/README.md) | SHA · URI · Finding id · timestamp · PR 링크만 | **No** (G12) |
| **CI** | GitHub Actions artifact (required job) | CI Result Evidence | CI retention 정책 따름 · URI를 Index에 기록 |
| **Forbidden** | repo root `/evidence` · chat-only · 로컬-only | — | FAIL |

### Provisioning 상태

| 항목 | 상태 | 비고 |
| --- | --- | --- |
| Bucket 이름 | **지정됨** `platform-audit-evidence` | R0 문서 고정 |
| Storage CREATE | **DONE** 2026-07-13 | MCP `execute_sql` INSERT · `public=false` · project `yocjhjsdwoijfdrehzoq` |
| Index 스캐폴드 | **DONE** 2026-07-13 | `PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/` |
| Retention policy | **90일** | supersede 시 구 Evidence도 90일 시계 유지 |

Storage bucket가 아직 물리 생성되지 않았어도 **경로 지정은 R0 Exit 충족**이다.  
Finding 마감 시 Primary URI가 없으면 해당 Finding은 `UNVERIFIED` 유지.

## Evidence 메타 (§22)

모든 Evidence 항목에 필수:

- `sha` (commit 또는 artifact digest)
- `timestamp`
- `pr`
- `finding_id`
- `uri` (Primary 또는 CI)

## 규칙

- 90일 미만 파기 정책 = Release Gate Block
- supersede 시 삭제 금지 · 새 SHA로 추가
- secret·`.env`·PII 본문 git/Index에 금지
