# CI Gate Authority — 저사양 Operator 정본 (2026-07-06)

> **목적:** operator PC(8GB · Windows)에서는 **무거운 게이트를 로컬에서 돌리지 않는다.**  
> **Authoritative red/green = GitHub Actions.** 로컬 heavy 결과는 advisory만.  
> **규칙 정본:** `.cursor/rules/80-absolute-gate-prohibitions.mdc` (G13) · `79-low-spec-pc.mdc`  
> **1페이지 entrypoint:** [`OPERATOR_GATES.md`](OPERATOR_GATES.md)

---

## 한 줄 계약 (non-waivable)

```text
로컬 = L0~L4 (lightweight) + gate:ai-impl
무거운 검증 (SQL · E2E · check:full) = GitHub push/PR → CI green 확인
로컬 E2E/SQL red/green으로 DONE 주장 금지 · CI red면 다음 작업 중단
```

| 주체                       | L5~L8 (heavy)                         | 판정                       |
| -------------------------- | ------------------------------------- | -------------------------- |
| **Agent (자율)**           | **실행 금지** (G13)                   | —                          |
| **Operator PC (일상)**     | **실행 안 함** — CI에 위임            | CI green = Verified        |
| **Operator 「gate 실행」** | 단일 spec/SQL **1회** advisory (선택) | CI와 불일치 시 **CI 우선** |
| **GitHub Actions CI**      | push `main` · PR마다 자동             | **authoritative**          |

---

## Operator 표준 워크플로 (매 세션)

### 1. 로컬 (Cursor · Docker OFF)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
bun run cursor:env-doctor          # RAM <1024MB → 코드 작업 중단
# 구현 마감 (surface 1개):
bun run gate:ai-impl -- --test <owner-vitest-path>
```

**로컬에서 항상 OK:** `typecheck` · `lint` · `check:i18n` · `check:release` · `check:hygiene` · `check:ui-architecture` · 타겟 vitest · `gate:ai-impl`

**로컬에서 일상적으로 하지 않음:** `test:e2e*` · `test:sql` · `supabase db reset` · `check:full` · Docker Desktop 상시 ON

### 2. Push → CI

```powershell
git push origin <branch>
# 또는 PR 생성 → main merge 전 CI green 확인
```

GitHub: **Actions** 탭 → workflow **CI** → 아래 job 전부 green.

### 3. CI green 확인 후에만

- Plan YAML todo → `completed`
- §AI Todo Sync → **`[x] DONE`** (heavy gate 해당 시)
- operator에게 "Verified" 보고

### 4. CI red 시 — push-fix loop

> **Agent 자율 루프 정본:** `.cursor/rules/94-ci-push-fix-loop.mdc` · skill `.cursor/skills/ci-push-fix-loop`

1. `bun run ci:watch` 또는 `gh run view <id> --log-failed` — **실패 job·step·artifact** 수집
2. 로컬 **L0~L4만** batch-fix (`typecheck` · `lint` · `format:check` · `gate:ai-impl` · 타겟 vitest)
3. **commit → push** → `ci:watch` 재실행
4. required 4 job green 전 **Verified/DONE 주장 금지**
5. 로컬 `test:e2e` / `test:sql` 반복 **금지** (G3 · G13)

**Artifact 예:** sql types drift → `gh run download <id> -n database-types-ci-expected`

**Advisory red** (`e2e-browser-matrix` 등) — merge 차단 아님 · operator에만 언급

**루프 상한:** fix-push **5회** — 초과 시 flake/scope operator 에스컬레이션

---

## GitHub Actions — 자동 실행 매트릭스

**파일:** `.github/workflows/ci.yml`  
**트리거:** `push` to `main` · 모든 `pull_request`

| Job                    | 이름                                            | 실행 내용                                                                                                                                                                                                                                                       | Operator PC 대체                                                           |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **quality**            | typecheck / lint / test / build                 | `check:env` · `check:secrets-deploy-deny` · `check:hygiene` · `check:i18n` · `check:release` · `check:migrations` · `typecheck` · `lint` · `format:check`(**blocking**) · `test:deno:edge-shared`(Deno `_shared`) · `test`(vitest 전체) · `build` · `check:pwa` | 로컬 `gate:ai-impl` + 선택적 `typecheck` · `bun run test:deno:edge-shared` |
| **advisors**           | supabase security advisors                      | `check:advisors` — remote **0 ERROR** (secret 있을 때)                                                                                                                                                                                                          | migration/RPC touch 후 CI 또는 `stack:push-remote` 뒤 확인                 |
| **sql**                | supabase db reset + SQL tests                   | `supabase start` → `db reset` → `check:guard-coverage` → `test:sql` 103/103 · `casino-sql-parity` · Σ=0                                                                                                                                                         | **로컬 SQL 불필요** — CI가 authoritative                                   |
| **e2e**                | playwright e2e                                  | `supabase start` → `db reset` → `playwright install chromium` → `bun run test:e2e -- --workers=1`                                                                                                                                                               | **로컬 E2E 불필요** — CI가 authoritative                                   |
| **e2e-browser-matrix** | playwright trade-desk browser matrix (advisory) | `firefox` + `webkit` · `trade-desk-smoke` subset E1/E8/E9 · `continue-on-error: true`                                                                                                                                                                           | **optional** — merge 차단 아님                                             |

### E2E job 상세 (CI authoritative)

`bun run test:e2e` wrapper(`scripts/run-e2e.ts`)가 `PHONARA_E2E_ACTIVE=1` 설정 → **full suite**:

| Spec                                 | 테스트 수 | 검증                                                           |
| ------------------------------------ | --------- | -------------------------------------------------------------- |
| `tests/e2e/wallet-d3.spec.ts`        | 6         | KRW 입출금 · ledger · **DB Σ=0 conservation**                  |
| `tests/e2e/admin.spec.ts`            | 4         | auth · MFA · forbidden · policy desk                           |
| `tests/e2e/trade-desk-smoke.spec.ts` | 13        | spot/futures/staking money · toast · oracle stale · **DB Σ=0** |
| `tests/e2e/casino-dice.spec.ts`      | 3         | dice shell · PF verifyRound · **DB Σ=0** · idempotency         |
| `tests/e2e/sports-betting.spec.ts`   | 3         | prematch slip place · settle · RPC idempotency · **DB Σ=0**    |
| `tests/e2e/staking-hub.spec.ts`      | 2         | staking wizard mount · PHON stake · **DB Σ=0**                 |
| `tests/e2e/referral-hub.spec.ts`     | 3         | `/referral` code · copy controls · invite share card           |
| `tests/smoke/web.spec.ts`            | 5         | boot · PWA assets · guest surface                              |
| **합계**                             | **39**    | local Supabase + Chromium · ubuntu-latest                      |

**Browser matrix (P3-D · advisory job `e2e-browser-matrix`):**

| Spec subset                     | Engines          | Tests                                                 |
| ------------------------------- | ---------------- | ----------------------------------------------------- |
| `trade-desk-smoke` E1 · E8 · E9 | firefox · webkit | 3 × 2 = **6** · render + gate UI · no full money path |

Chromium authoritative gate = job `e2e` only. Browser matrix red does **not** block merge (`continue-on-error: true`).

실패 시 artifact: `playwright-report/` · `test-results/` (7일 보관).

### CI에 **없는** gate (migration touch 시)

| 명령                        | 주체             | 비고                                                           |
| --------------------------- | ---------------- | -------------------------------------------------------------- |
| `bun run stack:push-remote` | agent/operator   | Management API — Docker 불필요 · **원격 migration apply 정본** |
| `bun run check:full`        | operator/CI 수동 | RC 직전 1회 — workflow에 미포함                                |

migration/RPC 변경 후: **CI `sql` + `advisors` green** → **`stack:push-remote`** (로컬 또는 agent) → advisor 0 재확인.

---

## 게이트 사다리 — 로컬 vs CI (L0~L9)

| L           | 게이트                                        | 로컬 (8GB 일상)                      | CI job               |
| ----------- | --------------------------------------------- | ------------------------------------ | -------------------- |
| L0          | `cursor:status` · `check:hygiene`             | ✅ agent/operator                    | quality (hygiene)    |
| L1          | `typecheck` · `check:i18n` · `check:release`  | ✅                                   | quality              |
| L2          | `lint`                                        | ✅                                   | quality              |
| L3          | 타겟 vitest                                   | ✅                                   | quality (`test`)     |
| **AI impl** | `gate:ai-impl -- --test <path>`               | ✅ **Implemented 정본**              | —                    |
| L4          | full vitest                                   | 선택 (영향 넓을 때)                  | quality              |
| L5          | `db reset` → `test:sql` → `stack:push-remote` | ❌ **CI 위임** · remote apply만 별도 | **sql** (+ advisors) |
| L6          | 타겟 E2E spec                                 | ❌ **CI 위임**                       | **e2e** (full)       |
| L7          | full `test:e2e`                               | ❌ **CI 위임**                       | **e2e**              |
| L8          | `check:full`                                  | ❌ RC/operator 1회                   | — (미포함)           |
| L9          | doc closeout (`82`)                           | ✅ CI green **후**                   | —                    |

---

## 완료 판정 (Implemented vs Verified)

| 단계                         | 조건                                                          | 문서 표기          |
| ---------------------------- | ------------------------------------------------------------- | ------------------ |
| **Implemented**              | 로컬 `gate:ai-impl` green                                     | `[x] impl partial` |
| **Verified (money/E2E/SQL)** | **CI** `sql` + `e2e` green (해당 변경 시)                     | `[x] DONE` 가능    |
| **Verified (migration)**     | CI `sql` + `advisors` green + `stack:push-remote` + advisor 0 | migration closeout |

**FAIL:** 로컬에서 E2E/SQL 돌리지 않았는데 "E2E green" 주장 · CI red인데 DONE · agent가 L5~L8 자율 실행.

---

## Docker / RAM (로컬)

- **일상 UI·typecheck:** Docker Desktop **OFF** (`84-docker-on-demand.mdc`)
- **로컬 E2E/SQL 안 함** → Docker cold boot **불필요**
- CI runner(ubuntu)가 Supabase + Playwright stack 기동

---

## CI 상태 확인 (operator)

```powershell
# 브랜치 push 후
bun run ci:status
# gh CLI (선택)
gh run list --workflow=ci.yml --limit 5
gh run watch
gh run view <run-id> --log-failed
```

GitHub UI: Repository → **Actions** → **CI** → 최근 run → job별 green/red.

PR merge 전: **required checks** 전부 green (quality · sql · e2e · advisors).

---

## Agent / AI 행동 (요약)

1. **절대** 로컬 `test:e2e` · `test:sql` · `check:full` · `gate:phase-r` · `supabase db reset` 자율 실행 금지 (G13)
2. **자동 차단:** `.cursor/hooks/agent-heavy-gate-deny.ts` + `.cursor/permissions.json` block_instructions
3. 구현 마감: `gate:ai-impl -- --test <path>` 만
4. push 후: `bun run ci:status` 또는 GitHub Actions UI — **CI green 전 Verified/DONE 주장 금지**
5. CI red 로그 기반으로 **코드 수정 + L0~L4** 만 — 로컬 heavy retry 금지
6. Operator 「gate 실행」1회만: `PHONARA_ALLOW_LOCAL_HEAVY_GATE=1` 환경변수 후 단일 spec/SQL

### 자동화 스택 (에이전트 heavy gate)

| 계층        | 파일                                     | 역할                                                                            |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Hook        | `.cursor/hooks/agent-heavy-gate-deny.ts` | `beforeShellExecution` — test:e2e/sql/check:full/gate:phase-r/db reset **deny** |
| Guard lib   | `scripts/lib/agent-heavy-gate-guard.ts`  | 패턴 매칭 · override `PHONARA_ALLOW_LOCAL_HEAVY_GATE=1`                         |
| Permissions | `.cursor/permissions.json`               | autoRun **block** heavy gate allow 제거                                         |
| CI hint     | `bun run ci:status`                      | push 후 Actions URL · optional `gh run list`                                    |
| Subagent    | `.cursor/agents/gate-runner.md`          | L0~L4 + push→CI only                                                            |
| Entry       | `AGENTS.md` § AI MUST NOT                | 에이전트 1페이지 계약                                                           |

---

## 교차 참조

| 문서                                                          | 역할                                     |
| ------------------------------------------------------------- | ---------------------------------------- |
| [`OPERATOR_GATES.md`](OPERATOR_GATES.md)                      | 1페이지 entrypoint                       |
| [`E2E-LOWSPEC-RUNBOOK.md`](../rebuild/E2E-LOWSPEC-RUNBOOK.md) | E2E 명령·teardown (로컬 「gate 실행」용) |
| [`QUALITY_GATES.md`](../QUALITY_GATES.md)                     | Implemented / Verified lifecycle         |
| [`LOWSPEC_RULES.md`](../rebuild/LOWSPEC_RULES.md)             | 8GB 치트시트                             |
| [`CURSOR_AUTOPILOT.md`](CURSOR_AUTOPILOT.md)                  | autopilot 설정                           |
| `.github/workflows/ci.yml`                                    | CI 구현 정본                             |
