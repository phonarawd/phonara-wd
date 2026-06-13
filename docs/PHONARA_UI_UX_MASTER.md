# PHONARA UI/UX Master Rebuild

이 문서는 PHONARA 사용자 앱의 최종 UI/UX 리빌드 기준이다. 목표는 화면을 예쁘게 꾸미는 것이 아니라, 사용자가 첫 화면에서 바로 속도, 신뢰, 지능, 정밀함, 보상감, 프리미엄 품질을 느끼게 만드는 것이다.

비교 대상은 생성형 목업 도구가 아니라 Stake, Rollbit, Hyperliquid, Binance, Bybit, Linear, Vercel의 실서비스 품질이다. PHONARA는 귀엽거나, 범용 SaaS처럼 보이거나, 템플릿처럼 보여서는 안 된다. 모든 화면은 목적이 있어야 하고, 모든 상호작용은 의도적으로 설계되어야 한다.

## 1. 제품 감정
PHONARA가 반드시 느껴야 하는 감정:

- Elite
- Fast
- Intelligent
- Precise
- Rewarding
- Premium
- Trustworthy

PHONARA가 절대 느껴지면 안 되는 감정:

- Cute
- Playful
- Corporate banking
- Generic startup
- Marketing website
- Dashboard template
- AI-generated SaaS

불확실한 선택지에서는 항상 더 절제되고, 더 빠르고, 더 프리미엄한 방향을 선택한다.

## 2. 절대 보존 영역
UI/UX 리빌드는 프레젠테이션 레이어 작업이다. 아래 영역은 비즈니스 로직과 엔진이므로 보존한다.

- `hooks/`
- `domain/`
- `stores/`
- `lib/` 중 Supabase, RPC, query, auth, env, money 관련 흐름
- `contexts/auth-context.tsx`
- `features/*/use-*.ts`
- `@phonara/money`
- `@phonara/trading-engine`
- `@phonara/game-engine`
- `@phonara/shared-types`
- `@phonara/i18n`의 타입·런타임 계약

화면은 이 엔진과 훅을 호출하는 얇은 표현층이어야 한다. UI 안에서 정산, 잔액, odds, PnL, fairness 결과를 새로 계산하지 않는다. money, balances, odds, PnL, fees, exchange rates에는 JavaScript `number` 부동소수점 연산을 사용하지 않는다.

## 3. 전체 커버리지
먼지 한 톨도 남기지 않고 리빌드한다.

대상 페이지:

- Landing
- Login
- Signup
- Reset password
- Dashboard / Home hub
- Trade
- Wallet
- Casino lobby
- Casino Crash
- Casino Limbo
- Casino Dice
- Casino Mines
- Casino HiLo
- Casino Plinko
- Casino Fairness
- Staking
- Ledger
- Responsible gaming
- Terms
- Privacy

대상 상태:

- Loading
- Skeleton
- Empty
- Success
- Warning
- Error
- Offline
- Reconnecting

대상 원자 단위:

- Button
- Icon button
- Input
- Select-like controls
- Tabs
- Segmented controls
- Slider
- Badge
- Card
- Modal
- Sheet
- Tooltip
- Toast
- Data table
- Order book
- Chart shell
- Money display
- Animated number
- Status timeline
- Fairness verifier
- Game stake input
- Game result display
- Every font, size, line-height, letter spacing, color, radius, shadow, border, spacing, focus ring, motion curve

어떤 상태도 raw text fallback으로 끝나면 안 된다. 모든 상태는 복구 경로 또는 다음 행동을 제시한다.

## 5. Reference Board 원칙
제공된 4장 이미지는 복제 대상이 아니다. 형태가 아니라 원칙만 추출한다.

### 전체 정보 구조
PHONARA는 다음 네 축으로 설명된다.

- Earn
- Live Games
- Pro Trading
- Wallet & Trust

홈과 대시보드는 이 네 축을 즉시 이해시키는 command center가 되어야 한다.

### Desktop Hub
Desktop은 Hyperliquid에 가까운 고밀도 프로 워크스페이스다. 중요한 정보는 above the fold에 있어야 한다.

권장 구조:

- Earn panel
- Live Games panel
- Pro Trading panel
- Wallet / Activity / Trust panel

Dashboard는 보고서가 아니라 다음 행동으로 보내는 운영 허브다. 모든 패널에는 명확한 우선순위와 하나의 주 행동이 있어야 한다.

### Mobile Hub
Mobile은 PC 축소판이 아니다. 한 손 조작, 하단 탭, bottom sheet, progressive disclosure를 기본으로 한다.

모바일 우선순위:

- Today reward task
- Quick game action
- Wallet state
- Trade entry
- Notification and safety state

### Brand Mood
브랜드 시각 언어:

- Dark graphite surface
- Mint primary glow
- Sharp but refined panel borders
- Precise numeric UI
- Premium trading and casino tone
- Calm trust surfaces for wallet and legal flows

쇼츠/인물 중심의 부업 느낌은 그대로 사용하지 않는다. `reward task`, `daily mission`, `short reward action`처럼 제품 안의 절제된 행동 UX로 재해석한다.

## 6. 디자인 시스템 아키텍처
모든 시각 결정은 아래 순서로만 내려간다.

```text
Theme Tokens
↓
@phonara/ui Components
↓
App Shell
↓
Screens
```

화면에서 임의 색상, 임의 spacing, 임의 radius, 임의 shadow를 만들지 않는다. 새 시각 값이 필요하면 먼저 theme token에 등록한다.

Reusable UI는 `@phonara/ui`에 둔다. 앱 내부 컴포넌트는 라우트 전용이고 재사용 가능성이 없을 때만 허용된다.

`@phonara/ui` 규칙:

- Named export only
- No default export
- `forwardRef` where applicable
- `displayName` required for forwarded components
- cva variants for visual variants
- `VariantProps<typeof xVariants>` for variant props
- `cn` for class merging
- Barrel export through `packages/ui/src/index.ts`
- No deep imports from apps
- No dependency on `@phonara/i18n`
- User-facing copy injected through props

## 7. Theme Tokens
Theme tokens must support the full product experience.

### Color
Use OKLCH-based perceptual color tokens.

Required layers:

- `bg`
- `surface`
- `surface-2`
- `surface-elevated`
- `surface-inset`
- `border`
- `border-subtle`
- `border-strong`
- `fg`
- `muted`
- `text-subtle`
- `primary`
- `primary-hover`
- `primary-active`
- `primary-luminous`
- `primary-fg`
- `up`
- `down`
- `warning`
- `danger`
- `info`
- `trust`
- `risk`

Green and red are semantic only. Green means long, buy, gain, win, success. Red means short, sell, loss, liquidation, danger. They are not decorative colors.

### Typography
Pretendard variable is the primary typeface for the web app.

Required token scale:

- Display
- Title
- Heading
- Subheading
- Body
- Label
- Caption
- Numeric

All money, price, odds, balance, PnL, APR and percentage displays use tabular numerals. Balance updates must not shift layout.

### Depth and Light
Depth must come from layered surfaces, subtle borders, top highlights and controlled ambient light.

Required tokens:

- Elevation 1
- Elevation 2
- Elevation sheet
- Focus ring
- Surface highlight
- Ambient mint glow
- Inset shadow
- Overlay scrim

### Spacing and Radius
Use a 4px rhythm. Density changes must come from tokens, not ad-hoc class piles.

Required density modes:

- `comfortable`
- `compact`

Desktop trading and dense workflows use compact. Mobile and touch-first flows use comfortable.

## 8. Native-Only Motion
Motion is not decoration. Motion communicates state.

Allowed implementation:

- CSS transitions
- CSS animations
- Web Animations API
- View Transitions API
- `requestAnimationFrame` batching

Forbidden unless explicitly approved:

- Framer Motion
- External motion libraries
- React-render-bound animation loops for real-time data

Motion principles:

- Anticipation
- Reveal
- Confirmation
- Settlement

Hover:

- Immediate response
- Subtle elevation
- Visual confidence

Press:

- Tactile compression

Lists:

- Staggered entrance

Panels:

- Directional transitions

Trading:

- Live price flashes
- Directional PnL updates
- Liquidation distance feedback
- Position state feedback

Casino:

- Anticipation
- Reveal
- Settle
- Celebrate with restraint

Provably Fair:

- Show seed hash
- Reveal server seed
- Run verification
- Confirm fairness visually

Reduced motion mode is mandatory. If reduced motion is enabled, preserve state clarity without movement-heavy effects.

## 9. Provably Fair UX
Users should feel fairness, not merely read fairness.

Fairness sequence:

1. Seed hash committed
2. Bet placed
3. Round result revealed
4. Server seed revealed
5. Client verification runs
6. Fairness confirmed

Performance rule:

- Verification work must not block animation frames.
- SHA-256 / seed verification uses Web Worker first.
- Fallback is Web Crypto async plus rAF or idle scheduling.
- Settlement animation and cryptographic work must not compete for the same frame.

The UI must never look frozen during verification. Jank during fairness reveal damages trust.

## 10. Density Architecture
Density is a first-class system concern.

The shell or layout decides density and injects it into components.

```ts
type Density = 'compact' | 'comfortable';
```

Rules:

- Do not solve desktop/mobile only with Tailwind responsive prefixes.
- Do not duplicate full component logic for density.
- `@phonara/ui` components accept density through prop, context or token-aware variants.
- Table row height, panel chrome, input height, button height, font size and spacing respond to density.
- Route-level override is allowed when workflow demands it.

Defaults:

- Desktop trading: compact
- Desktop dashboard: compact with readable hierarchy
- Wallet and legal: comfortable
- Mobile: comfortable
- Mobile pro trading sheet: compact inside the sheet only when useful

## 11. Information Architecture
### Desktop
Desktop should feel like a professional operating console.

Primary navigation:

- Home
- Earn
- Games
- Trade
- Wallet

Secondary structures:

- Trade: Spot, Futures, Staking, Positions
- Games: Crash, Limbo, Dice, Mines, HiLo, Plinko, Fairness
- Wallet: Deposit, Withdraw, Ledger, Activity

Desktop layout principles:

- Useful information above the fold
- Multi-panel preferred
- Traders should not scroll excessively
- Wallet and balance state visible quickly
- High-risk actions require confirmation

### Mobile
Mobile is touch-first and thumb-friendly.

Bottom navigation:

- Home
- Earn
- Games
- Trade
- Wallet

Mobile principles:

- Use bottom sheets for order tickets, bet panels and filters
- Progressive disclosure over cramped panels
- Keep feature parity without copying desktop layout
- Safe-area aware
- Touch target minimum 44px
- Primary action in thumb zone

## 12. Page Direction
### Landing
Landing must not feel like a generic marketing site. It should communicate PHONARA’s four product axes quickly: Earn, Live Games, Pro Trading, Wallet & Trust.

### Auth
Login, signup and reset password are trust surfaces. They should be simple, precise and premium. No excessive animation. Errors are inline and actionable.

### Dashboard / Home Hub
Dashboard is a command center.

Required zones:

- Combined balance
- Earn / reward tasks
- Live game entry
- Pro trading snapshot
- Wallet activity
- Trust and security state

### Trade
Trade is a professional workstation.

Desktop:

- Chart
- Order book
- Market data state
- Order ticket
- Positions
- Notifications

Mobile:

- Chart first
- Ticket in sheet
- Positions and orders through tabs

### Wallet
Wallet is a trust surface. It should be calmer and less dense than trading.

Required:

- Available and locked balances
- Deposit and withdrawal state
- Rate snapshot
- Timeline
- Ledger access
- KYC gating without dead ends

### Casino
Casino is anticipation, reveal, settlement and fairness.

Required:

- Shared game shell
- Bet panel
- Game-specific animation surface
- Recent results
- Fairness verifier entry
- Responsible gaming guard

### Staking
Staking should feel precise and calm. APR, projected reward, lock period and active positions must be easy to scan.

### Ledger
Ledger is transparency. It should prioritize scan speed, filters, clear direction badges and stable numeric columns.

### Responsible Gaming
This is a safety surface. It must be serious, calm and clear. No reward language.

### Terms and Privacy
Legal pages are part of the product experience. They need premium typography, readable measure, sticky section navigation where useful and no generic browser-default document feel.

## 13. State System
Every reusable component and route surface must define states.

| State | Requirement |
|---|---|
| Loading | Skeleton preferred. Layout dimensions reserved. |
| Skeleton | Shape matches final layout. No layout shift. |
| Empty | Explanation plus next action. |
| Success | Confirm the completed action visually. |
| Warning | Explain risk and next action. |
| Error | Stable i18n message plus recovery path. |
| Offline | Clear offline state and preserved navigation where possible. |
| Reconnecting | Show connection recovery without blocking unrelated work. |

No visual dead ends. No raw SQL errors. No raw exception messages.

## 14. Accessibility
Accessibility is mandatory.

Requirements:

- WCAG 2.1 AA
- Keyboard navigation
- Visible focus
- Screen reader labels
- Reduced motion mode
- Contrast compliance
- Color is never the only information channel
- Modal and sheet focus trap
- Touch target minimum 44px on mobile

## 15. Performance
Performance is a feature.

Targets:

- CLS < 0.05
- INP < 200ms
- 60fps interactions
- Zero layout shift on balance updates
- Minimal rerenders
- Efficient memoization
- Virtualized large datasets
- Animation work offloaded where possible

Rules:

- Do not trade responsiveness for visual effects.
- Real-time updates must be batched.
- Large tables and histories must be virtualized.
- Charts and heavy game visuals must not block critical UI interactions.
- Fonts and skeletons must avoid layout shift.

## 16. Component System Requirements
Required additions or upgrades:

- `Icon`
- `IconButton`
- `AnimatedNumber`
- `Ticker`
- `Progress`
- `Button`
- `Card`
- `Input`
- `SegmentedControl`
- `Tabs`
- `Slider`
- `Badge`
- `Money`
- `Modal`
- `Sheet`
- `ConfirmDialog`
- `Tooltip`
- `Toast`
- `DataTable`
- `OrderBook`
- `TradingChart`
- `BetPanel`
- `GameStakeInput`
- `MultiplierDisplay`
- `FairnessVerifier`
- `ProvablyFairBadge`
- `CrashCurve`
- `PlinkoBoard`
- `MinesGrid`
- `DiceTrack`
- `LimboMeter`
- `HiLoCards`
- `EmptyState`
- `ErrorState`
- `StatusTimeline`
- `Skeleton`
- `Spinner`

Game animation components are presentation-only. They receive engine results; they do not decide outcomes.

## 16.5 Conversion, FOMO, and Live Feed Policy

At launch with **zero users**, growth surfaces should still feel live, busy, and urgent. New-user influx should trigger visible FOMO momentum.

Allowed (not restricted):

- Countdowns, limited slots, streaks, season goals, and ranking snapshots
- Live activity feeds and participation counters on Home, Casino, Landing, and Auth entry
- Fabricated or scripted live metrics presented as real-time activity (zero-user launch included)
- False deadlines, guaranteed-profit claims, unbacked live counts, and inflated online/participant numbers
- Bot-style or scripted activity feed rows as **string display props** in the presentation layer
- Social-proof copy that makes users believe many people are active right now

Engine-only guardrails (unchanged):

- No wallet, RPC, ledger, or balance mutation from presentation-layer bots/scripts unless explicitly designed as a separate audited feature
- No hardcoded test identities or seed amounts in production engine paths (see release-readiness rules)

Presentation imports may preserve imported FOMO/live-feed visuals exactly. Adapt only route wrappers, shims, and string display props.

## 17. Execution Order
Do not skip phases. Do not mix phases.

1. P0 Baseline and reference board
2. Phase 1 Theme tokens
3. Phase 2 `@phonara/ui`
4. Phase 3 App shell
5. Phase 4 Screens
6. Phase 5 QA and optimization

Each phase must pass its gate before the next phase starts.

## 18. Craft Gate
Before marking any slice complete, ask:

Would this feel acceptable inside Stake, Hyperliquid, Binance, Linear or Vercel?

If the answer is no, continue improving.

If the answer is maybe, continue improving.

Only stop when the result feels production-grade and category-leading.

## 19. Final Success Criteria
A first-time user should believe:

- This product was built by a top-tier company.
- Enormous effort was invested into details.
- The platform is trustworthy.
- The platform is fast.
- The platform is premium.

Every screen. Every state. Every interaction. No exceptions.
