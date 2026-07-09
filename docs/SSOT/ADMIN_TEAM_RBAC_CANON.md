# Admin Team RBAC Canon (33차)

> **상태:** Plan §29.5 · §32.6 흡수 (2026-07-05)  
> **Authority:** [`phase_r_super-app_8bdf2c10`](../../.cursor/plans/phase_r_super-app_8bdf2c10.plan.md) · [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md) §2  
> **엔진:** `rpc_admin_set_role_grant` · server RPC/RLS = **정본** (UI hide만 = FAIL)  
> **UI todo:** `p13-prep-admin-team-desk` → `/admin/team`

1인 operator로 시작해 **직원이 늘어나도** 메뉴·권한을 초등어로 나누는 정본입니다.

---

## 1. 역할 5종 (초등어 설명)

| 역할 (en) | operator에게 보이는 이름 | 한 줄 설명                    |
| --------- | ------------------------ | ----------------------------- |
| `owner`   | 주인                     | 모든 메뉴 + 직원 권한 주기    |
| `finance` | 돈 담당                  | 입금·출금·처리 기록만         |
| `risk`    | 이상 거래 담당           | 이상 거래·회원·스포츠 정산    |
| `support` | 고객 담당                | 회원 문의·회원 찾기(읽기)     |
| `viewer`  | 보기만                   | 오늘 할 일·시스템 상태 숫자만 |

---

## 2. 역할별 메뉴 allowlist

| 메뉴 (초등어) | owner | finance | risk | support | viewer |
| ------------- | :---: | :-----: | :--: | :-----: | :----: |
| 오늘 할 일    |   ✓   |    ✓    |  ✓   |    ✓    |   ✓    |
| 처리 대기함   |   ✓   |    ✓    |  ✓   |    ✓    |   —    |
| 입금 확인     |   ✓   |    ✓    |  —   |    —    |   —    |
| 출금 보내기   |   ✓   |    ✓    |  —   |    —    |   —    |
| 스포츠 정산   |   ✓   |    —    |  ✓   |    —    |   —    |
| 회원          |   ✓   |    —    |  ✓   | ✓(읽기) |   —    |
| 이상 거래     |   ✓   |    —    |  ✓   |    —    |   —    |
| 부업·추천     |   ✓   |    —    |  —   |    —    |   —    |
| 등급 현황     |   ✓   |    —    |  ✓   |    —    |   —    |
| 처리 기록     |   ✓   |    ✓    |  —   |    —    |   —    |
| 설정          |   ✓   |    —    |  —   |    —    |   —    |
| 시스템 상태   |   ✓   |    ✓    |  ✓   |    —    |   ✓    |
| 직원 권한     |   ✓   |    —    |  —   |    —    |   —    |
| 회원 문의     |   ✓   |    —    |  —   |    ✓    |   —    |

**규칙:** 표에 없는 메뉴 = **nav 미노출** + **RPC 거부** 둘 다 필수.

---

## 3. `/admin/team` 화면 계약

| 요소 | 계약                                                      |
| ---- | --------------------------------------------------------- |
| 목록 | 직원 이메일 · 역할(초등어) · 마지막 로그인                |
| 부여 | 역할 선택 드롭다운 = §1 표 5종만 · R3 모달 + 사유         |
| 해제 | 「권한 빼기」 · R3                                        |
| 접근 | **owner만** nav 노출 · 타 역할 URL 직접 입력 시 forbidden |

Settings(`/admin/settings`)에 있던 권한 부여는 **team 데스크로 이동** — settings에는 「직원 권한 관리로 가기」 링크만.

---

## 4. 감사·보내기

| 기능                        | 역할                   | todo                            |
| --------------------------- | ---------------------- | ------------------------------- |
| 처리 기록 보기              | owner · finance · risk | P2                              |
| 처리 기록 파일로 받기 (CSV) | owner · finance        | `ew-e6-page-admin-audit-export` |

---

## 5. 완료 신호

- [ ] viewer가 `rpc_approve_withdrawal` 호출 시 서버 거부 E2E/SQL
- [ ] finance가 `/admin/team` nav 미노출
- [ ] 모든 role grant → audit row + 사유

---

## 교차 참조

- [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](ADMIN_BEGINNER_LANGUAGE_CANON.md)
- [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md)
- Plan §29.5 역할 표 · `p13-prep-admin-team-desk`
