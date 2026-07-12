# Platform Secrets / Key Rotation (§53)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> **비밀 본문 git/Evidence 금지** — 경로·마지막 rotation·담당만.

## 대상 (최소)

| 비밀 | 위치 | Rotation 주기 | RACI A | 긴급 revoke |
| --- | --- | --- | --- | --- |
| Supabase `SERVICE_ROLE` | server-only · Edge/CI | 90일 또는 유출 의심 시 즉시 | Security | Security 즉시 가능 |
| `SUPABASE_ACCESS_TOKEN` | `.env` / Windows cred | 90일 | Security | Security |
| Provider API keys | Edge secrets | 제공자 정책 ≤ 90일 | Security | Security |
| Kakao / analytics keys | Edge / server | 90일 | Security | Security |
| JWT / session secrets | Auth 설정 | Auth 정책 | Security | Security |
| CI tokens | GitHub Secrets | 90일 | Security | Security |

## R0 Evidence — SERVICE_ROLE 번들 비노출

| 검사 | 결과 |
| --- | --- |
| `VITE_` + service role 패턴 grep (apps/web) | **PENDING_OWNER** 재확인 권장 · 규칙상 `VITE_`에 SERVICE_ROLE **금지** |
| Browser bundle에 service role 문자열 | R8 parity에서 Evidence 재수집 |
| 본문 커밋 | **0** (본 문서에 값 없음) |

## 템플릿

```yaml
secret_id: SEC-SERVICE-ROLE
last_rotated_at: ""
next_due_at: ""
owner: security
status: CURRENT # CURRENT|DUE|OVERDUE|REVOKED
evidence_uri: "" # 경로·시각만 · 값 금지
```

Rotation 기한 초과 = Risk High + Release Gate Block.  
유출 의심 시 Exception 없이도 Security Owner가 즉시 revoke 가능.
