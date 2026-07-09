# Cursor Autopilot (8GB operator)

> **목적:** AI가 **Run Everything** 모드로 클릭 없이 최대 자동 진행.  
> 자동화 상한: **~75–82%** (8GB RAM). hooks가 위험 명령(raw db push · .env 읽기)은 여전히 차단.

## 원클릭 셋업 (1회)

```powershell
bun run cursor:autopilot-setup
```

스크립트가 permissions · MCP · terminal auto-approve까지 적용.  
그다음 **Cursor 완전 종료**(트레이) → 재시작.

## UI만 수동 (Settings → Agents · 1회)

`Ctrl+Shift+J` → **Cursor Settings → Agents → Approvals & Execution**

| 항목                             | 값                                                  |
| -------------------------------- | --------------------------------------------------- |
| **Run Mode**                     | **Run Everything** (클릭 없이 Shell/MCP/Fetch 자동) |
| Background Agents (Cloud Agents) | **OFF**                                             |
| Max Context                      | **6k** (200k 금지)                                  |
| Inline Chat                      | **ON**                                              |

Settings → Tools & MCP → 프로젝트 **supabase** stdio **ON** (plugin-supabase **OFF**).

> **Run Everything = 구 YOLO.** `permissions.json`의 `approvalMode: "unrestricted"`와 쌍으로 동작.

## 자연어 명령표

| 입력                                          | AI 행동                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `오늘 작업 시작해줘`                          | preflight → env-doctor → active plan → **Plan만**                     |
| `구현해줘`                                    | 승인된 Plan 있을 때만 Implement                                       |
| `세션 끝내고 정리해줘`                        | `cursor:work-end` → check:hygiene · Docker OFF                        |
| `렉 걸린 것 같아`                             | env-doctor → purge/emergency-reset                                    |
| `상태만 알려줘`                               | cursor:status                                                         |
| `로컬 테스트 돌려줘` / `테스트 자동 수정해줘` | `@test-autopilot` 또는 `gate:local-autopilot` → 실패 시 자동 fix loop |
| `CI 확인해줘`                                 | push 후 `bun run ci:status` · `bun run ci:watch` (선택)               |
| `푸시 전 완벽하게` / `CI green까지`           | skill `ci-push-fix-loop` — L0~L4 → push → ci:watch → fix → re-push    |

## 자동화 스택 (repo)

| 계층        | 파일/명령                                            | 역할                                                                |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Hooks       | `.cursor/hooks.json`                                 | 세션 정리 · **after-heavy 자동 cleanup** · agent stop residue sweep |
| Cleanup     | `bun run cursor:work-end`                            | 작업/테스트 후 **AI 필수** — orphan · E2E · Docker OFF              |
| Permissions | `.cursor/permissions.json`                           | Auto-review allow/block · MCP·터미널 allowlist                      |
| Subagents   | `@gate-runner` `@verifier` `@security-auditor`       | 게이트 사다리 · 완료 검증 · 보안                                    |
| Skills      | `.cursor/skills/gate-ladder` · `ci-push-fix-loop` 등 | 에이전트 행동 가이드                                                |
| Rules       | `89-beginner-autopilot.mdc`                          | Plan→승인→Implement 강제                                            |
| Render      | `bun run cursor:render-fix`                          | argv.json RAM/GPU 계약                                              |

## 게이트 (8GB — 로컬 전체 테스트 · Cursor)

> **로컬 authoritative (operator 요청):** `gate:local-autopilot` · `@test-autopilot`  
> **CI (선택):** push → `ci:watch` — GitHub Actions

| 계층          | 명령                                     | agent 자율   | 비고                              |
| ------------- | ---------------------------------------- | ------------ | --------------------------------- |
| L0–L4         | typecheck · lint · gate:ai-impl · vitest | ✅           | Docker OFF                        |
| **로컬 전체** | `gate:local-autopilot`                   | ✅           | SQL+E2E 순차 · Docker on-demand   |
| **자동 수정** | `@test-autopilot`                        | ✅           | fail → fix → `--from=<step>` 루프 |
| L5–L7 (직접)  | test:sql · test:e2e                      | ❌ hook 차단 | orchestrator 경유만               |

**Operator 일상 (로컬):** `@test-autopilot` 또는 `bun run gate:local-autopilot` → green = DONE.

`gate:local-autopilot`는 spec 1개씩 · RAM 가드 · teardown 포함 — **렉 방지 정본**.

## 일상 유지

```powershell
bun run cursor:status          # orphan·포트·RAM (세션 1회)
bun run cursor:work-end        # 작업/테스트 후 자동 정리 (AI 필수)
bun run cursor:purge           # 렉 스파이크
bun run stack:stop             # Docker OFF (UI 작업 시)
```

## FAIL 신호

- RAM free **<1024MB** → 코드 작업 중단
- 무거운 gate **2개 동시** 실행
- Phase R UI 착수 without approved plan
- `supabase db push` (정본: `stack:push-remote`)

교차 참조: `.cursor/rules/87-cursor-agents-hub.mdc` · `89-beginner-autopilot.mdc` · [`OPERATOR_GATES.md`](OPERATOR_GATES.md) · [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)
