# Platform Standing Grant (§31) — R0 고정

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> ACTIVE_WORK_SSOT 교차: Platform Perfect Launch Remediation

## 활성 전제 (전부 충족)

- [x] 본 Playbook Plan이 Owner에게 승인됨 (2026-07-13 operator chat)
- [x] Finding이 registry에 존재하고 `APPROVED_FOR_IMPLEMENT` | `IN_PROGRESS` | `VERIFYING` (R1 Finding 배치 시)
- [x] `blocked_by`가 모두 CLOSED/VERIFIED_* (R0 baseline · R1 Finding 개별 확인)
- [x] Domain · Stage · Execution Budget · Scope Lock 준수
- [x] 신규 migration 파일 추가가 **아닌** 변경 (R1 UI 범위)
- [x] No Assumption 확인 로그가 Investigate Evidence에 존재 (R0 probe/bucket)
- [x] Release Freeze 중이 아님 (Freeze 중이면 Critical Fix만)

## Standing Grant 내 자동 허용

Investigate → Implement → Verify · commit · feature-branch push · PR · CI 재시도(≤5) · Registry/SSOT/Decision Log/Closeout 링크 갱신

## Owner 재승인 필수

Domain 변경 · Migration/RLS/GRANT/`stack:push-remote` · Scope 확대 · Release/Production · Standing Grant 자체 변경 · `VERIFIED_NOT_DEFECT`/`VERIFIED_GATED` · `main` merge · lockfile 변경

## No Assumption (§37)

파일/RPC/migration/provider/flag/`blocked_by`를 증거 없이 가정하지 않는다.
