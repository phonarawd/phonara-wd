# Platform Release Freeze (§44)

> **상태:** **ACTIVE** · **RC SHA:** `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`  
> **시작:** 2026-07-13T09:00:00+09:00 · **Plan todo:** `audit-r11-closeout`  
> **기계 정본:** [`PLATFORM_RELEASE_FREEZE.yaml`](PLATFORM_RELEASE_FREEZE.yaml)

## Freeze 규칙

RC(Release Candidate) SHA 선언 이후 **Critical Fix 외 변경 금지**.

### 금지

- 디자인 수정 · 리팩토링 · 번역/i18n polish (Critical 사용자 오해 수정만 Owner 예외)
- 기능 추가 · UX polish
- 「김에」 hygiene · format · rename

### 허용

- Critical Finding / P0 Incident 최소 Fix
- Rollback · Feature Flag OFF · Kill switch
- Evidence/Registry 상태 갱신 (코드 변경 없음)

**위반 시:** 해당 PR은 Release 경로에서 제외 · 새 RC SHA 재산정 · Freeze 재시작.

## 현재 RC

| 항목              | 값                                              |
| ----------------- | ----------------------------------------------- |
| RC SHA            | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`      |
| Known Good SHA    | `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`      |
| Deploy parity     | remote green (R9)                               |
| Freeze            | **ACTIVE**                                      |
| Release candidate | **BLOCKED** (operator: soak-24h · 3-Owner · DR · R9-PERF-JS **VERIFIED_FIXED** 2026-07-14) |

## Standing Grant 축소

Freeze 중 Standing Grant는 **Critical Fix만** 허용한다.  
[`PLATFORM_STANDING_GRANT.md`](PLATFORM_STANDING_GRANT.md) · rule `94-ci-push-fix-loop`.

## 해제 조건

1. 3-Owner Sign-off 완료 (§46)
2. Release Gate §24 전항 green 또는 documented waiver
3. R12 Post Release Review 7d green 후 Product Owner(A) 결정 (§48)

## 교차 참조

- Evidence Retention: [`PLATFORM_EVIDENCE_RETENTION.md`](PLATFORM_EVIDENCE_RETENTION.md)
- 3-Owner: [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-3-owner-signoff-template.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-3-owner-signoff-template.md)
- Post-Review: [`PLATFORM_POST_RELEASE_REVIEW.md`](PLATFORM_POST_RELEASE_REVIEW.md)
- Closeout Evidence: [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-closeout-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-closeout-implement.md)
