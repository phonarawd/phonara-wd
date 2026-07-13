# Platform Disaster Recovery (§43)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> 앱 Rollback(§20) ≠ 인프라/데이터 DR.

## 목표 수치 (초안 · Owner 서명 대상)

| 항목            | 초안                                  | 비고                         |
| --------------- | ------------------------------------- | ---------------------------- |
| **RPO**         | 24h                                   | PITR/backup 창 · soft-launch |
| **RTO**         | 4h                                    | 서비스 복구 목표             |
| Backup 검증     | 로컬 dump restore Evidence 필수       | “설정됨”만으로 통과 금지     |
| Region Failover | ACCEPTED Risk (단일 리전 soft-launch) | Owner 서명·만료일            |

## Restore 검증 수단 (single-project lock)

운영 DB(`yocjhjsdwoijfdrehzoq`)에 직접 restore 리허설 **금지**. 타 Supabase 프로젝트 **금지**.

1. **로컬 Supabase 컨테이너에 backup dump restore** (Docker on-demand)
2. Supabase **PITR 가용성/시점 확인** Evidence (Management API · 실제 복원은 재해 시)
3. 부족 시 Owner 서명 ACCEPTED Risk

## ledger

append-only · conservation 깨는 임의 수정 **금지** · forward 절차만.

## 템플릿

```yaml
dr_id: DR-RESTORE-YYYYMMDD
method: local-dump # local-dump|pitr-check|accepted-risk
rpo_hours: 24
rto_hours: 4
result: PASS
evidence_uri: ''
signed_by: { sre: '', security: '' }
```
