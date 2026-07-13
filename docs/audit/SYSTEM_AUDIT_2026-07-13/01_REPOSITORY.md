# Pillar 1 — Repository (저장소 구조·의존성·중복·데드코드)

> **감사일:** 2026-07-13 · **READ-ONLY** (코드 수정 0)
> **Baseline:** [`MASTER_INVENTORY_AUDIT_2026-07-13.md`](../MASTER_INVENTORY_AUDIT_2026-07-13.md) (Phase 1 §1–§25) — 본 문서는 해당 정본을 재사용하고 drift만 재확인한다.

## 점수

| 항목           |                  점수 |
| -------------- | --------------------: |
| **Repository** | **86 / 100** (Strong) |

감점 근거: 워킹트리 dirty 60건(Freeze ACTIVE 중), knip unused 3파일 + unresolved script import 3건, root `decimal.js` 잔존 의존성. 구조·경계·중복 방지는 세계 수준.

## 1. 감사 스냅샷 (baseline 고정)

| 항목             | 값                                                                        | 근거                                                                        |
| ---------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Branch           | `phase-r/platform-integrity-2026-07-11`                                   | `git branch --show-current`                                                 |
| HEAD             | `4d661e83` `fix(ci): lock platform SQL migration and sync database types` | `git log -1`                                                                |
| RC SHA (Freeze)  | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`                                | [`PLATFORM_RELEASE_FREEZE.md`](../../OPERATIONS/PLATFORM_RELEASE_FREEZE.md) |
| 워킹트리 dirty   | **60 라인** (modified + untracked)                                        | `git status --porcelain` 2026-07-13                                         |
| Phase 1 인벤토리 | 2,833 files · 310 dirs (depth≤6)                                          | Phase 1 §1                                                                  |

## 2. Phase 1 재사용 요약 (변동 없음 — 정본 인용)

| 차원                      | 값 (Phase 1 검증)                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 모노레포                  | Bun workspaces — `apps/web` · `apps/admin` · packages 9 + shared-types + i18n (12 workspace package.json) |
| Web routes / pages        | 93 route 파일 · 79 surfaces (77 page + 2 shell)                                                           |
| Admin routes / surfaces   | 34 routes · 32 desk surfaces                                                                              |
| Migrations / SQL tests    | 239→**241** SQL files (아래 §4 drift) · 142 SQL tests                                                     |
| Vitest / E2E              | ~644 vitest files · 5 E2E specs + 1 smoke                                                                 |
| Edge Functions            | 11                                                                                                        |
| 삭제 확인 (v5 Demolition) | `components/ui` · `presentation-import` · `packages/ui` = 0 files                                         |
| 미사용 스택               | Next.js · Redux · GraphQL client · Turbo · pnpm 없음                                                      |

## 3. Drift 재확인 (2026-07-13 실측)

### 3.1 워킹트리 dirty (60건)

구성 (git status 스냅샷 기준):

| 그룹                     | 내용                                                                                                                                                                    | 판정                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 신규 감사 산출물         | `docs/audit/MASTER_INVENTORY_*` · `PER_PAGE_UI_MATRIX` · `RPC_USAGE_MATRIX` · `scripts/audit/*` (untracked)                                                             | 의도된 감사 artifact — 정상                                                                                                                                             |
| Platform R9–R12 evidence | `docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9–R12/*` · display contracts + tests (modified)                                                                      | R12 closeout 후속 정리 — 정상                                                                                                                                           |
| **SQL/migration**        | `20260822000001_platform_sql_ci_closeout.sql` (modified) · `20260823000001_platform_sql_ci_closeout2.sql` (untracked) · `migrations.lock.json` · `supabase/tests/*` 5건 | **Freeze ACTIVE 중 migration touch** — CI fix 경로로 보이나 (HEAD `4d661e83` fix(ci) 연장) 원격 미적용 상태 → Finding **SA-01** ([`02_DATABASE.md`](02_DATABASE.md) §3) |
| 설정                     | `.cursor/mcp.json` · `.cursor/settings.json` · `.cursor/.phonara-render-fix-at`                                                                                         | 로컬 세션 잔여 — 커밋 제외 대상                                                                                                                                         |

### 3.2 Knip 데드코드 (재확인 — [`KNIP_DEADCODE_REPORT.md`](../KNIP_DEADCODE_REPORT.md))

| 카테고리                  |                                                                                 수 | 판정                                                       |
| ------------------------- | ---------------------------------------------------------------------------------: | ---------------------------------------------------------- |
| Unused files              | **3** (`admin-desk-views.ts` · `controller-view-freeze.ts` · `admin/lib/i18n.tsx`) | 삭제 후보 — operator 확인 후 (Freeze 중 hygiene 삭제 금지) |
| Unused exports / types    |                                                                            17 / 10 | 엔진·ingest helper 중심 — LOW                              |
| Duplicate exports         |                                                                                  7 | LOW                                                        |
| Unused dependency         |                                                              1 (root `decimal.js`) | `@phonara/money` 경유가 정본 — root dep 잔존               |
| Unresolved script imports |                          3 (`seo-config` · `i18n/ko` · `i18n/en` — legacy scripts) | stale script 2개 정리 후보                                 |

### 3.3 Architecture drift

| 검사                                           | 결과                                                                                  | 근거                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `check:ai-reference`                           | **green** — Batch 11 deleted doc refs 0 · frozen evidence refs 0 · mockup scripts 0/7 | 2026-07-13 실행                                               |
| 중복 surface 후보 (`spot-desk-page` 이중 표기) | **해소** — 디스크 실측 1 file + 1 test (git status 표기 artifact)                     | `apps/web/src/product/surfaces/trade/spot-desk-page.tsx` 단일 |
| Pre-demolition 경로 부활                       | 0                                                                                     | Phase 1 §2.3 재확인                                           |
| Parallel plan/doc                              | 없음 — 실행 큐는 `ACTIVE_WORK_SSOT` 단일                                              | rule `00-post-closeout-active-ssot`                           |

## 4. Finding (Pillar 1 신규)

| ID    | 심각도 | 내용                                                                 | 근거                                                    |
| ----- | ------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| SA-03 | LOW    | knip unused 3파일 + stale script import 3건 + root `decimal.js` 잔존 | [`KNIP_DEADCODE_REPORT.md`](../KNIP_DEADCODE_REPORT.md) |

(SA-01 migration drift는 Pillar 2에 귀속 — [`FINDINGS.yaml`](FINDINGS.yaml))

## 5. NOT VERIFIED

- `node_modules` · gitignored `dist/` 내부
- knip devDependencies false-positive 삭제 적격성 (Phase 1 §25 동일)
