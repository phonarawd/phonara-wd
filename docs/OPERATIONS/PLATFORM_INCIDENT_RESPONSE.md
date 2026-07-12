# Platform Incident Response (§42)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> Finding 수정 루프와 **사고 대응**을 분리한다.

## 등급

| 등급 | 정의 | 에스컬레이션 |
| --- | --- | --- |
| P0 | 원장/출금/인증 전면 장애 · Money Delta | Owner + Security + Runtime Immediate |
| P1 | 핵심 lane 부분 장애 · SLO 심각 위반 | Owner + Domain Owner |
| P2 | 비핵심 저하 · 우회 가능 | Domain Owner |

## 최초 대응 체크리스트 (P0/P1)

1. [ ] 영향 Domain · rail 식별
2. [ ] Feature flag OFF / kill switch / rail halt
3. [ ] Known Good SHA 후보 확인
4. [ ] Rollback Trigger hit 여부 기록
5. [ ] Decision Log + Risk/Finding 링크
6. [ ] 사용자 고지 필요 시 `/status` · 공지 (진실만)

## 커뮤니케이션

| 채널 | 대상 | 규칙 |
| --- | --- | --- |
| 내부 | operator / AI | Decision Log |
| 사용자 | 공개 status | false-green 금지 · C-02 정합 |
| 외부 | — | PII·잔액·UUID 비노출 |

## Rollback Trigger 연결

Trigger hit → Standing Grant로 “계속 수정” **금지** → Request Stop + Rollback Validation.  
Money Delta → 즉시 halt + Security.

## 사후

- Incident → Risk/Finding · 필요 시 ADR
- Blameless postmortem 템플릿:

```yaml
incident_id: INC-YYYYMMDD-01
severity: P0
timeline: []
root_cause: ""
customer_impact: ""
actions: []
follow_up_findings: []
signed_by: { security: "", sre: "", product: "" }
```

Release Gate: runbook + 최소 1회 tabletop Evidence 없으면 Block ([`PLATFORM_DRILL_CALENDAR.md`](PLATFORM_DRILL_CALENDAR.md)).
