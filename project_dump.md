# PHONARA Project Dump

생성일: 2026-06-12  
대상 저장소: `c:\Users\PC\Desktop\phonara-gb`  
목적: 현재 프로젝트의 구조, 코드 경계, 품질 상태, 리스크, 다음 실행 우선순위를 한 파일에서 복구 가능하게 정리한다.

## 0. 보안 경계

- `.env` 원문은 분석 대상에서 의도적으로 제외했다. 로컬 비밀값, Supabase 키, 운영 토큰은 덤프 문서에 복사하지 않는 것이 맞다.
- 기준 문서는 확인했다: `docs/PHONARA_V2_MASTER_PLAN.md`, `docs/FINAL_DIRECTION.md`, `docs/QUALITY_GATES.md`, `docs/AI_WORKING_RULES.md`, `docs/BUILD_LOG.md`, 전술 플랜.
- 현재 단일 진실 공급원은 `docs/PHONARA_V2_MASTER_PLAN.md`이다. `FINAL_DIRECTION`, `AI_WORKING_RULES`, `BUILD_LOG`는 모두 마스터 플랜으로 통합된 포인터 문서다.
- Supabase 단일 프로젝트 락은 `yocjhjsdwoijfdrehzoq`이다. 다른 프로젝트를 읽거나 적용하는 흐름은 금지다.

## 1. 현재 저장소 상태

### Git

- 작업 트리: `git status --short` 기준 clean.
- 최근 커밋:
  - `7c4ce5a feat(sql): add affiliate approvals`
  - `958050f feat(sql): add affiliate settlements`
  - `9e3aa18 feat(sql): add affiliate commission aggregates`
  - `132e503 feat(sql): add affiliate tier snapshots`
  - `3df8ecc feat(sql): add affiliate relationship depth guard`

### 추적 파일 인벤토리

`git ls-files` 기준 총 370개 파일.

상위 경로별:

| 경로 | 파일 수 | 의미 |
|---|---:|---|
| `supabase` | 117 | DB 마이그레이션, SQL 검증 |
| `apps` | 90 | web/admin React 앱 |
| `packages` | 82 | 공유 타입, money, 엔진, UI, i18n |
| `docs` | 24 | 마스터 플랜, ADR, 운영 문서 |
| `.cursor` | 14 | Cursor 작업 규칙 |
| `tests` | 13 | Playwright/E2E 및 통합 검증 |
| `scripts` | 11 | 품질 게이트, SQL runner, 정리 스크립트 |
| `setup` | 2 | 초기 셋업 보조 |

확장자별:

| 확장자 | 파일 수 |
|---|---:|
| `.sql` | 116 |
| `.ts` | 97 |
| `.tsx` | 66 |
| `.md` | 28 |
| `.json` | 23 |
| `.mdc` | 12 |
| 기타 설정/이미지/락 파일 | 28 |

핵심 하위 카운트:

| 영역 | 파일 수 |
|---|---:|
| `apps/web` | 63 |
| `apps/admin` | 27 |
| `packages/ui` | 32 |
| `packages/game-engine` | 19 |
| `packages/trading-engine` | 13 |
| `packages/wallet-ledger` | 5 |
| `packages/money` | 5 |
| `packages/shared-types` | 5 |
| `packages/i18n` | 3 |
| `supabase/migrations` | 79 |
| `supabase/tests` | 37 tracked unique files |
| `tests/e2e` | 11 |
| `tests/integration` | 1 |

## 2. 제품 방향 요약

PHONARA는 PHON 중심 경제, USDT 게임/트레이딩 지원, 원화 계좌이체 입출금, 코인 입출금, 1인 운영 99% 자동화 Admin을 목표로 한다.

확정 기준:

- `apps/web`: 일반 유저 앱.
- `apps/admin`: 관리자 전용 별도 앱.
- PHON: 리워드와 플랫폼 중심 토큰.
- USDT: 게임/트레이딩 안정 통화.
- KRW: 원화 입금/출금 및 PHON 환전 진입 수단.
- 카카오 로그인과 PG 연동은 현재 제외, 추후 옵션.
- 외부 거래소 연동 없이 자체 oracle/price tick 기반으로 트레이딩 UX를 구성한다.

현재 마스터 플랜상 Phase 0~3은 완료 축이고, Phase 4 Casino, Phase 5 입출금/Admin, Phase 6 PWA/운영 고도화가 남은 큰 축이다. 다만 Build Log는 이미 Phase 5, Casino, 운영 하드닝 일부가 상당히 진행되었음을 보여준다.

## 3. 아키텍처 지도

```text
apps/
  web/      사용자 앱: auth, dashboard, wallet, ledger, trade, staking, casino
  admin/    운영 앱: overview, alerts, queues, audit, operations

packages/
  shared-types/    Supabase generated types + 공통 domain literal
  money/           Decimal, precision, fee, FX, display
  wallet-ledger/   순수 TS ledger 모델, SQL 권위 구조의 보조 모델
  trading-engine/  spot/futures/staking 순수 계산 엔진
  game-engine/     provably-fair seed/HMAC/float/game settlement
  i18n/            ko/en typed message catalog
  ui/              web/admin 공용 token 기반 UI primitives

supabase/
  migrations/      권위 DB schema/RLS/RPC/hardening
  tests/           SQL 통합 검증

tests/
  e2e/             Playwright 실제 브라우저 흐름
  integration/     TS와 SQL parity 검증

scripts/
  품질 게이트, SQL runner, i18n/env/advisor/release 검사
```

가장 중요한 방향성은 명확하다: UI보다 원장, 권한, 정산, 엔진, 검증을 먼저 세우는 구조다. 이 저장소는 그 원칙을 상당 부분 실제 산출물로 옮겼다.

## 4. 앱 표면 분석

### `apps/web`

역할: 일반 사용자 제품 표면.

핵심 route:

- `apps/web/src/routes/__root.tsx`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/routes/signup.tsx`
- `apps/web/src/routes/reset-password.tsx`
- `apps/web/src/routes/terms.tsx`
- `apps/web/src/routes/privacy.tsx`
- `apps/web/src/routes/dashboard.tsx`
- `apps/web/src/routes/wallet.tsx`
- `apps/web/src/routes/ledger.tsx`
- `apps/web/src/routes/trade.tsx`
- `apps/web/src/routes/staking.tsx`
- `apps/web/src/routes/casino.tsx`

주요 특징:

- TanStack Router를 수동 구성한다.
- Supabase client, React Query, shared i18n provider, shared UI package를 사용한다.
- auth 진입 화면은 한국 우선 UX, email/password 기본, magic-link 보조 구조로 정리되어 있다.
- wallet 출금은 `ConfirmDialog` 기반 최종 확인 UX를 가진다.
- casino 화면은 hash-before-bet, reveal 후 client verify 구조를 따른다.
- trade/staking/wallet/casino route는 사용자 흐름을 빠르게 담는 대신 파일 단위가 커지기 쉬운 구조다.

### `apps/admin`

역할: 운영자 앱.

핵심 route:

- `apps/admin/src/routes/__root.tsx`
- `apps/admin/src/routes/login.tsx`
- `apps/admin/src/routes/overview.tsx`
- `apps/admin/src/routes/alerts.tsx`
- `apps/admin/src/routes/queues.tsx`
- `apps/admin/src/routes/audit.tsx`
- `apps/admin/src/routes/operations.tsx`

주요 특징:

- web과 분리된 Vite 앱이다.
- root에서 인증, admin role, production AAL2 MFA 요구를 처리한다.
- 수동 운영 액션은 reason/audit 전제를 갖는 `AdminActionDialog` 흐름으로 분리되어 있다.
- 실제 보안 경계는 client UI가 아니라 Supabase RPC/RLS가 되어야 하며, 현재 구조도 그 방향을 따른다.

### 앱 표면의 고급 평가

강점:

- web/admin 분리 원칙이 살아 있다.
- 사용자 문구는 `@phonara/i18n` 중심으로 모인다.
- `@phonara/ui`는 i18n/business logic에 의존하지 않고 props로 문구를 받는다.
- 위험 액션 확인 UX가 이미 일부 핵심 흐름에 적용되어 있다.

개선 우선:

- `trade.tsx`, `wallet.tsx`, `casino.tsx`, admin `queues.tsx`는 route 안에 orchestration, UI, mutation handling이 함께 커질 위험이 있다.
- web/admin의 i18n/auth provider boilerplate가 유사해지고 있다. 단, 공통화는 보안 경계를 흐리지 않는 선에서만 해야 한다.
- web과 admin의 일부 dependency 버전이 다르다. 예: React Query, Zod, Tailwind plugin 버전이 앱별로 어긋난다. 장기 운영에서는 같은 major/minor로 맞추는 편이 안전하다.

## 5. Shared UI와 i18n

### `packages/ui`

공용 컴포넌트가 중앙에 모여 있다.

대표 컴포넌트:

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `modal.tsx`
- `confirm-dialog.tsx`
- `sheet.tsx`
- `data-table.tsx`
- `tabs.tsx`
- `tooltip.tsx`
- `money.tsx`
- `bet-panel.tsx`
- `fairness-verifier.tsx`
- `trading-chart.tsx`
- `order-book.tsx`

평가:

- 재사용 가능한 UI를 `@phonara/ui`에 두는 규칙과 잘 맞는다.
- token 기반 Tailwind v4 설계를 지향한다.
- 단일 barrel export인 `packages/ui/src/index.ts`가 공개 API 역할을 한다.
- DataTable, EmptyState류는 호출 측에서 localized copy를 반드시 넣어야 완전한 다국어 품질이 유지된다.

### `packages/i18n`

역할:

- ko/en message catalog.
- Korean default.
- key parity를 TypeScript로 강제.
- 앱별 provider에서 `useT()` 형태로 사용.

평가:

- JSX에 한국어를 직접 넣지 않는 원칙과 맞다.
- legal/auth/wallet/admin/game 등 제품 copy가 중앙화되는 방향이다.
- 카탈로그가 커지는 만큼 namespace 관리와 key naming convention이 중요해진다.

## 6. Domain Packages

### `packages/shared-types`

역할:

- Supabase generated database types.
- `Currency`, role, locale 등 수동 domain literal.

강점:

- 앱과 패키지가 DB 타입을 공유할 수 있다.
- RPC 반환/인자 drift를 줄인다.

주의:

- generated type과 수동 literal이 같은 package에 있으므로 regeneration discipline이 중요하다.
- local-only migration이 많을 때 타입 파일이 stale이 되면 앱 compile은 통과해도 runtime surface가 어긋날 수 있다.

### `packages/money`

역할:

- Decimal 설정.
- currency precision.
- canonical amount string.
- fee/FX/format helper.

핵심 정책:

- PHON/USDT는 6dp.
- KRW는 0dp.
- money 값은 JS float가 아니라 decimal string 중심.
- truncation과 formatting 책임을 중앙화한다.

평가:

- PHONARA의 가장 중요한 규칙인 금액 float 금지를 지탱하는 핵심 패키지다.
- 화면 표시와 엔진 계산 모두 이 package를 거치도록 더 강하게 수렴시키는 것이 장기적으로 맞다.

### `packages/wallet-ledger`

역할:

- 순수 TypeScript ledger 모델.
- runtime settlement의 권위는 SQL임을 명시한다.

평가:

- 설계 사고와 unit 검증에 유용하다.
- 실제 원장 진실은 Supabase RPC/trigger/table constraint이므로 TS 모델과 SQL 사이의 drift 감시가 계속 필요하다.

### `packages/trading-engine`

역할:

- spot, futures, staking 계산.
- SQL RPC와 parity를 맞춰야 하는 순수 엔진.

핵심 공식:

- futures open: margin, leverage, entry price로 notional, quantity, fee, liquidation price 계산.
- futures close: side에 따른 PnL, close fee, returned equity 계산.
- spot: buy/sell 각각 output 기준 fee 구조.
- staking: principal, APR, elapsed duration 기반 보상 계산.

평가:

- SQL `_fmt6`와 TS quantization을 맞추려는 의도가 명확하다.
- trading은 돈과 직접 연결되므로 parity 검증이 계속 가장 중요한 gate다.

### `packages/game-engine`

역할:

- server seed 생성.
- SHA-256 commitment.
- HMAC-SHA256 float stream.
- 6종 게임 deterministic result.
- reveal 후 verify.

구현된 게임:

- Crash
- Limbo
- Dice
- Mines
- HiLo
- Plinko

평가:

- plugin contract가 좋아 게임 추가/검증 확장이 가능하다.
- client-side verification 구조가 명확하다.
- 게임 확률, multiplier, RTP 영역에서 JS number 사용이 보인다. provably-fair float 자체에는 number가 자연스럽지만, 프로젝트 규칙은 odds/rate 영역에서도 Decimal을 요구하므로 정책상 정리가 필요하다.
- 일부 game settlement가 `decimal.js`를 직접 import한다. `@phonara/money`의 구성과 일원화하는 편이 장기적으로 더 단단하다.

## 7. Supabase / DB Surface

### 마이그레이션

`supabase/migrations`에는 79개 마이그레이션이 있다.

큰 축:

- Phase 1 auth/wallet/ledger.
- Phase 2 retention/reward.
- Phase 3 trading.
- P0/P1 hardening.
- S1/S2/S3/S4 casino/admin/ops.
- E foundation: system account hardening, hash-chain, reconciliation, solvency, treasury scope.
- Phase 5 deposit/withdraw/admin guard.
- Casino parity/hardening.
- Affiliate depth/tier/aggregate/settlement/approval.

강점:

- append-only ledger, hash-chain, reconciliation, kill switch, idempotency, RLS/GRANT pairing 같은 핵심 invariant가 SQL 레벨에 들어가 있다.
- SECURITY DEFINER 함수 search_path와 EXECUTE 권한을 의식한 migration 흐름이 보인다.
- `public_scope_hardening`, `wallet_ledger_write_guard`, `audit_logs_append_only` 등 출시 전 노출면 축소 작업이 실제로 진행되었다.

주의:

- local-only Build Log 항목이 많다. remote apply 여부와 local schema가 다를 수 있으므로 다음 DB 작업 전에는 반드시 migration history와 advisor를 다시 확인해야 한다.
- 마이그레이션 파일 수가 많아진 만큼 중복 RPC/policy/function signature 방지가 중요하다.

### SQL 검증

`supabase/tests`에는 tracked unique 37개 SQL 검증 파일이 있다.

대표 검증 축:

- conservation
- hardening
- anon lockdown
- grants/RLS inventory
- reward conservation
- futures parity
- casino schema/security/parity
- system account hardening/hash-chain/reconciliation
- Phase 5 deposit/withdraw/KYC/gates
- ops health/alerts
- audit logs append-only
- wallet ledger write guard
- affiliate relationship/tier/aggregate/settlement/approval

평가:

- 이 저장소의 가장 강한 부분이다. 단순 schema apply가 아니라 권한, 보존, race, idempotency, hash-chain, admin authz를 SQL로 직접 때린다.
- runner인 `scripts/run-sql-tests.ts`는 local Postgres 또는 Docker fallback을 고려한다.

## 8. CI / Quality Gates

루트 scripts:

- `check`: env, i18n, release, advisors, deps, typecheck, lint, unit, build.
- `test:sql`: SQL 검증 runner.
- `test:e2e`: Playwright.
- `check:pwa`: PWA gate.
- `check:release`: production TS/SQL surface에서 debug residue, focused spec, placeholder copy 등을 차단.

GitHub Actions:

- `quality`: env/i18n/release/typecheck/lint/unit/build/PWA.
- `advisors`: Supabase advisor 0 ERROR 목표.
- `advisory`: format check, 현재 continue-on-error.
- `sql`: local Supabase start, db reset, SQL 검증, casino TS-SQL parity.
- `e2e`: local Supabase + Chromium Playwright.

평가:

- CI는 문서 규칙을 꽤 잘 실행으로 옮겼다.
- local `bun run check`는 SQL/E2E/PWA 전체를 포함하지 않는다. CI보다 약한 local green이 나올 수 있다.
- format은 advisory라 drift가 허용된다. 출시 직전에는 강제 gate로 올리는 것이 낫다.
- advisor는 token이 없으면 local skip될 수 있다. 결과를 green으로 오해하면 안 된다.

## 9. 문서와 운영 기억

핵심 문서:

- `docs/PHONARA_V2_MASTER_PLAN.md`: source of truth + Build Log.
- `docs/PHONARA_WAVE_DRIVER.md`: wave별 실행 드라이버.
- `docs/QUALITY_GATES.md`: 품질 게이트 요약.
- `docs/FOLDER_STRUCTURE.md`: 경계 구조.
- `docs/SUPABASE_ACCESS_MATRIX.md`: DB access surface.
- `docs/OBSERVABILITY_PRIVACY.md`: 관측/개인정보.
- `docs/ADR/*`: 결정 기록.
- `.cursor/rules/*.mdc`: 작업 규칙.

평가:

- 문서화 수준은 강하다.
- Build Log가 길고 상세해 cross-session continuity에 유리하다.
- 단점은 마스터 플랜이 매우 커져 탐색 비용이 크다는 점이다. wave별 최신 상태를 추출하는 lightweight status 문서가 있으면 운영 속도가 더 좋아진다.

## 10. 강점 Top 12

1. 앱 경계가 명확하다: user app과 admin app이 분리되어 있다.
2. 재사용 UI는 `@phonara/ui`로 중앙화되어 있다.
3. i18n catalog가 ko/en typed parity를 가진다.
4. 돈 계산을 위한 Decimal package가 존재한다.
5. trading/game engine이 pure package로 분리되어 있다.
6. Supabase RPC/RLS 중심으로 서버 권위 경계를 세운다.
7. append-only ledger, hash-chain, reconciliation 계층이 있다.
8. SQL 검증이 권한/보존/race/idempotency를 직접 검증한다.
9. Playwright가 local Supabase stack과 붙도록 구성되어 있다.
10. CI가 db reset, SQL 검증, E2E를 별도 job으로 가진다.
11. release gate가 production TS/SQL surface의 잔여 개발 흔적을 막는다.
12. Build Log가 상세해 다음 세션이 맥락을 복구하기 쉽다.

## 11. 리스크와 개선 우선순위

### P0: 계속 건드리면 반드시 다시 확인할 영역

- Supabase remote/local drift: Build Log상 local-only 항목이 많다. DB 작업 전 `supabase db reset`, migration history, advisor 결과를 반드시 다시 맞춰야 한다.
- 게임 odds/multiplier numeric policy: `game-engine`의 JS number 사용 경계가 프로젝트 규칙과 긴장한다. provably-fair float와 payout/odds/multiplier를 정책상 분리해야 한다.
- local check와 CI gate 차이: 개발자가 `bun run check`만 보고 전체 green으로 착각할 수 있다.

### P1: 구조 개선

- route 파일 비대화: `trade.tsx`, `wallet.tsx`, `casino.tsx`, admin `queues.tsx`는 feature module로 얇게 나눌 후보다.
- dependency version alignment: web/admin의 React Query, Zod, Tailwind 관련 버전을 맞추는 것이 좋다.
- generated type discipline: `database.types.ts` 재생성 시점과 migration 적용 상태를 문서/스크립트로 더 강제해야 한다.
- app provider duplication: web/admin i18n/auth boilerplate를 무리하지 않는 선에서 정리할 수 있다.

### P2: 운영 품질

- format advisory를 mandatory로 승격할 시점 결정.
- local `check`에 SQL/E2E/PWA를 전부 넣을지, 별도 `check:full`을 둘지 결정.
- long master plan에서 최신 상태만 추출한 `CURRENT_STATUS` 성격의 문서를 둘지 결정.

## 12. 다음 실행 추천

가장 보수적이고 생산적인 순서:

1. DB 작업을 시작하기 전 remote/local schema 상태를 재확인한다.
2. `game-engine` numeric boundary를 설계 결정으로 정리한다: random float generation은 number 허용, odds/payout/multiplier는 Decimal string으로 수렴하는 식의 명시적 경계가 필요하다.
3. `bun run check:full` 같은 운영자용 전체 gate를 만든다. 내부 구성은 env/i18n/release/advisors/deps/typecheck/lint/unit/build/PWA/db reset/SQL/E2E.
4. web/admin dependency 버전을 정렬한다.
5. `trade`, `wallet`, `casino`, `admin queues`의 route-local complexity를 feature hook/component로 분해하되, 중복 컴포넌트는 `@phonara/ui`에만 둔다.

## 13. 세계 1위 팀 기준 판정

현재 저장소는 "초기 장난감 앱"이 아니라, 돈/권한/원장/검증을 실제로 고려한 고위험 제품형 구조에 가깝다. 특히 Supabase SQL hardening과 SQL 검증 깊이는 일반적인 스타트업 MVP보다 훨씬 앞서 있다.

다만 세계 최상위 팀 기준으로는 다음 4가지를 끝까지 밀어야 한다.

- 숫자 정책의 완전 일관성: money, odds, multiplier, fee, FX가 어디서나 같은 규칙을 따른다.
- remote/local/typed schema drift 0: migration, generated types, deployed RPC가 항상 한 몸처럼 움직인다.
- 앱 복잡도 제어: route가 feature shell이 되고, orchestration은 hook/service, 재사용 UI는 package로 이동한다.
- gate 정직성: local green, CI green, release green이 같은 의미를 갖는다.

이 네 가지를 닫으면 PHONARA는 단순히 "작동하는 서비스"가 아니라, 유지보수 가능한 금융성 게임/트레이딩 플랫폼의 골격을 갖춘다.
