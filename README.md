# PHONARA GB

PHONARA는 카지노(12종 provably-fair 게임)·스포츠북·현물/선물 거래·스테이킹·리퍼럴 리워드를 하나의 지갑(USDT/PHON 듀얼 통화)으로 묶은 실시간 앱테크·거래 플랫폼이다. 이 저장소는 웹 앱, 운영 Admin, Supabase 백엔드, 공유 엔진 패키지를 포함하는 Bun 모노레포다.

## 현재 상태 · 진행 단계

- **엔진(Supabase/RPC/게임·거래·정산 로직):** `FULLY CLOSED` — 신규 migration/RPC 착수 금지, 회귀 수정만.
- **프레젠테이션(웹 UI):** v5 Demolition으로 구 UI 계층 삭제 후 **Phase R(재구축)** 진행 중.
- **정본 문서(반드시 먼저 읽을 것):**
  - [`docs/SSOT/ACTIVE_WORK_SSOT.md`](docs/SSOT/ACTIVE_WORK_SSOT.md) — 유일한 실행 큐
  - [`docs/PRODUCT/REBUILD_PLAN_v1.md`](docs/PRODUCT/REBUILD_PLAN_v1.md) — Phase R 실행 정본
  - [`docs/ENGINE_APEX_CLOSEOUT.md`](docs/ENGINE_APEX_CLOSEOUT.md) — 엔진 상태·게이트 수치(재착수 금지 근거)
  - [`AGENTS.md`](AGENTS.md) — 에이전트 작업 규율·게이트·브랜치 워크플로우
  - [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md) · [`docs/DOCS_INDEX.md`](docs/DOCS_INDEX.md)

## 아키텍처 개요

```
apps/web      React 19 + Vite + TanStack Router/Query — 사용자 대면 웹 앱
apps/admin    React 19 + Vite — 운영자 Admin(1인 운영 우선, 예외 큐 중심)
packages/*    공유 엔진·유틸 (아래 표)
supabase/     Postgres 스키마·RLS·RPC(migrations) + SQL 통합 테스트
```

프론트엔드는 Supabase에 `callRpc()` 단일 진입점(타입세이프 RPC 클라이언트)으로만 접근하도록 설계되어 있고, 화면은 RPC/훅이 반환한 값만 표시한다(정산·페이오프·잔액을 클라이언트에서 재계산하지 않음). 인증·권한은 Postgres RLS + `SECURITY DEFINER` RPC 가드 이중 방어로 처리한다.

## 공유 패키지 (`packages/*`)

| 패키지                       | 역할                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `@phonara/money`             | Decimal 기반 금액·환율·수수료 연산(부동소수점 금지 규칙의 SOT) |
| `@phonara/wallet-ledger`     | append-only 지갑 원장 유틸                                     |
| `@phonara/i18n`              | ko/en 사용자 노출 문구 카탈로그 (한국어 하드코딩 금지)         |
| `@phonara/shared-types`      | Supabase 생성 DB 타입 + 프론트/백엔드 공유 타입 계약           |
| `@phonara/game-engine`       | 12종 카지노 게임 룰·RTP·provably-fair 시드/검증 로직           |
| `@phonara/trading-engine`    | 현물/선물/스테이킹 정산·펀딩비·마진 계산 참조 구현             |
| `@phonara/sportsbook-engine` | 스포츠 배당·콤보 오즈·페이아웃 프리뷰 로직                     |
| `@phonara/sports-ingest`     | 외부 벤더(TheOddsAPI 등) 배당/스코어 수집 워커                 |
| `@phonara/market-display`    | 오더북/캔들 등 시세 표시 가공 유틸                             |

## 기술 스택

- **런타임/패키지 매니저:** Bun (workspaces) · TypeScript strict
- **프론트엔드:** React 19 · Vite · TanStack Router/Query · Tailwind CSS 4
- **백엔드:** Supabase(Postgres + PostgREST + RLS + `SECURITY DEFINER` RPC) · Edge Functions
- **테스트:** Vitest(단위, `maxWorkers: 1`) · Playwright(E2E, CI authoritative) · SQL 통합 테스트(`supabase/tests`)
- **CI/배포:** GitHub Actions(`quality`·`sql`·`e2e`·`advisors` required jobs) · Cloudflare Pages

## 시작하기 (로컬 개발)

```bash
bun install
bun run dev:web      # apps/web 개발 서버
bun run dev:admin    # apps/admin 개발 서버
```

로컬 Supabase/E2E/SQL 게이트는 저사양 PC 기준 실행 순서가 정해져 있다 — [`docs/rebuild/LOWSPEC_RULES.md`](docs/rebuild/LOWSPEC_RULES.md) · [`docs/SSOT/OPERATOR_GATES.md`](docs/SSOT/OPERATOR_GATES.md)를 먼저 읽는다. 무거운 게이트(SQL 통합 테스트·전체 E2E·`check:full`)는 로컬 상시 실행 대상이 아니라 **GitHub CI가 authoritative**다 — [`docs/SSOT/CI_GATE_AUTHORITY.md`](docs/SSOT/CI_GATE_AUTHORITY.md).

```bash
bun run typecheck
bun run lint
bun run test          # vitest 단위 테스트
bun run check         # 전체 체인(로컬 최종 확인 시에만)
```

## 브랜치 워크플로우

`main`은 merge-ready 상태만 유지한다 — 직접 커밋/푸시하지 않는다. 작업은 `phase-r/*` 또는 `wip/*` feature 브랜치에서 진행하고 CI green 확인 후 PR로 병합한다. 자세한 내용은 [`AGENTS.md`](AGENTS.md#branch-workflow-non-waivable)를 참고한다.

## 참고

- v2 UI 재구축 실행 문서(`UI_REBUILD_WAVE` · `NEXT_STEP` · `AI_REFERENCE_PRIORITY`)는 **Batch 11에서 삭제**됐다 — 재생성하지 않는다. 목록: [`docs/SSOT/DEPRECATED_DOC_DENYLIST.md`](docs/SSOT/DEPRECATED_DOC_DENYLIST.md).
- 감사·현황 문서 인덱스: [`docs/DOCS_INDEX.md`](docs/DOCS_INDEX.md)
