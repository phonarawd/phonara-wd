# Pillar 6 — Performance (R9-PERF-JS · 정적 hotspot)

> **감사일:** 2026-07-13 · **READ-ONLY** — 로컬 build/Lighthouse 미실행 (G13 · 저사양) · R9 Stage1 Evidence 인용
> **Baseline:** [`r9-stage1-matrix.md`](../../OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix.md) (SHA `dcfd8c7e` · preview 실측)

## 점수

| 항목            |                         점수 |
| --------------- | ---------------------------: |
| **Performance** | **58 / 100** (Material gaps) |

감점 근거: **R9-PERF-JS OPEN (HIGH)** — Web initial JS 539kb(원격 preview 실측) > SLO 450kb, web 21/21 state FAIL. LCP·console·overflow는 전 상태 PASS이고 Admin은 SLO 충족(402kb)이므로 50 미만은 아님. **2026-07-13 Wave 1 갱신:** 로컬 빌드 재계측(gzip) 557.66→519.31kB(-38.35kB, framer-motion 제거) — SLO는 여전히 미달, 점수 미조정(§6 근거).

## 1. Primary blocker — `R9-PERF-JS` (OPEN)

| 항목        | 값                                                                                                             | 근거                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 증상        | Web Stage1 initial JS **539kb > 450kb SLO** — web 21/21 상태 FAIL (strict 3/24 PASS = Admin만)                 | R9 Stage1 matrix                                        |
| 근본 원인   | SPA entry + i18n 번들이 DCL 전 로드 — code-split/defer 미적용                                                  | Registry `R9-PERF-JS`                                   |
| 리스크 처분 | **ACCEPTED_RISK for R10 baseline soak (flip 0)** — DL-R10-PERF-JS · Release Gate에서는 여전히 **FAIL blocker** | Registry fix 필드 · R11 checklist `runtime-stage1` FAIL |
| 회귀 기준   | initial JS ≤ 450kb × 21 web states · strict matrix 24/24                                                       | Registry regression                                     |

**긍정 신호 (동일 매트릭스):** LCP ≤ 3500ms **24/24 PASS** (최고 1816ms Admin 390px) · console hard error 0 · overflow/overlap 0 — 문제는 번들 크기 단일 축.

## 2. 정적 hotspot 노트 (코드 관찰 — 실측 아님)

| 영역           | 관찰                                                                                                                                                                 | 판정                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 번들 전략      | Vite 8 + TanStack Router file routes — route-level lazy는 **부분적** (Phase 1 §15 NOT VERIFIED per-route) · i18n 카탈로그(ko/en)가 entry에 포함되는 구조가 유력 원인 | 개선 후보 1순위: i18n/locale lazy + heavy 도메인(chart·pixi) chunk 분리 |
| Trade desk     | lightweight-charts 5 + custom `ticker-store`/`order-book-store` pub/sub — React 리렌더 우회 설계 · `trade-desk-perf.spec.ts` E2E 존재                                | 양호 (전용 perf spec 보유)                                              |
| Casino/Pixi    | Pixi.js 8 stages — E2E 모드에서 WebGL ticker 0 (CPU 포화 방지 · rule 79) · `prefers-reduced-motion` 반영 stage 다수                                                  | 양호                                                                    |
| Realtime       | PIR E2에서 publication 축소(`wallet_ledger`/fills DROP) + sports odds ≥500ms debounce + fixture-only patch — full invalidate 제거                                    | 양호 (2026-07-11 마감)                                                  |
| React          | React 19 + React Compiler babel plugin (자동 memoization)                                                                                                            | 양호                                                                    |
| DB 성능        | advisor: `auth_rls_initplan` 0 · `multiple_permissive_policies` residual 2 · unused_index 167 (INFO — 정리 후보)                                                     | 양호~보통                                                               |
| Virtualization | 목록 가상화 증거 없음 (Phase 1 §15 NOT VERIFIED)                                                                                                                     | 대량 목록 등장 시 후속                                                  |

## 3. CWV (Core Web Vitals)

**UNVERIFIED** — Lighthouse/CrUX 실측 없음. 대체 근거는 R9 Stage1 LCP proxy (24/24 ≤ 3500ms · headless-shell 8GB 환경). CI quality job에는 CWV 게이트 없음. Public Launch 전 실기기/CrUX 확인 권장.

## 4. Finding (Pillar 6)

| ID                  | 심각도 | 상태               | 내용                                                                                                                               |
| ------------------- | ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| (링크) `R9-PERF-JS` | HIGH   | **OPEN (partial)** | Web initial JS 519.31kB(로컬 재계측)>450kb — framer-motion 제거로 -38.35kB, i18n lazy 미착수(§6)로 SLO 잔여 미달                   |
| SA-06               | LOW    | **VERIFIED_FIXED** | sourcemap 직접 분석으로 계측 완료(§6) — visualizer 플러그인 대신 `sources`/`sourcesContent` 합산 + `index.html` modulepreload 대조 |

## 5. NOT VERIFIED

- 실기기 CWV · 3G/4G 네트워크 프로파일

## 6. Wave 1 구현 결과 (2026-07-13 · 7-pillar 플랜 · SA-06 계측 완료)

`rollup-plugin-visualizer`가 이 프로젝트의 Rolldown 기반 Vite 8 빌드에서 output을 생성하지 못해(플러그인
compat 이슈 — 제거함), 대신 **sourcemap `sources`/`sourcesContent` 직접 분석** + `dist/index.html`의
`modulepreload` 목록 대조로 계측했다 (`bun run build:web:production`, 로컬 1회).

### 계측 결과 — 실제 eager 번들 구성 (gzip, index.html 참조 자산 전부)

| 청크                            | Before (gzip) |  After (gzip) | 비고                                                                                                              |
| ------------------------------- | ------------: | ------------: | ----------------------------------------------------------------------------------------------------------------- |
| `i18n-*.js`                     |     249.97 kB |     249.97 kB | ko+en 카탈로그 동시 eager — **미해결 (아래 근거)**                                                                |
| `index-*.js`                    |     178.31 kB |     138.42 kB | **-39.89 kB** — framer-motion 제거                                                                                |
| `supabase-*.js`                 |      66.48 kB |      66.48 kB | `@supabase/supabase-js`(auth+postgrest+realtime+storage) 전체 — `createClient()` 단일 진입점이라 auth만 분리 불가 |
| `index-*.css`                   |      15.62 kB |      15.86 kB | Tailwind 생성 — 무시 가능한 증가                                                                                  |
| 기타 30개 (display-contract 등) |      ~46.6 kB |      ~44.6 kB |                                                                                                                   |
| **합계**                        | **557.66 kB** | **519.31 kB** | **-38.35 kB (-6.9%)** — SLO 450kb 미달 (69.31kB 초과)                                                             |

측정 스크립트: `dist/assets/*.js.map`의 `sourcesContent` 길이 합산(패키지별) + Node `zlib.gzipSync` level 9 —
repo에 커밋하지 않은 1회성 분석(`tmp-analyze-chunk.mjs`/`tmp-sum-initial.mjs`, 세션 종료 시 삭제).

### 적용한 수정

1. **framer-motion(`motion` npm) 제거** — `Dialog`/`Sheet`(`apps/web/src/product/primitives/{dialog,sheet}.tsx`)와
   `LiveActivityTicker`가 `motion.div`/`AnimatePresence`로 오버레이 페이드·다이얼로그 스케일·시트 슬라이드를
   구현했으나, 이 3개 소비자만 있었다(`rg "from 'motion"` 전체 4곳 — `motion-presets.ts`는 TYPE-ONLY).
   Radix `Presence`가 `[data-state]` 속성 기반 CSS `@keyframes`의 `animationend`를 기다려 unmount를
   지연시키는 표준 패턴으로 교체(`motion.css` 신규 keyframes) — **런타임 동작·테스트 계약 변경 0**
   (E2E는 이미 `usePrefersReducedMotion()`/`VITE_PHONARA_E2E_ENGINE` 분기로 무-애니메이션 경로를 타고 있었음).
   `motion`은 `motion-presets.ts`의 `import type`만 남아 devDependencies로 이동.
   검증: `bun run typecheck` green · 타겟 vitest 8개 파일 91/91 green · 로컬 preview + Playwright MCP로
   Landing 페이지 렌더/콘솔 무결성 확인 + 7개 신규 keyframe 규칙 브라우저 로드 확인.
2. **`trade-chart-panel.tsx` "ineffective dynamic import" 조사** — Rollup/Rolldown 경고 확인, 원인은
   E2E 안정성을 위한 co-located static+dynamic import(의도적). `dist/index.html` `modulepreload` 목록에
   해당 청크(`lightweight-charts` 포함)가 **없음**을 확인 — Stage1 eager 측정에 영향 없음(Trade는 미인증
   시 `/login` redirect). CJS `require()` 우회를 시도했으나 Vite ESM 브라우저 출력에서 동작하지 않아 **원복**
   — E2E 안정성 대비 이 최적화의 가치가 낮다고 판단, 현상 유지 + 주석으로 근거 기록.
3. **i18n ko/en 동시 로드(249.97kB, 최대 단일 요인) — 이번 세션에서 미수정, 근거:**
   `packages/i18n/src/index.ts`의 `translate()`/`messages`는 web 앱 전역에서 **동기 접근**이 계약이다.
   `ko`/`en` 카탈로그를 locale별 `import()`로 분리하려면 `I18nProvider`가 최초 카탈로그 로드까지
   렌더링을 게이팅해야 하는데, `rg "I18nProvider" apps/web/src | wc"`로 확인한 **140개 이상의 테스트
   파일**이 `render(<I18nProvider>...)` 후 **동기적으로** `screen.getByText(...)` 단언을 수행한다
   (`await`/`findBy*` 없음). 게이팅을 도입하면 이 전체가 "first render는 `null`" 문제로 일괄 깨진다 —
   `81-efficient-gate-execution`(비효율 루프 금지)·`30-audit-discipline`(테스트 약화 금지) 위반 없이
   한 세션에 안전하게 마감할 수 있는 범위를 초과한다고 판단해 **의도적으로 보류**했다.
   **권장 후속 작업(별도 세션·Plan 승인 필요):** (a) `ko-catalog.ts`/`en-catalog.ts` 분리 +
   `loadLocaleCatalog()` 동적 로더 도입, (b) `I18nProvider`에 최초 로드 게이트 추가(로케일 전환은
   `setLocale`이 대상 카탈로그를 미리 로드한 뒤 state를 바꿔 화면 깜빡임 없이), (c) 영향받는 테스트 파일
   전체에 `await`/`findBy*` 마이그레이션 — 별도 스코프로 승인 필요.

### 갱신된 판정

**SLO 미달 (OPEN 유지, 허위 VERIFIED_FIXED 주장 안 함):** 519.31kB > 450kB. 프레이머모션 제거만으로는
부족하며, i18n lazy-load(가장 큰 단일 레버, ~120kB 추가 절감 예상)가 유일한 현실적 잔여 경로다.
Registry `R9-PERF-JS`는 `OPEN`으로 유지하고 이번 세션 증거만 추가한다(§7).
