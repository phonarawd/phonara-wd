# PHONARA Quality Gates

Every implementation task must pass the relevant quality gates before completion.

## Required Gates

- TypeScript strict mode.
- ESLint.
- Prettier format check.
- Unit tests for domain logic.
- Playwright smoke/E2E for critical user flows. E2E is mandatory for auth,
  wallet, rewards, spot/futures, staking, casino, deposits, withdrawals, admin,
  permissions, PWA, i18n mode switching, and mobile-shell flows.
- Env validation.
- i18n hardcoded Korean detection.
- **`check:ui-architecture`** — IA/셸 중복 (parallel hub URL, stacked chrome, semantic export dup). Consolidation C5: `--strict` green. See `88-ui-consolidation-wave`.
- Test artifact cleanup.
- **Work doc closeout (non-waivable):** Step/Phase/하위 항목 마감 시
  `82-work-doc-closeout-sync` — `CURRENT_STATUS.md` §AI Todo Sync · roadmap · Plan
  YAML `[x]`/`[ ]` 동기화. 미갱신 = FAIL (코드·게이트 green만으로 완료 아님).

## Domain Gates

- Money code: Decimal-based tests.
- Ledger code: idempotency, available/locked balance, reversal tests.
- Supabase code: RLS positive and negative tests.
- Supabase advisor: local/remote security advisor must report **0 ERROR** before
  any DB-facing task is considered complete.
- **Remote migration apply (정본):** after local `supabase db reset` + `bun run
test:sql` green → **`bun run stack:push-remote`** → remote advisor 0 ERROR.
  Operator 수동 `supabase link` / `db push` 사용 금지. See `96-prod-apply-agent-deny`. `authenticated_security_definer_function_executable`
  WARNs are acceptable only when the function is an intentional client-facing
  `rpc_*` wrapper with an internal `auth.uid()` or `_is_admin()` guard; document
  the WARN count and rationale in the Build Log instead of treating WARNs as
  green by assumption.
- Admin code: permission and audit log tests.
- PWA code: manifest/service worker smoke tests.
- Money E2E: run real browser flows against the local Supabase stack and assert
  database invariants, including per-currency conservation across user wallets
  and system accounts, idempotency, hash-chain integrity when relevant, and no
  durable test residue.
- Security/Admin E2E: prove both positive and negative authorization through the
  server-trusted RPC/RLS path, not only hidden UI controls.
- Casino E2E: prove bet placement, settlement, provably-fair seed reveal/hash
  verification, client-side outcome recomputation, tamper/duplicate rejection,
  and ledger conservation.

## P0 Edge Contracts closeout — `[x] DONE` (2026-07-03)

High-risk external orchestration paths. DB migration alone is **not** sufficient — Edge deploy required.

| Layer        | Artifact                                                                                      | Gate                                  |
| ------------ | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| DB           | `p0_edge_contracts_claim_webhook` migration · `p0_edge_contracts_test.sql`                    | L5: `test:sql` (operator/CI)          |
| Edge deploy  | `notification-dispatch` · `crypto-withdraw-broadcast` · `pg-bank-webhook` (`--no-verify-jwt`) | CLI deploy after code change          |
| Remote smoke | `scripts/verify-worldno1-edge-functions.ts`                                                   | `bun run stack:verify-worldno1-edge`  |
| PG HMAC      | `scripts/smoke-pg-webhook-hmac.ts`                                                            | `bun run stack:smoke-pg-webhook-hmac` |

Evidence SSOT: [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md) — Phase별 evidence report `.md` + forensic addendum은 2026-07-04 워킹트리에서 삭제 (원문 git history · 파일명 = closeout Phase 매트릭스).

## Closed Beta / prod money rehearsal — `[x] prep DONE` · rehearsal DEFERRED (2026-07-03)

Prod real-money rehearsal is **not** an autonomous agent gate. Operator must explicitly approve before any prod deposit/withdraw/stake rehearsal.

| Layer               | Artifact                                                                         | Gate                                                  |
| ------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Scenario matrix     | [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) | CB-01~06 → existing SQL/E2E files                     |
| Readiness inventory | `closed_beta_readiness_test.sql`                                                 | L5: **99/99** `test:sql` green (2026-07-03 Post-Apex) |
| Prod rehearsal      | operator allowlist · currency caps · 「Closed Beta gate 실행」                   | **Blocked until operator approval**                   |

Evidence: `ENGINE_PHASE6_CLOSED_BETA_READINESS_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history)

## Engine Apex Phase 8 — Final Gates — `[x] DONE` (2026-07-03)

PrimeForge Engine Apex Plan 최종 완료 판정. Phase 8 시점 검증 스냅샷 — **정본 gate는 Post-Apex 99/99**.

| Gate             | Phase 8     | Post-Apex (정본) |
| ---------------- | ----------- | ---------------- |
| `typecheck`      | green       | green            |
| Package unit     | **275/275** | **275/275**      |
| `test:sql`       | 97/97       | **99/99**        |
| Migration parity | 190/190     | **191/191**      |
| `check:advisors` | 0 ERROR     | 0 ERROR          |

> **현재 디스크 (2026-07-24):** migration lock parity **248/248** (`check:migrations`) — 위 190/191은 Apex 스냅샷.

Evidence: `ENGINE_PHASE8_FINAL_GATES_EVIDENCE_REPORT.md` · Post-Apex `ENGINE_POST_APEX_P1_P2_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history)

## Engine Apex — `[x] FULLY CLOSED` (2026-07-03)

**엔진 구현 큐 0.** 돈·원장·Edge·권한·관측성·Post-Apex hardening 완료. 이후 큐: Phase D Demolition · operator Closed Beta · Phase R UI.

Master: [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md) · 감사 `ENGINE_STATE_AUDIT_2026-07-03.md` (2026-07-04 삭제 — git history)

## E2E Levels

- Smoke E2E: app boots, auth screen/routes/navigation render.
- Feature E2E: the changed feature's happy path plus one realistic failure path.
- Money E2E: success + failure + database conservation/idempotency assertions.
- Security E2E: allowed role succeeds, unauthorized role fails, audit exists when
  the action is manual or high-risk.
- Full Phase E2E: all critical journeys for the phase. Required before a phase is
  called complete or launch-ready.

## Current E2E Matrix

**저사양 실행·명령·teardown:** [`docs/rebuild/E2E-LOWSPEC-RUNBOOK.md`](rebuild/E2E-LOWSPEC-RUNBOOK.md)

This matrix is the current local browser coverage map. Extend the listed spec
when a behavior belongs to an existing domain; create a new spec only when the
domain or invariant is not already represented.

- Auth/session/mobile shell: `global-setup.ts` provisions real local Supabase
  users and sessions; `visual.spec.ts` covers login plus authenticated route
  rendering; `admin.spec.ts` covers admin login, allowed admin access, and
  regular-user denial. Success: real session injection and route render.
  Failure: non-admin blocked from admin app.
- Wallet, deposits, withdrawals, and KYC: `phase5-wave9.spec.ts` covers KYC
  lock, withdrawal pause, withdrawal confirmation/cancel/double-submit, frozen
  account browse-only UX, KYC submission to admin approval, and KRW deposit
  request plus bank auto-match. Invariants: deposit PHON conservation,
  withdrawal request no-RPC-before-confirm, and single RPC on double confirm.
- Trading and staking money flows: `core-flow.spec.ts` covers spot buy, futures
  open/close, staking, reward claim, confirm cancel, OI cap rejection, leverage
  rejection, and conservation. `funnel.spec.ts` covers signup, welcome bonus,
  futures open, and liquidation. `funnel-fullflow.spec.ts` (Phase B4) covers
  green-only signup → KRW deposit → admin match → dice bet → withdraw with Σ=0
  at each step (crypto/sports rails OFF per B3). `group-d-hardening.spec.ts` adds candle volume,
  price alert, stale oracle UI, and parallel OI-cap race coverage. Invariants:
  PHON/USDT conservation, no side effect on cancel/reject, race boundary.
- Casino/provably fair: `casino.spec.ts` covers all six games for commit,
  settle, reveal, verification, idempotency, and auth. `casino-wave7-closeout.spec.ts`
  covers cap rejection with translated error, confirmation cancel, double
  confirm dedupe, RG block, self-exclusion block, and mismatch auto-kill.
  Invariants: ledger conservation, seed hash/result verification, no raw SQL
  code leakage, no bet on cancel/reject.
- Admin, security, and audit: `admin.spec.ts` covers RBAC positive/negative,
  feature toggle confirmation plus audit, withdrawal reject/refund plus audit,
  ops alert sync/ack audit, Phase C3 admin RPC permission boundary (positive JWT,
  batch non-admin denial, audit row on admin action), and non-admin RPC denial. Invariants: server-side
  authz, audit row for manual actions, PHON conservation on withdrawal refund.
- Responsible gambling and risk gates: `casino-wave7-closeout.spec.ts` covers
  self-exclusion/RG blocks in the browser; `phase5-wave9.spec.ts` covers frozen
  account browse-only UX; SQL suites remain the deeper policy/invariant gate.
- Affiliate approvals: browser E2E is not a separate spec yet; coverage is SQL
  integration focused (`affiliate_*` suites) plus admin queue patterns in
  `admin.spec.ts`. Add browser coverage when an affiliate user/admin route is
  shipped.
- PWA/offline/i18n UI: `visual.spec.ts` covers login and authenticated route
  rendering; `quality.spec.ts` and `bun run check:pwa` cover production quality
  and PWA checks. `check:i18n` detects hardcoded Korean outside the catalog and
  server-tested error codes without mappings. Add explicit locale-toggle E2E
  before launch once the language switch UX is exposed.

## Completion Definition

A task follows the master plan lifecycle (저사양 · `80` G13 · **[`CI_GATE_AUTHORITY.md`](SSOT/CI_GATE_AUTHORITY.md)**):

| 단계            | 주체                                      | 명령 (단일 터미널)                                     | 문서 표기                                                      |
| --------------- | ----------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| **Implemented** | **AI 자율 · 로컬**                        | `bun run gate:ai-impl -- --test <vitest-path>` (L0~L4) | Plan YAML `in_progress` · §AI Todo Sync **`[x] impl partial`** |
| **Verified**    | **GitHub Actions CI** (8GB operator 일상) | push/PR → **quality · sql · e2e · advisors** green     | Plan YAML `completed` · §AI Todo Sync **`[x] DONE`**           |

**8GB operator:** L5~L8을 로컬에서 돌리지 않음 — CI job green = Verified. Operator 「gate 실행」= 선택 1회 advisory.

### AI Implemented gate (`gate:ai-impl` · L0~L4 · G13 허용)

한 todo 마감 시 AI는 **아래 한 줄만** foreground 실행 (병렬·background 금지):

```powershell
bun run gate:ai-impl -- --test <owner-vitest-path>
```

내부 순서 (중단 없이 1회): `cursor:status` → `check:hygiene` → `check:ui-architecture`(UI) → `typecheck` → `lint` → `check:i18n` → `check:release` → 타겟 vitest.

- UI 비해당(문서-only): `--skip-ui-arch`
- vitest 없음(극히 드묾): `--skip-vitest` (증거에 사유 1줄)
- **금지:** L5~L8을 AI가 자율 실행 · `gate:ai-impl`과 E2E/SQL 동시 실행 (G1)

### Operator / CI Verified gate (L5~L8 · authoritative)

> **8GB operator 정본:** heavy gate = **GitHub CI** (`.github/workflows/ci.yml`). 로컬 실행 일상 **금지**.

| L     | When              | GitHub CI job                | 로컬 (8GB)                                    |
| ----- | ----------------- | ---------------------------- | --------------------------------------------- |
| L5    | migration/RPC/RLS | **sql** (+ **advisors**)     | ❌ · `stack:push-remote`만 migration touch 시 |
| L6–L7 | E2E               | **e2e** (`test:e2e` 15 spec) | ❌                                            |
| L8    | RC                | — (workflow 미포함)          | operator/CI 1회                               |
| L1–L4 | always            | **quality**                  | ✅ `gate:ai-impl`                             |

| Turnkey          | When                 | Command                                                        |
| ---------------- | -------------------- | -------------------------------------------------------------- |
| **Phase R**      | operator/CI L0~L8    | `bun run gate:phase-r` (단일 터미널 · authoritative)           |
| **Phase D prep** | operator launch prep | `bun run gate:phase-d` → `gate-manifest/phase-d-manifest.json` |

상세: [`SSOT/CI_GATE_AUTHORITY.md`](SSOT/CI_GATE_AUTHORITY.md) · [`rebuild/PHASE-R-GATE-RUNBOOK.md`](rebuild/PHASE-R-GATE-RUNBOOK.md)

Passing `gate:ai-impl` without operator L5~L8 is **not** full DONE for user-facing,
money, security, admin, casino, PWA, or launch readiness work. P0/P1 risks from
the master Release Risk Matrix block release until resolved or explicitly hidden
through Phase B3.
