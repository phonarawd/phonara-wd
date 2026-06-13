# PHONARA UI/UX Rebuild Log

이 문서는 PHONARA UI/UX 전면 리빌드의 별도 작업 기록이다. 실행 순서는
`C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`를 따른다.

## 2026-06-13

### P0 Baseline

상태: 완료

확인한 기준선:

- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run typecheck` 통과
- `bun run lint` 통과
- `bun run build` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

시각 기준선:

- `test-results/visual`에 landing, auth, app routes, casino routes, admin routes 캡처 생성
- PC/VPN 지연을 감안해 visual spec timeout은 기존 인계대로 300초 상태 유지

관찰:

- 빌드는 성공했으며 web/admin production build에서 기존 대형 chunk 경고만 남음
- 작업트리에 선행 UI 변경과 생성 산출물이 많아 기존 변경은 되돌리지 않고 현재 상태를 기준선으로 확정

### P0 Reference Board

상태: 완료

확인한 레퍼런스:

- Cursor asset 경로 4장 확인
- 프로젝트 루트에 올라온 동일한 4장도 썸네일 기준으로 재확인

매핑:

- 1번 이미지: 전체 IA reference. `Earn / Live Games / Pro Trading / Wallet & Trust`를 한 화면에서 이해시키는 command-center 방향
- 2번 이미지: mobile/desktop split reference. 모바일은 한 손 조작, bottom nav, mission/game quick action. 데스크톱은 trading/workstation
- 3번 이미지: design-system board reference. color/type/components/states/performance/engine-do-not-touch 기준
- 4번 이미지: desktop hub reference. `Earn`, `Live Games`, `Pro Trading`, `Wallet/Activity` 고밀도 멀티패널 방향

적용 원칙:

- 형태 복제 금지
- AI mockup 느낌 금지
- 쇼츠/인물/부업 이미지는 `reward task`, `daily mission`, `short reward action` 같은 절제된 제품 UX로 재해석
- dark graphite surface, mint glow, sharp panel borders, precise numeric UI, premium command-center mood만 추출

### Phase 1 Token: Color

상태: 완료

변경 파일:

- `apps/web/src/theme.css`
- `apps/admin/src/theme.css`

작업 내용:

- OKLCH 기반 graphite surface ladder를 `bg`, `surface-inset`, `surface`, `surface-2`, `surface-elevated`, `surface-raised`로 정리
- `primary`, `primary-hover`, `primary-active`, `primary-luminous`, `primary-bright`, `primary-glow`, `primary-glow-strong` 추가
- `border-subtle`, `border`, `border-strong`, `divider`를 graphite panel border 기준으로 재정의
- semantic color에 foreground token 추가: `up-fg`, `down-fg`, `danger-fg`, `risk-fg`, `info-fg`
- danger button contrast를 위해 `danger`와 text용 `negative/down` 역할을 분리
- web 레거시 RGB/HSL bridge의 primary 값을 mint 계열로 동기화
- admin theme도 web token과 같은 color basis로 동기화

대비 검증:

- `fg/bg`: 18.42
- `muted/bg`: 9.33
- `subtle/surface`: 5.16
- `primary/bg`: 13.25
- `primaryFg/primary`: 12.82
- `up/bg`: 11.24
- `down/bg`: 4.70
- `dangerFg/danger`: 4.83
- `warningFg/warning`: 10.91
- `fg/elevated`: 15.45

검증:

- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Phase 1 Token: Typography

상태: 완료

변경 파일:

- `apps/web/src/theme.css`
- `apps/admin/src/theme.css`

작업 내용:

- Pretendard variable 기반 타입스케일 token 추가: `display`, `title`, `heading`, `subheading`, `body`, `label`, `caption`, `numeric`
- 각 단계별 line-height, letter-spacing, weight token 추가
- `--font-numeric` 추가
- `font-feature-settings: "tnum" 1, "ss01" 1`와 전역 `font-variant-numeric: tabular-nums` 유지
- admin theme의 sans stack을 Pretendard 우선으로 동기화

검증:

- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Phase 1 Token: Depth And Light

상태: 완료

변경 파일:

- `apps/web/src/theme.css`
- `apps/admin/src/theme.css`

작업 내용:

- `surface-highlight`, `surface-highlight-strong`, `surface-inset-shadow` 추가
- layered elevation token 재정의: `elevation-1`, `elevation-2`, `elevation-sheet`
- `overlay-scrim`, `glass-panel`, `glass-panel-strong`, `glass-blur`, `glass-saturation` 추가
- `ambient-mint-glow`, `ambient-edge-glow`, `noise-opacity` 추가
- web/admin token drift 방지를 위해 양쪽에 동일한 depth/light basis 적용

검증:

- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과

### Phase 1 Token: Space, Radius, Density

상태: 완료

변경 파일:

- `apps/web/src/theme.css`
- `apps/admin/src/theme.css`

작업 내용:

- 4px rhythm spacing token 추가: `space-1`부터 `space-12`
- radius token 재정의: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `pill`
- density token 추가:
  - compact control, large control, row, gap, panel padding
  - comfortable control, large control, row, gap, panel padding
  - `touch-target-min`
- Phase 2 `@phonara/ui`와 Phase 3 shell density injection에서 참조할 토큰 기반 마련

검증:

- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과

### Current Progress

### Phase 1 Token: Motion

상태: 완료

변경 파일:

- `apps/web/src/theme.css`
- `apps/admin/src/theme.css`
- `apps/web/src/styles.css`
- `apps/admin/src/styles.css`
- `package.json`
- `bun.lock`

작업 내용:

- native-only motion token 확장:
  - `motion-duration-instant`
  - `motion-duration-4`
  - `motion-duration-anticipation`
  - `motion-duration-reveal`
  - `motion-duration-confirmation`
  - `motion-duration-settlement`
  - `motion-ease-linear`
  - `motion-ease-spring`
  - `motion-ease-press`
  - `motion-stagger-step`
  - `motion-press-scale`
- web/admin 전역 reduced-motion guard 추가
- Tailwind `animate-spin`, `animate-pulse`도 reduced motion에서 정지되도록 보강
- 미사용 금지 의존성 `framer-motion`, `lucide-react` 제거

검증:

- 앱/패키지 코드에서 `framer-motion`, `lucide-react`, `AnimatePresence`, `motion.*` import 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Phase 1 Forbidden Patterns Gate

상태: 완료

확인 내용:

- 앱/패키지 코드에 `framer-motion`, `lucide-react`, `AnimatePresence`, `motion.*` 사용 없음
- 앱/패키지 코드에 `Lovable`, `v0 default`, `Tailwind demo`, `generic card grid`, `excessive neon`, `crypto scam`, `fake glassmorphism` 유입 없음
- `package.json`에서 `framer-motion`, `lucide-react` 제거됨
- PWA 브랜드 아이콘의 이전 violet `#6366f1` 잔여 제거

변경 파일:

- `apps/web/public/phonara-icon.svg`
- `package.json`
- `bun.lock`

검증:

- 앱/패키지 금지 패턴 검색 통과
- 수정 파일 linter diagnostics 없음

### Phase 1 Verify

상태: 완료

검증:

- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bun run typecheck` 통과
- `bun run build` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 남아 있으나 빌드 실패는 아님
- `visual.spec.ts`는 토큰 변경 후 landing/auth/app/casino/admin routes 렌더 smoke를 다시 통과

### Phase 2 UI: Icon

상태: 완료

변경 파일:

- `packages/ui/src/components/icon.tsx`
- `packages/ui/src/index.ts`

작업 내용:

- in-house SVG `Icon` primitive 추가
- `IconName` union과 `iconPaths` registry 정의
- `iconVariants` cva 추가: size `xs/sm/md/lg/xl`, tone `current/muted/primary/up/down/warning/danger/trust`
- SVG root에 `forwardRef` 적용
- `title`이 있으면 `role="img"`와 고유 `aria-labelledby` 제공
- `title`이 없으면 장식 아이콘으로 `aria-hidden` 처리
- 공식 배럴 `packages/ui/src/index.ts`에서 named export
- 외부 icon library 사용 없음

`@phonara/ui` 배치 사유:

- 아이콘은 web/admin/shell/domain components 전반에서 재사용되는 primitive라 앱 내부가 아니라 shared UI 패키지 소유가 맞음

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- 수정 파일 linter diagnostics 없음

### Phase 2 UI: Number, Ticker, Progress, Icon Button

상태: 완료

변경 파일:

- `packages/ui/src/components/animated-number.tsx`
- `packages/ui/src/components/ticker.tsx`
- `packages/ui/src/components/progress.tsx`
- `packages/ui/src/components/icon-button.tsx`
- `packages/ui/src/index.ts`

작업 내용:

- `AnimatedNumber` 추가
  - Decimal-like 입력을 구조적으로 수용: `string | { toString(): string }`
  - float 산술 보간 없이 문자열 기반 decimal compare로 방향성만 판단
  - rAF로 flash state만 스케줄링
- `Ticker` 추가
  - label/value/suffix 구성
  - compact/comfortable density variant
  - up/down/flat 방향성 surface flash
- `Progress` 추가
  - token 기반 progressbar
  - `role="progressbar"` 및 `aria-valuenow/min/max`
- `IconButton` 추가
  - 기존 `Button`과 `Icon` 조합
  - 접근성 label 필수
- 공식 배럴 export 추가

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- 수정 파일 linter diagnostics 없음
- 새 number/ticker 컴포넌트에 `Number()`, `parseFloat`, `parseInt` 사용 없음

### Phase 2 UI: Core Primitives 1

상태: 완료

변경 파일:

- `packages/ui/src/components/button.tsx`
- `packages/ui/src/components/card.tsx`
- `packages/ui/src/components/input.tsx`
- `packages/ui/src/index.ts`

작업 내용:

- `Button`
  - loading/loadingLabel prop 추가
  - `aria-busy`, loading spinner, disabled handling 추가
  - primary sheen, press scale, tokenized elevation/semantic danger/success 색상 적용
  - 기존 props와 named export 유지
- `Card`
  - `cardVariants` cva export 추가
  - elevation surface refinement
  - interactive hover state 추가
  - density prop 구조 추가
- `Input`
  - prefix/suffix slot 추가
  - helperText/errorText 추가
  - errorText가 있으면 invalid state와 `aria-describedby` 자동 연결
  - monetary tabular numeric behavior 유지
- 공식 배럴 export 갱신

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Current Progress

### Phase 2 UI: Core Primitives 2

상태: 완료

변경 파일:

- `packages/ui/src/components/segmented-control.tsx`
- `packages/ui/src/components/tabs.tsx`
- `packages/ui/src/components/slider.tsx`
- `packages/ui/src/components/badge.tsx`
- `packages/ui/src/components/stat.tsx`
- `packages/ui/src/components/skeleton.tsx`
- `packages/ui/src/components/spinner.tsx`
- `packages/ui/src/index.ts`

작업 내용:

- `SegmentedControl`: density prop, tokenized active pill, inset container surface
- `Tabs`: TabList/TabTrigger density prop, tokenized active surface
- `Slider`: density prop, primary/risk/up/down fill tones, risk gradient
- `Badge`: density prop, refined surface highlight
- `Stat`: density prop, numeric emphasis variants, exported `statValueVariants`
- `Skeleton`: shape/density variants, exported `skeletonVariants`
- `Spinner`: tone variants, exported `spinnerVariants`
- 공식 배럴 export 갱신

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

관찰:

- `packages/ui/src/components/data-table.tsx`의 legacy `hover:bg-white/[0.02]`는 `p2-table` 범위에서 정리 예정

### Current Progress

### Phase 2 UI: Money

상태: 완료

변경 파일:

- `packages/ui/src/components/money.tsx`

작업 내용:

- 기존 `@phonara/money` 기반 formatter 유지
- `ticker`, `previousAmount`, `tickerLabel`, `tickerDensity`, `tickerDirection` prop 추가
- ticker mode에서도 `formatMoney()`를 통해 currency precision/formatting 유지
- hero emphasis에 tokenized tracking/drop shadow treatment 추가
- `data-tone` 추가로 positive/negative/neutral state styling hook 제공

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음
- `money.tsx`에 `Number()`, `parseFloat`, `parseInt`, `toNumber` 사용 없음

### Current Progress

### Phase 2 UI: Overlay Primitives

상태: 완료

변경 파일:

- `packages/ui/src/components/modal.tsx`
- `packages/ui/src/components/sheet.tsx`
- `packages/ui/src/components/confirm-dialog.tsx`
- `packages/ui/src/components/tooltip.tsx`
- `packages/ui/src/components/toast.tsx`
- `apps/admin/src/styles.css`

작업 내용:

- `Modal`
  - portal, scroll lock, focus trap, focus restore 유지
  - tokenized overlay scrim, glass panel, sheet elevation, spring enter motion 적용
- `Sheet`
  - ESC close 유지
  - scroll lock 추가
  - focus entry 및 Tab containment 추가
  - tokenized scrim/panel/motion 적용
- `ConfirmDialog`
  - Modal 기반 유지
  - busy 상태를 Button loading prop과 연결
  - notice/summary surface tokenized
- `Tooltip`
  - id/aria-describedby 연결
  - tokenized glass surface와 enter motion 적용
- `Toast`
  - severity별 `status`/`alert` role 분기
  - density variant 추가
  - tokenized surface/elevation/motion 적용
- admin 앱에 shared `pn-rise` keyframe alias 추가

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Current Progress

### Phase 2 UI: State System

상태: 완료

변경 파일:

- `packages/ui/src/components/state-surface.tsx`
- `packages/ui/src/components/empty-state.tsx`
- `packages/ui/src/components/error-state.tsx`
- `packages/ui/src/components/status-timeline.tsx`
- `packages/ui/src/components/data-table.tsx`
- `packages/ui/src/index.ts`

작업 내용:

- `StateSurface` generic state primitive 추가
  - states: `loading`, `skeleton`, `empty`, `success`, `warning`, `error`, `offline`, `reconnecting`
  - caller-injected title/description/action only
  - loading/skeleton states reserve layout with Spinner/Skeleton
  - warning/error/offline states use alert role
- `EmptyState`, `ErrorState`는 기존 API를 유지하면서 `StateSurface`에 위임
- `StatusTimeline` state 확장: `success`, `warning`, `offline`, `reconnecting`
- `DataTable` raw fallback `—` 제거
- `DataTable` loading row를 Skeleton 기반으로 변경
- `DataTable` legacy white hover 제거
- 공식 배럴 export 추가

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Current Progress

### Phase 2 UI: Data Table And Domain States

상태: 완료

변경 파일:

- `packages/ui/src/components/data-table.tsx`

작업 내용:

- `DataTable` sticky header 기본 활성화
- row density token 적용
- sortable column header slot 추가
- `aria-sort` 연결
- `maxBodyHeight` 기반 scroll container 추가
- optional fixed-row windowing 추가:
  - `virtualized`
  - `estimatedRowHeight`
  - `overscan`
- raw empty fallback 제거
- loading row는 `Skeleton` 사용
- legacy `hover:bg-white/[0.02]` 제거

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- 수정 파일 linter diagnostics 없음

### Verification Snapshot

상태: 통과

검증:

- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님

### Current Progress

### Phase 2 UI: Trade Domain Components

상태: 완료

변경 파일:

- `packages/ui/src/components/order-book.tsx`
- `packages/ui/src/components/trading-chart.tsx`
- `apps/web/src/features/trading/futures-panel.tsx`
- `packages/i18n/src/index.ts`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- `OrderBook`
  - 기존 `OrderBook` API와 Decimal 기반 depth 계산 유지
  - live depth badge, bid/ask depth bar hover treatment, spread/midpoint row 추가
  - loading/empty/error를 `StateSurface` + `Skeleton` 기반으로 정리
  - retry 액션은 호출 측 label/onRetry 주입 구조 유지
- `TradingChart`
  - lightweight-charts import, chart 생성, candle/line/volume series, oracle/liquidation price line 로직 유지
  - oracle line, liquidation line, synced state, approaching liquidation badge/surface 추가
  - loading/empty/error를 `StateSurface` 기반으로 정리
  - disclosure/warning surface를 chart policy rail에 통합
- `apps/web` 호출부
  - 새 chart/order-book 문구를 `useT()`로 주입
  - JSX 하드코딩 문구 없이 `packages/i18n` ko/en 키 추가

검증:

- 수정 파일 linter diagnostics 없음
- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님
- `docs/PHONARA_V2_MASTER_PLAN.md`는 현재 Cursor file tool에서 permission denied로 읽기/갱신 불가

### Current Progress

### Phase 2 UI: Casino Domain Components

상태: 완료

변경 파일:

- `packages/ui/src/components/bet-panel.tsx`
- `packages/ui/src/components/game-stake-input.tsx`
- `packages/ui/src/components/multiplier-display.tsx`
- `packages/ui/src/components/fairness-verifier.tsx`
- `packages/ui/src/components/provably-fair-badge.tsx`
- `packages/ui/src/index.ts`
- `apps/web/src/routes/casino.tsx`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- `BetPanel`
  - `betPanelVariants` 추가
  - casino/risk/default tone, compact/comfortable density, optional icon, tokenized top highlight/elevation 적용
  - 기존 title/description/actions/children API 유지
- `GameStakeInput`
  - 내부 `Input` prop 타입 기반으로 정리
  - `monetary`, currency suffix, helper/error text path를 shared `Input`에 위임
- `MultiplierDisplay`
  - density/emphasis/description prop 추가
  - payout/result numeric surface에 tokenized highlight와 semantic tone 적용
- `FairnessVerifier`
  - `fairnessVerifierVariants` 추가
  - hash commit → server seed reveal → result verification sequence rail 추가
  - pending/verified/mismatch state surface 추가
  - 실제 `verifyRound`/RPC/settlement 로직은 변경 없음
- `ProvablyFairBadge`
  - in-house `Icon` 사용
  - pending/verified/mismatch status tone 추가
- `apps/web` 카지노 호출부
  - `BetPanel` casino tone 적용
  - `FairnessVerifier`에 server seed/result labels를 항상 주입해 pending sequence가 보이도록 변경
  - raw `-` fallback을 기존 i18n 대기 문구로 교체

검증:

- 수정 파일 linter diagnostics 없음
- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- lint 1차에서 `FairnessVerifier` 미사용 변수 1건이 잡혀 제거 후 재실행 통과
- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 2 UI: Game Animation Primitives

상태: 완료

변경 파일:

- `packages/ui/src/components/crash-curve.tsx`
- `packages/ui/src/components/plinko-board.tsx`
- `packages/ui/src/components/mines-grid.tsx`
- `packages/ui/src/components/dice-track.tsx`
- `packages/ui/src/components/limbo-meter.tsx`
- `packages/ui/src/components/hilo-cards.tsx`
- `packages/ui/src/index.ts`
- `apps/web/src/routes/casino.tsx`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- `CrashCurve`, `LimboMeter`, `DiceTrack`, `MinesGrid`, `PlinkoBoard`, `HiLoCards`를 `@phonara/ui`에 추가
- 모든 game animation primitive는 presentation-only:
  - selection/result props를 받아 시각화만 수행
  - engine result, odds, payout, fairness 계산 없음
  - money/odds/PnL float 산술 추가 없음
- `packages/ui/src/index.ts` 공식 배럴 export 추가
- `apps/web/src/routes/casino.tsx`
  - 현재 `gameCode`에 맞는 animation primitive를 표시
  - `bet.result`는 계산 없이 표시용 JSON evidence로만 전달
  - `Record<string, unknown>` selection 접근은 strict TS에 맞춰 bracket access 변수로 정리

검증:

- 수정 파일 linter diagnostics 없음
- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- typecheck 1차에서 `selection.autoCashout` 등 index signature dot access가 잡혀 bracket access 변수로 수정 후 통과
- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 2 UI: Closeout

상태: 완료

확인 내용:

- `packages/ui/src/index.ts` 배럴 export 정리 확인
- Phase 2 신규/확장 컴포넌트 prop/type export 확인
- `@phonara/ui` 신규 game animation primitives export 확인:
  - `CrashCurve`
  - `PlinkoBoard`
  - `MinesGrid`
  - `DiceTrack`
  - `LimboMeter`
  - `HiLoCards`
- 수정 파일 linter diagnostics 없음

검증:

- `bun run build:packages` 통과
- `bun run typecheck` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

### Current Progress

### Phase 3 Shell: Desktop App Shell

상태: 완료

변경 파일:

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/styles.css`
- `packages/i18n/src/index.ts`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- 기존 `NAV`, route active resolution, locale toggle, signOut flow 유지
- desktop top nav에 in-house `Icon`과 active underline indicator 추가
- desktop brand에 compact subtitle 추가
- desktop header에 PHON available balance pill 추가
  - `Money` 사용
  - AppShell은 realtime subscription을 만들지 않고 wallet query cache만 읽도록 구현
  - 기존 route-level `useWallet()` realtime invalidation 흐름 보존
- desktop profile pill 추가
- `.app-shell-*` CSS를 tokenized surface/depth/motion 기반으로 보강
- mobile bottom nav에는 icon만 추가하고 구조 변경은 `p3-shell-mobile`로 넘김

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

오류 및 수정:

- visual smoke 1차 실패:
  - 원인: `AppShell`에서 `useWallet()`을 직접 호출하면서 `DashboardPage`의 기존 `useWallet()`과 같은 Supabase realtime channel을 중복 구독
  - 증상: `cannot add postgres_changes callbacks ... after subscribe()` runtime error로 dashboard route가 error boundary로 전환
  - 수정: AppShell은 `useQuery` + `walletKeys.all(userId)` + `supabase.from('wallets').select('*')`로 query cache만 읽고, realtime subscription은 기존 route-level `useWallet()`에 맡김
  - 재검증: visual smoke 재실행 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 3 Shell: Mobile App Shell

상태: 완료

변경 파일:

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- mobile bottom nav에 in-house `Icon` 유지
- active route indicator 추가
- safe-area aware bottom inset 적용
- tokenized blur/surface/elevation 적용
- touch target을 52px로 상향
- active/press motion을 native CSS transition으로 적용
- reduced-motion guard에 mobile nav transition 포함
- desktop shell 로직과 `NAV`/route active resolution은 유지

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 3 Shell: Auth Shell

상태: 완료

변경 파일:

- `apps/web/src/components/auth-shell.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- 기존 login/signup/reset route auth logic, validation, navigate flow 유지
- `AuthShell` live badge와 trust strip에 in-house `Icon` 적용
- ambient frame layer 추가
- 기존 i18n copy key 유지
- auth root/card/badge/trust surfaces를 tokenized graphite/mint style로 정리
- trust strip legacy lock pseudo icon 제거
- motion은 CSS animation/transition만 사용하고 reduced-motion guard 유지

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 3 Shell: Root Surfaces

상태: 완료

변경 파일:

- `apps/web/src/routes/__root.tsx`
- `apps/web/src/components/pwa-shell.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- `AccountRestrictionBanner`:
  - 기존 fetch/auth/signOut/appeal flow 유지
  - in-house `Icon` + tokenized danger floating card surface 적용
- `RealtimeConnectionBanner`:
  - 기존 realtime disconnected store 조건 유지
  - warning floating card surface 적용
- `PwaShell`:
  - 기존 service worker refresh toast, install prompt, dismiss persistence 유지
  - install prompt를 tokenized floating card + icon surface로 정리
- `SkipLink`:
  - 기존 `#main-content` target 유지
  - focus-visible surface를 mint primary pill로 restyle
- `styles.css`:
  - root floating banner/PWA/skip-link CSS를 safe-area/token/elevation 기반으로 추가

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web build에서 plugin timing/large chunk 경고가 출력되었으나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 3 Shell: Information Architecture

상태: 완료

변경 파일:

- `apps/web/src/routes/trade.tsx`
- `apps/web/src/routes/casino.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- `trade.tsx`
  - 기존 auth redirect, wallet/trading hooks, notification logic, Futures/Spot/OpenPositions flow 유지
  - route-level `trade-ia-header` 추가
  - notification center를 header action 영역으로 이동
  - trading panel grid를 `trade-workspace` IA class로 정리
- `casino.tsx`
  - 기존 router/game selection/engine/RPC flow 유지
  - game switcher를 `casino-game-switcher` / `casino-game-switcher-item` IA class로 정리
  - desktop은 six-column dense grid, mobile은 horizontal thumb-first snap scroller로 구성
- `styles.css`
  - trade header/workspace composition 추가
  - casino game switcher responsive IA 추가
  - reduced-motion guard에 switcher transition 포함

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

오류 및 수정:

- typecheck 1차에서 `TradePage`에 `useT()` 호출이 누락되어 `t` 미정의 오류 발생
- `useT` import와 `const t = useT()` 추가 후 typecheck 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 4 Screens: Auth

상태: 완료

변경 파일:

- `apps/web/src/routes/login.tsx`
- `apps/web/src/routes/signup.tsx`
- `apps/web/src/routes/reset-password.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- 기존 login/signup/reset auth logic, validation, Supabase calls, navigation flow 유지
- auth screen cards에 `auth-screen-card` 추가
- auth form spacing을 `auth-form`으로 통일
- card headers를 `auth-card-header`로 통일
- error alert를 `auth-error-message` surface로 통일
- auth footer를 `auth-entry-footer`로 통일
- CSS에서 card top highlight, glass card framing, error visible state, footer link transition 추가
- 사용자 노출 문구는 기존 i18n 키 유지

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

### Phase 4 Screens: Landing

상태: 완료

변경 파일:

- `apps/web/src/components/landing-page.tsx`
- `apps/web/src/styles.css`
- `C:\Users\PC\.cursor\plans\phonara-ui-rebuild_80a552f8.plan.md`

작업 내용:

- 기존 index route auth redirect flow 유지
- landing page login/signup/legal links와 locale toggle 유지
- in-house `Icon`을 live badge/proof cards/trust strip에 적용
- legacy trust lock pseudo icon 제거
- ambient frame layer 추가
- landing proof grid 추가
- landing header/hero/proof CSS를 tokenized glass/elevation 기반으로 추가
- 사용자 노출 문구는 기존 i18n 키 유지

검증:

- 수정 파일 linter diagnostics 없음
- `bun run typecheck` 통과
- `bun run build:packages` 통과
- `bun --filter @phonara/web build` 통과
- `bun --filter @phonara/admin build` 통과
- `bun run check:i18n` 통과
- `bun run check:release` 통과
- `bun run lint` 통과
- `bunx playwright test tests/e2e/visual.spec.ts --project=chromium` 통과

오류 및 수정:

- visual smoke 1차에서 login auth frame 수직 중앙성 기준이 8px 어긋나 실패
- 원인: `auth-error-message`가 비어 있을 때도 padding/min-height를 크게 가져 auth frame 높이가 증가
- 수정: 빈 error 상태는 기존 1.25rem 높이/무패딩으로 유지하고, 실제 error text가 있을 때만 error surface padding/background 적용
- 재검증: visual smoke 재실행 통과

관찰:

- web/admin production build의 큰 chunk 경고는 계속 존재하나 빌드 실패는 아님
- PWA plugin의 `inlineDynamicImports option is deprecated` warning은 기존 warning으로 보이며 실패는 아님

### Current Progress

현재 진행 항목:

- `p4-dashboard`: dashboard/home hub and reward cards

다음 항목:

- `p4-trade`

### Audit Correction: UI Rebuild Completion Evidence

상태: 보정 진행

감사 결과:

- `phonara-ui-rebuild_80a552f8.plan.md`의 모든 todo가 completed로 표시되어 있으나, 이 전용 로그는 `p4-dashboard` 진행 중에서 멈춰 있어 완료 증거와 충돌했다.
- 실제 작업트리에는 `p4-dashboard`, `p4-trade`, `p4-wallet`, `p4-casino`, `p4-staking`, `p4-misc`, PWA/quality 관련 구현 흔적이 존재하지만, 완료 인증은 현재 게이트 재실행 전까지 보류한다.
- 플랜의 엔진/데이터 불변 범위와 달리 `auth-context`, auth helper, casino round hook, local Supabase config 등 지원성 변경이 함께 포함되어 있어 “프레젠테이션만 변경”이라는 기존 closeout 문구는 부정확하다.
- 플랜의 admin 제외 문구와 달리 admin 화면/셸 변경도 함께 존재하므로, admin 변경은 별도 범위로 명시해야 한다.

즉시 수정한 항목:

- `apps/web/src/components/roulette-card.tsx`: raw roulette label export 의존을 제거하고 `formatMoney()` + `roulette.prizePreview` i18n 키로 표시.
- `apps/web/src/hooks/use-retention.ts`: 사용자 노출용 `ROULETTE_LABELS` 상수 제거.
- `apps/web/src/features/wallet/ledger-labels.ts`: 원장 reason code를 i18n 키로 매핑하고 알 수 없는 reason code는 내부 문자열 대신 일반 시스템 원장 문구로 표시.
- `apps/web/src/features/wallet/direction-badge.tsx`: 알 수 없는 direction fallback을 raw direction 대신 `ledger.direction.unknown`으로 표시.
- `apps/web/src/features/wallet/wallet-activity-list.tsx`, `apps/web/src/routes/ledger.tsx`: `reason_code` 직접 노출 제거.
- `apps/web/src/routes/staking.tsx`: 알 수 없는 staking term fallback을 raw term 대신 `staking.term.custom`으로 표시.
- `packages/i18n/src/index.ts`: 위 변경에 필요한 ko/en 키 추가.

현재 검증:

- 수정 파일 IDE linter diagnostics 없음.
- JSX/TS 하드코딩 한국어 검색: 앱 소스 기준 매치 없음.
- `bun run check:i18n` 통과.
- `bun run check:release` 통과.
- `bun run typecheck` 통과.
- `bun run lint` 통과.
- `bun run build:packages` 통과.
- `bun run build:apps` 통과.
- `bun run check:pwa` 통과.
- `bun run check` 통과.
- `bunx playwright test tests/e2e/quality.spec.ts tests/e2e/visual.spec.ts --project=chromium` 통과.

오류 및 수정:

- `bun run check:pwa` 1차 실패: 체크 스크립트가 `workbox-window` chunk 이름을 요구했으나 현재 구현은 `vite-plugin-pwa`의 `virtual:pwa-register`를 사용한다.
- 수정: `scripts/check-pwa.ts`가 `PwaShell`의 `virtual:pwa-register` 등록과 빌드된 manifest/offline/sw 산출물을 함께 확인하도록 변경.
- `bun run check` 1차 실패: `@tanstack/react-virtual`이 `apps/web/package.json`에 남아 있었지만 실제 사용처가 없었다.
- 수정: web workspace에서 미사용 의존성을 제거하고 `bun.lock` 갱신.

남은 관찰:

- remote Supabase advisor는 ERROR 0, WARN 212, INFO 108로 통과했다. WARN은 기존 권고 항목이며 이번 UI 보정 범위에서는 변경하지 않았다.
- production build의 Vite/PWA warning과 admin large chunk warning은 실패 조건은 아니며 기존 관찰 항목으로 남긴다.
- `docs/PHONARA_V2_MASTER_PLAN.md`는 현재 도구 읽기 권한 제한으로 직접 보정하지 못했다. 이 전용 로그가 UI rebuild 완료 증거의 최신 정합 기록이다.
