# Pillar 6 — Performance (R9-PERF-JS · 정적 hotspot)

> **감사일:** 2026-07-13 · **READ-ONLY** — 로컬 build/Lighthouse 미실행 (G13 · 저사양) · R9 Stage1 Evidence 인용
> **Baseline:** [`r9-stage1-matrix.md`](../../OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix.md) (SHA `dcfd8c7e` · preview 실측)

## 점수

| 항목            |                         점수 |
| --------------- | ---------------------------: |
| **Performance** | **58 / 100** (Material gaps) |

감점 근거: **R9-PERF-JS OPEN (HIGH)** — Web initial JS 539kb > SLO 450kb, web 21/21 state FAIL. LCP·console·overflow는 전 상태 PASS이고 Admin은 SLO 충족(402kb)이므로 50 미만은 아님.

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

| ID                  | 심각도 | 상태     | 내용                                                                                                   |
| ------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| (링크) `R9-PERF-JS` | HIGH   | **OPEN** | Web initial JS 539>450kb — Release Gate `dod-findings`·`runtime-stage1` FAIL의 단일 원인               |
| SA-06               | LOW    | OPEN     | route-level code-split 커버리지·i18n 카탈로그 lazy 여부 미계측 — R9-PERF-JS 수정 설계의 선행 계측 필요 |

## 5. NOT VERIFIED

- production build 번들 구성 분석 (operator 승인 시만 — 저사양)
- 실기기 CWV · 3G/4G 네트워크 프로파일
