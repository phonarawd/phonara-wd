---
name: session-cleanup
description: Automatic post-work cleanup for 8GB PC — orphans, E2E residue, port conflicts, Docker OFF. AI MUST run after tests or implementation sessions.
---

# Session Cleanup (자동 정리 · 렉 방지)

> **Operator intent:** 작업/테스트 끝나면 AI가 자동으로 Cursor를 가볍게 유지.

## 정본 명령 (1줄)

```powershell
bun run cursor:work-end
```

## 무엇을 정리하나

| 항목          | 동작                                               |
| ------------- | -------------------------------------------------- |
| 고아 프로세스 | vitest · playwright · vite orphan kill             |
| E2E 포트      | 3000 · 3001 · 3002 LISTEN 해제                     |
| 잔재 파일     | test-results/ · playwright-report/ · E2E auth 토큰 |
| Docker        | stack:stop → Desktop quit (WSL RAM 해제)           |
| 검증          | check:hygiene green 확인                           |

## AI가 **반드시** 실행하는 시점

1. `gate:local-autopilot` 종료 후 (성공/실패 무관)
2. `@test-autopilot` 각 fix iteration 후
3. `gate:ai-impl` 마감 후
4. operator 「세션 끝내고 정리해줘」
5. E2E/SQL/build/check 직후 — **hook 자동** (`afterShellExecution`)

## 자동화 스택 (hook · 별도 명령 불필요)

| 트리거                 | 동작                                              |
| ---------------------- | ------------------------------------------------- |
| `afterShellExecution`  | test/build/e2e/gate 후 `cursor:after-heavy-shell` |
| `stop` (agent 턴 종료) | residue/포트 있으면 agent-stop + stack:stop       |
| `sessionStart`         | orphan · 포트 · residue 선제 정리                 |

## 렉 스파이크 시 (수동 1회)

```powershell
bun run cursor:purge          # 전체 purge
bun run cursor:emergency-reset # repo-only 긴급
```

## Never

- 테스트 후 cleanup 스킵 (G12 위반)
- Docker Desktop 상시 ON 방치
- hung E2E 후 새 터미널에서 재시작 (G4)

Reference: `.cursor/rules/78-cursor-auto-hygiene.mdc` · `83-session-purge-contract.mdc`
