# Phase D — Engine-only Demolition (실행 정본)

> **버전:** v5.3.1 · **범위:** 코드 삭제 + **Doc Demolition** · Rebuild는 [`REBUILD_PLAN_v1.md`](REBUILD_PLAN_v1.md)
>
> **한 줄:** 격리·rollback reserve·archive/ui-v2 **없음** — 코드·문서 **git rm**.

## Demolition 중 유일한 문서 입력

```text
docs/PRODUCT/DEMOLITION_PLAN.md
docs/PRODUCT/ADR/000-v5-demolition-first.md
```

그 외 SSOT·옛 wave·inventory·analysis **읽지 않음** · Batch 11에서 **삭제**.

---

## 완료 정의 (Demolition DONE)

|     |                                                                                               |
| --- | --------------------------------------------------------------------------------------------- |
| ✅  | 옛 UI 코드 경로 0                                                                             |
| ✅  | Batch 7½ · 7¾ + hooks/lib 화이트리스트 + `@/i18n` grep 0                                      |
| ✅  | **Batch 11** — v2 실행·inventory·analysis `.md` **git에서 0** (KEEP 표 A만)                   |
| ✅  | **Batch 11½** — `check:ai-reference` · `DOCS_INDEX` · `DEPRECATED_DOC_DENYLIST` D-only 최소화 |
| ✅  | `check:engine-demolition:full` green (Batch 10 · 1회)                                         |
| ✅  | stub `main` (선택)                                                                            |
| ❌  | `dev:web` · 52 surface · `product/`                                                           |
| ❌  | **`docs/archive/ui-v2/`** — 존재 자체 금지 (이동·격리 폐기)                                   |

**operator 서명** — `PRE_DEMOLITION_INVENTORY.md` (2026-07-04 삭제 — git history · tag `ui-v3-final-backup`) + [ADR-000](ADR/000-v5-demolition-first.md) 동기화

> 엔진만 남기고 UI 전삭제, 앱 빌드 깨짐 수용.

### D0 산출물 상태

| D0 항목                                                               | 상태                                                                                                                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRE_DEMOLITION_INVENTORY.md`                                         | **완료** 2026-07-02                                                                                                                                                                           |
| `check:engine-demolition`                                             | **스켈레톤** — Batch 9½ toolchain · 11½ ai-reference                                                                                                                                          |
| ADR-000 서명 날짜                                                     | **완료** 2026-07-02                                                                                                                                                                           |
| **D0½** rules                                                         | **완료** — `00-phase-d-demolition.mdc` · `.cursorrules` · `AGENTS×4`                                                                                                                          |
| `git tag ui-v3-final-backup`                                          | **완료**                                                                                                                                                                                      |
| operator **「D Batch 1 GO」**                                         | **완료** 2026-07-02                                                                                                                                                                           |
| **Batch 1** (e2e · visual)                                            | **완료** 2026-07-02 — `git rm` 52 files · `check:engine-demolition:packages` green                                                                                                            |
| **Batch 2a–2c** (components · ui · assets · hooks)                    | **완료** 2026-07-02 — ~1041 files · hooks 13 KEEP · `check:engine-demolition:packages` green                                                                                                  |
| **Batch 3** (routes · router · styles · theme · shims · mocks · i18n) | **완료** 2026-07-02 — 53 files · `check:engine-demolition:packages` green                                                                                                                     |
| **Batch 4** (packages/ui · packages/game-ui)                          | **완료** 2026-07-02 — 77 files · toolchain refs 정리 · `check:engine-demolition:packages` green                                                                                               |
| **Batch 5** (admin presentation)                                      | **완료** 2026-07-02 — 186 files · engine glue 41 KEEP · `check:engine-demolition:packages` green                                                                                              |
| **Batch 6** (web features tsx · controllers)                          | **완료** 2026-07-02 — 62 files · `LedgerRowView` type 이동 · `check:engine-demolition:packages` green                                                                                         |
| **Batch 7** (features 잔여 · grep)                                    | **완료** 2026-07-02 — 39 files · UI/`@/i18n`/gate 잔여 0 · engine glue 69 KEEP · `check:engine-demolition:packages` green                                                                     |
| **Batch 7¾** (lib 화이트리스트)                                       | **완료** 2026-07-02 — 38 DELETE · 23 KEEP · engine glue import 정리 · `check:engine-demolition:packages` green                                                                                |
| **Batch 9** (deps)                                                    | **완료** 2026-07-02 — apps/web·admin presentation deps 제거 · `@phonara/ui`/`game-ui` 참조 정리 · knip green · `check:engine-demolition:packages` green                                       |
| **Batch 9½** (toolchain)                                              | **완료** 2026-07-03 — vite/playwright/tsconfig/vitest 정리 · E2E runner stub · i18n/game-registration/c2-ds Phase D skip · v2 wave-gate tests 제거 · `check:engine-demolition:packages` green |
| **Batch 8** (stub main)                                               | **완료** 2026-07-03 — web/admin `main.tsx` stub · `typecheck` · `build` green                                                                                                                 |
| **Batch 11** (Doc Demolition)                                         | **완료** 2026-07-03 — `git rm` 35 paths · v2 실행·inventory·analysis `.md` 0 · KEEP 표 A 38 files 잔존                                                                                        |
| **Batch 11½** (doc/rules rewrite)                                     | **완료** 2026-07-03 — `DOCS_INDEX` · `DEPRECATED_DOC_DENYLIST` · `CURRENT_STATUS` stub · `check-ai-reference` · `00-core.mdc` · `.mdc` 정리                                                   |
| **Batch 10** (`:full`)                                                | **완료** 2026-07-03 — `check:engine-demolition:full` green · packages 266/266 · SQL 91/91 · `stack:stop`                                                                                      |

**Demolition DONE** — 2026-07-03 · STOP · Rebuild = [`REBUILD_PLAN_v1.md`](REBUILD_PLAN_v1.md)

> **AI:** 본 문서 = Demolition **완료 이력** · batch 재실행 큐 **아님**. Active SSOT = [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md)

### Runtime presentation clean 고정

Runtime presentation clean 상태는 고정한다. `apps/web`와 `apps/admin`의 실행 UI는
Phase D stub만 남아 있으며, 삭제된 `components` · `routes` · `styles` · `theme.css` ·
`packages/ui` · `packages/game-ui` 경로는 Phase R에서 복구하지 않고 새 구조로 재정의한다.

더 이상 presentation 관련 삭제 작업을 확장하지 않는다. Phase R 착수 전에는 scripts ·
문서 · Cursor rules에 남은 active execution reference만 정리하여, AI가 삭제된 구현을
되살리지 못하게 막는다.

---

## D0 Preflight

```bash
git tag ui-v3-final-backup
bun run cursor:status
git status
```

| D0 산출물                        | 내용                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| `PRE_DEMOLITION_INVENTORY.md`    | 코드 KEEP/DELETE + 문서 **A / B / 11½** (`git ls-files docs`) |
| `ADR/000-v5-demolition-first.md` | 백지 + Doc Demolition                                         |
| `package.json`                   | `check:engine-demolition` 스켈레톤 (아래 타이밍)              |

### D0½ — Cursor 규칙 stub (Batch 11 전 AI 오염 방지)

Batch 11 전까지 옛 SSOT가 **디스크 + `.cursor/rules/*.mdc`** 에 동시 존재. 예: `93-uiux-full-rebuild-v2-execution.mdc` · `91-uiux-worldclass-methodology.mdc` · `00-core.mdc` · `89-beginner-autopilot.mdc` 가 `UIUX_FULL_REBUILD_EXECUTION` · `NEXT_STEP` · `UI_REBUILD_WAVE` · `CURRENT_STATUS` 를 **자동 주입**.

#### D0½ 조치 (코드·문서 삭제 없음 · 규칙 파일 추가/편집만):

```text
1) .cursor/rules/00-phase-d-demolition.mdc  (신규 · 필수)
2) .cursorrules · AGENTS.md stub
```

#### `00-phase-d-demolition.mdc` — 작성 스펙 (D0½ 필수)

#### frontmatter (00-core와 동급):

```yaml
---
description: Phase D — Engine-only Demolition override (Batch 1–11½)
alwaysApply: true
---
```

#### 본문에 반드시 포함:

- **Implementation SSOT** = `docs/PRODUCT/DEMOLITION_PLAN.md` + `docs/PRODUCT/ADR/000-v5-demolition-first.md` **only**
- **Phase D 기간 `00-core.mdc` v2 execution read 무효화:**
  - `docs/SSOT/AI_REFERENCE_PRIORITY.md` as UI rebuild SSOT — **적용 안 함**
  - Execution queue: `NEXT_STEP.md` · `UI_REBUILD_WAVE.md` — **적용 안 함**
  - `docs/CURRENT_STATUS.md` **§AI Todo Sync** as work queue / `[x]` DONE 재착수 규칙 — **적용 안 함**
- v2 execution read 금지: `UIUX_FULL_REBUILD_EXECUTION` · `MASTER_TODO` · `LEGACY_SURFACE_MAP` 등 Batch 11 DELETE 대상
- **작업 범위:** `DEMOLITION_PLAN` Batch만 · Rebuild/UI 구현 금지
- **Closeout 유예:** `82-work-doc-closeout-sync` §AI Todo Sync · `UI_REBUILD_WAVE` 동기화 — **Phase D 동안 유예** (Demolition DONE 후 Phase R)
- **Standing autonomy (`70`):** Demolition Batch 범위 내 자율 · UI Rebuild·parallel surface 생성 금지
- **`89-beginner-autopilot`:** “구현해줘” = **승인된 Plan = DEMOLITION_PLAN** (D0 GO 후 Batch 실행)
- **Demolition Batch 진행 중 적용 안 함:** `check:ui-architecture` · Consolidation C0–C5 (`88`) · `gate:ai-impl` (UI surface) · `91` preflight UI canon read — Phase D는 Batch 삭제만
- 89/91/93 UI-rebuild 실행 지시와 충돌 시 **본 규칙 우선** (Phase D 한정)

> `alwaysApply: false` 이면 00-core override가 약함 — **반드시 `true`**.

```text
.cursorrules · AGENTS.md (루트)
  · “구현 SSOT = DEMOLITION_PLAN (+ ADR-000)” 한 줄
  · v2 execution read 목록 제거 (Always read UIUX_FULL_REBUILD … 등)
  · .cursorrules 추가 치환:
      - check:ui-architecture preflight → Phase D: check:engine-demolition:packages (optional)
      - Current Focus UI_REBUILD_WAVE D0~U8 → Phase D: DEMOLITION_PLAN Batch만
      - 82 closeout 동기화 문단 → Phase D 유예 (00-phase-d와 동일)

apps/web/AGENTS.md · apps/admin/AGENTS.md · supabase/AGENTS.md
  · 루트와 동일 Phase D stub (check-ai-reference-legacy.ts L19–21 스캔 대상)
  · 옛 UI 가이드·v2 read 목록 제거
```

#### 11½ (Batch 11 DELETE 후):

| 대상                                     | 조치                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `00-core.mdc`                            | v2 큐 문단 → **D-only stub** 또는 Phase R 때 복구 (TODO)                |
| `93` · `91` · `89` · 기타 `.mdc`         | 삭제된 docs 경로 참조 제거                                              |
| `scripts/check-ai-reference-legacy.ts`   | **기존 파일 편집** (`check:ai-reference` 정본 · 신규 스크립트 2개 금지) |
| `DOCS_INDEX` · `DEPRECATED_DOC_DENYLIST` | v5.3 최소 allowlist 재작성                                              |

Demolition 동안 `.mdc` 전면 비활성은 **하지 않음** — `00-phase-d` override + 11½ 정리.

**대안 B (비추천):** Batch 11을 코드 Batch 1보다 먼저.

### D0 + D0½ 산출물 체크리스트 (실행 시)

- [x] `git tag ui-v3-final-backup`
- [x] `PRE_DEMOLITION_INVENTORY` (코드 + docs A/B/11½)
- [x] ADR-000 서명 날짜
- [x] `package.json` — `:packages` · `:light` · `:full` 스켈레톤
- [x] D0½ — `.cursorrules` stub
- [x] D0½ — `AGENTS.md` ×4 stub
- [x] D0½ — `00-phase-d-demolition.mdc`
- [x] operator **「D Batch 1 GO」** — 2026-07-02
- [x] **Batch 1** — `tests/e2e/**` · `tests/visual/**` 삭제 (52 files)
- [x] **Batch 2a** — `apps/web/src/components/**` 삭제 (641 files)
- [x] **Batch 2b** — `apps/web/src/ui/**` · `apps/web/src/assets/**` 삭제 (364 files)
- [x] **Batch 2c** — hooks whitelist 13 KEEP · 36 DELETE
- [x] **Batch 3** — `routes/**` · `router.ts` · `styles/**` · `theme.css` · `shims/**` · `mocks/**` · `i18n/**` (53 files)
- [x] **Batch 4** — `packages/ui/**` · `packages/game-ui/**` (77 files) · tsconfig/build refs 정리
- [x] **Batch 5** — `apps/admin` presentation (`components/` · `ui/` · `routes/` · i18n · theme · public · test · lib KEEP=`auth.ts` 외 · top-level hooks) — 186 files · 41 KEEP
- [x] **Batch 6** — `apps/web/src/features/**/*.tsx` · `use-*-page-controller.ts` · UI tests — 62 files · `LedgerRowView` → `ledger-entry-filters.ts`
- [x] **Batch 7** — features 잔여 grep (`@/(components|ui)` · `@/i18n` · wave/gate tests) — 39 DELETE · 69 engine glue KEEP
- [x] **Batch 7¾** — `lib/` 화이트리스트 23 KEEP · 38 DELETE (`__tests__` · `social-proof` · `casino` · presentation utils)
- [x] **Batch 9** — apps/web·admin `package.json` presentation deps 제거 · knip engine-glue entry · `check:deps` green · glue `@phonara/ui`/`game-ui` 참조 정리
- [x] **Batch 9½** — vite/playwright/tsconfig/vitest · E2E stub · gate test 잔여 제거 · `check:engine-demolition:packages` green
- [x] **Batch 8** — stub `main.tsx` (web/admin) · `typecheck` · `build` green
- [x] **Batch 11** — Doc Demolition `git rm` 35 paths (v2 실행·analysis·inventory DELETE)
- [x] **Batch 11½** — `DOCS_INDEX` · denylist · `CURRENT_STATUS` stub · `check-ai-reference` · `00-core.mdc` · `.mdc` 정리

**Doc 전략:** **B+canon** — KEEP 표 A ~35–40개 (`git ls-files docs`로 inventory 확정)

---

# Part 1 — 코드 KEEP/DELETE

### hooks/ 화이트리스트 (Batch 2c)

```text
KEEP: use-wallet · use-trading · use-profile · use-compliance-status · use-platform-gates
      use-confirm-snapshot · use-rpc · use-realtime · use-money
      use-cms-content · use-deposit-realtime-notify · use-sports-realtime · useOddsTick
DELETE: hooks/ 내 위 외 모든 *.ts
```

### lib/ 화이트리스트 (Batch 7¾)

```text
KEEP: rpc · supabase · query · translate-error · money-input · launch-gates · i18n.tsx
      auth* · env · production-security-shell · production-site-origin
      money-display · format · display-odds-multiply · format-funding-rate-display
      format-liquidation-distance · phon-krw-rate-stale · geo-block · signup-email-policy
      referral-pending
DELETE: motion · confetti · visual-fixture · social-proof/** · surface-* · growth-analytics
        onboarding-* · pwa-auth-nudge · useCountUp · use-login-auth-toasts · utils.ts
        lib/ KEEP 외 전부 + lib/__tests__
```

### 코드 DELETE (통째)

`components/` · `ui/` · `routes/` · `router.ts` · `assets/` · `styles/` · `theme.css` · `shims/` · `mocks/` · `i18n/` · `packages/ui` · `packages/game-ui` · admin presentation · `tests/e2e` · `tests/visual` · `features/**/*.tsx` · controllers · UI tests

### 인프라

```text
.cursor/rules/**                    # 파일 유지 · D0½ 00-phase-d-demolition.mdc 추가
                                    # 11½: 삭제된 docs 경로 참조 제거 (stub override 해제 준비)
.cursorrules · AGENTS.md            # D0½ stub
README.md (stub OK)
scripts/ (SQL/stack) — 11½: check-ai-reference-legacy.ts allowlist
```

---

# Part 2 — Doc Demolition (Batch 11)

> **`git rm` only** · **`docs/archive/ui-v2/` 이동 금지**

**권장 순서:** 코드 Batch 9½·8 후 → **11 → 11½ → 10**

### A. KEEP — B+canon

```text
docs/PRODUCT/**
docs/archive/PRE_DEMOLITION_INVENTORY.md
docs/QUALITY_GATES.md · SSOT/OPERATOR_GATES.md
docs/ENVIRONMENT_SETUP.md · RUNBOOK.md
docs/SUPABASE_ACCESS_MATRIX.md · THREAT_MODEL.md · LEGAL_BASIS.md
docs/OBSERVABILITY_PRIVACY.md · CASINO_SLO.md
docs/ADR/0001~0006
docs/rebuild/E2E-LOWSPEC-RUNBOOK.md
docs/rebuild/PHASE-D-GATE-RUNBOOK.md
docs/rebuild/PHASE-R-GATE-RUNBOOK.md
docs/SSOT/UX_REFERENCE_CANON.md · SURFACE_BLUEPRINTS.md
docs/SSOT/PRODUCT_PRINCIPLES.md · COPYWRITING_CANON.md · DESIGN_PRINCIPLES.md
docs/SSOT/ENGINE_BOUNDARY.md · I18N_FIRST.md · PAYMENT_ARCHITECTURE_CANON.md
docs/SSOT/*_UX_CANON.md (AUTH · ADMIN · CASINO · EARN · HOME · SPORTS · TRADE · WALLET · UNIFIED)
```

### B. DELETE — Batch 11 `git rm`

```text
docs/SSOT/UIUX_FULL_REBUILD_EXECUTION.md · MASTER_TODO.md · UI_REBUILD_WAVE.md
docs/SSOT/NEXT_STEP.md · AI_REFERENCE_PRIORITY.md · LEGACY_SURFACE_MAP.md
docs/SSOT/PRESENTATION_REBUILD_SCOPE.md · P0_SCAN_MEMO.md · REPO_AUDIT.md
docs/SSOT/GIT_SAFETY_SNAPSHOT.md · NAMING_CONVENTION.md · DESIGN_SYSTEM_V2.md
docs/SSOT/ROUTE_ENGINE_CONTRACT.md · REBUILD_ENGINE_SSOT.md · DECISION_LOG.md
docs/SSOT/FREEZE_MANIFEST.md · UI_INVENTORY.md · ROUTE_CANONICAL_REGISTRY.md
docs/SSOT/DISPLAY_DATA_CONTRACT.md · ENGINE_INTEGRATION_PLAYBOOK.md
docs/SSOT/CASINO_GAME_SHELL_SPEC.md · SPORTS_DATA_AUDIT.md · SPORT_CODE_IMPACT.md
docs/SSOT/GLOBAL_EXPANSION.md · UX_WRITING_GUIDE.md
docs/CURRENT_STATUS.md · analysis/** · PRODUCT_VISION.md · FOLDER_STRUCTURE.md
docs/REBUILD_ENGINE_FINDINGS.md · PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md
docs/DOCS_INDEX.md                    # R에서 v5.3판 신규
docs/SSOT/DEPRECATED_DOC_DENYLIST.md  # 11½ 전면 재작성 (DELETE 후 신규 파일 OK)
```

### 11½ — 재작성 (git rm 아님 · 신규 작성)

```text
docs/DOCS_INDEX.md                    # KEEP(A)만 링크
docs/SSOT/DEPRECATED_DOC_DENYLIST.md  # v5.3 최소 allowlist · 짧게
docs/CURRENT_STATUS.md                # ~20줄 stub: Demolition DONE · Rebuild TBD
scripts/check-ai-reference-legacy.ts  # 기존 파일 편집 (package.json check:ai-reference 정본)
.cursor/rules/00-core.mdc             # v2 큐 문단 D-only stub 또는 Phase R 복구
.cursor/rules/*.mdc                   # 삭제된 SSOT 경로 참조 제거 (93 · 91 · 89 …)
```

### C. Phase R 신규 (지금 X)

`REBUILD_PLAN_v1` · `SURFACE_QUEUE` · `GOVERNANCE`

#### 검증 (Batch 11 후):

```bash
rg "UI_REBUILD_WAVE|MASTER_TODO|UIUX_FULL_REBUILD|desk-surface|DsV2" docs/ \
  -g '*.md' -g '!docs/PRODUCT/**'
```

---

# Batch 실행표

| Batch      | 작업                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| 0          | tag · inventory · ADR-000 · gate 스켈레톤 · **D0½** (rules + AGENTS + **00-phase-d-demolition.mdc**)                |
| 1          | e2e · visual                                                                                                        |
| 2a–2c      | components · ui/assets · hooks                                                                                      |
| 3–7¾       | routes · ui packages · admin · features · grep · lib                                                                |
| 9 → 9½ → 8 | deps · toolchain · stub                                                                                             |
| **11**     | **Doc Demolition git rm**                                                                                           |
| **11½**    | DOCS_INDEX · denylist · CURRENT_STATUS stub · **check-ai-reference-legacy.ts** · **00-core.mdc stub** · 기타 `.mdc` |
| **10**     | `check:engine-demolition:full`                                                                                      |

### check:engine-demolition — 타이밍 (Must-fix)

```json
"check:engine-demolition:light": "bun run test -- packages/ && bun run check:hygiene && bun run check:i18n && bun run check:migrations && bun run check:ai-reference",
"check:engine-demolition:full": "bun run check:engine-demolition:light && supabase db reset && bun run test:sql",
"check:engine-demolition:packages": "bun run test -- packages/ && bun run check:hygiene && bun run check:i18n && bun run check:migrations"
```

| 명령        | 시점                                | 비고                                       |
| ----------- | ----------------------------------- | ------------------------------------------ |
| `:packages` | Batch 1–10 **optional**             | `ai-reference` **미포함** · 중간 확인용    |
| `:light`    | **Batch 11½ 후만**                  | 11½ 전 = `check:ai-reference` red **정상** |
| `:full`     | **Batch 10 only** · Demolition DONE | operator foreground · 1회                  |

**금지:** Batch 1–10 중 `check:engine-demolition:light` / `:full` 실행 (`ai-reference` 미갱신)

---

## 절대 금지

| 금지                                         | 이유                          |
| -------------------------------------------- | ----------------------------- |
| `docs/archive/ui-v2/` **이동**               | 격리 = 또 참고                |
| 옛 SSOT archive 보관                         | Doc Demolition 상쇄           |
| Demolition 중 Rebuild 문서 작성              | 백지 오염                     |
| Demolition 중 `:light` / `:full` 조기 실행   | ai-reference red · false FAIL |
| `supabase/migrations` · engine packages 수정 | 엔진                          |

---

## E — Batch 10

```bash
bun run check:engine-demolition:full
```

#### PASS → Demolition DONE → STOP
