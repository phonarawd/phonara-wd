# LOWSPEC Rules — 8GB Operator 치트시트 (redirect)

> **2026-07-16:** 본 파일은 여러 rule·SSOT·README에서 인용되던 경로를 복구한 **얇은 entrypoint**다.  
> 상세 규칙은 아래 정본만 따른다 — 본 문서에서 규칙을 재기술하지 않는다(drift 방지).

## 정본 (읽는 순서)

| 문서                                                                                                 | 역할                                                     |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`docs/SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)                                     | **Heavy gate authoritative = GitHub CI** · 로컬 L0~L4만  |
| [`docs/SSOT/OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md)                                           | 1페이지 게이트 entrypoint · hang 복구 · gate ladder 요약 |
| [`docs/SSOT/CURSOR_AUTOPILOT.md`](../SSOT/CURSOR_AUTOPILOT.md)                                       | Cursor 8GB 셋업 · 자연어 명령표 · `cursor:work-end`      |
| [`docs/OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md`](../OPERATIONS/PRE_LAUNCH_CHECKLIST_BEGINNER.md) | 출시 전 operator 체크리스트                              |

## 한 줄 계약 (8GB · non-waivable)

```text
로컬 = typecheck · lint · gate:ai-impl · 타겟 vitest  (Docker OFF 일상)
무거운 = test:sql · test:e2e · check:full  → GitHub Actions CI만 authoritative
렉 = cursor:status → cursor:emergency-reset · Docker 미사용 시 tray 종료
```

## 자연어 → 행동 (요약)

| operator 입력      | 행동                                                 |
| ------------------ | ---------------------------------------------------- |
| `구현해줘`         | 승인된 Plan 있을 때만 Implement                      |
| `CI 확인해줘`      | push 후 `bun run ci:status` / `ci:watch`             |
| `푸시 전 완벽하게` | rule `94-ci-push-fix-loop` · L0~L4 → push → CI green |
| `렉 걸린 것 같아`  | `cursor:env-doctor` · RAM <1024MB면 코드 작업 중단   |

상세: `.cursor/rules/89-beginner-autopilot.mdc` §9

## E2E/SQL on-demand

Docker는 **E2E/SQL pretest 때만** 자동 ON · 종료 후 `stack:stop`으로 OFF.  
Runbook: [`E2E-LOWSPEC-RUNBOOK.md`](E2E-LOWSPEC-RUNBOOK.md)
