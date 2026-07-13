# Platform Auth — Test-like Account Triage (M-17)

> **Finding:** M-17 · **Stage:** R5 · **PII:** 본 문서·커밋에 이메일/이름 **금지** (aggregate만)

## 판정 기준

| 신호                                                                  | 의미               |
| --------------------------------------------------------------------- | ------------------ |
| email/display/full_name ~ `(test\|dummy\|seed\|example\|phonara+e2e)` | test-like **후보** |
| `last_sign_in_at IS NULL`                                             | 미로그인           |
| wallet 잔액 전부 0                                                    | 금융 history 없음  |
| sessions 0                                                            | 활성 세션 없음     |

**정상 계정 가능성** (이름에 test가 들어간 실사용자) → `VERIFIED_NOT_DEFECT` · **잠금/삭제 금지**.  
**순수 테스트** (미로그인 + 잔액 0 + 패턴 일치) → 세션 revoke → ban → (선택) 익명화. **원장/ledger row 삭제 금지**.

## Spotcheck SQL (aggregate only)

`scripts/platform-audit-r5-auth-test-like-spotcheck.sql`

## 2026-07-13 원격 probe (yocjhjsdwoijfdrehzoq)

| Metric                       | Value                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| total `auth.users`           | 12                                                                |
| test-like pattern            | **3**                                                             |
| never signed in              | **3**                                                             |
| nonzero wallet among flagged | **0**                                                             |
| sessions among flagged       | **0**                                                             |
| Remediation                  | `banned_until = 2099-01-01` applied to **3** (sessions deleted 0) |

## Operator 후속 (선택)

1. Admin Auth에서 신원 육안 확인 (채팅/Evidence에 PII 붙이지 말 것)
2. 정상 계정이면 ban 해제 + registry → `VERIFIED_NOT_DEFECT`
3. 순수 테스트면 익명화 또는 Auth Admin delete (원장 보존)

## 교차 참조

- Evidence: `docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R5/r5-admin-safety-implement.md`
- Spotcheck: `scripts/platform-audit-r5-auth-test-like-spotcheck.sql`
