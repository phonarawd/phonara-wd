# DESIGN_SYSTEM_AUDIT — PHONARA Phase R

> **날짜:** 2026-07-11  
> **SOT:** `apps/web/src/product/tokens/` · `apps/web/src/product/primitives/`

---

## 1. 아키텍처

```
product/tokens/          ← --ds-* 유일 SOT
  fonts.css
  colors.css             ← OKLCH · light-dark()
  spacing.css            ← 4px grid · radius · touch
  elevation.css          ← shadow · z-index
  domain-card-personalities.css
  layout.css             ← breakpoints · shell geometry
  motion.css
  theme.css              ← Tailwind v4 @theme bridge
  index.css              ← import order contractual
  viewport-contract.ts   ← TS mirror

product/primitives/      ← shadcn/Radix vendoring (§25.2)
product/shell/           ← AppShell · chrome · aurora
```

**Import 규칙:** `@/product/primitives` only — `components/ui` 재생성 금지.

---

## 2. CSS 스택

| 계층 | 사용 |
|------|------|
| Tailwind v4 | CSS-first · `@theme inline` → `--ds-*` 매핑 |
| CSS Variables | 색·간격·모션·레이아웃 SOT |
| Surface CSS | `trade-desk-layout.css` · `shell.css` · `aurora-background.css` |
| CSS Modules | 거의 없음 |
| Motion | CSS vars + framer presets (`motion-presets.ts`) |

---

## 3. 토큰 카탈로그 (고유 `--ds-*` ≈ 100)

### 3.1 Color / Semantic (~40)

| Token | 역할 |
|-------|------|
| `--ds-bg` · `--ds-surface` · `--ds-surface-raised` · `--ds-surface-hover` · `--ds-surface-overlay` | 면 |
| `--ds-line` | 경계 |
| `--ds-foreground` · `--ds-foreground-muted` | 텍스트 |
| `--ds-accent*` | 브랜드 mint |
| `--ds-success*` · `--ds-warning*` · `--ds-danger*` · `--ds-info*` | 상태 |
| `--ds-market-up` · `--ds-market-down` | 시세/PnL |
| `--ds-bet*` | Casino/Sports CTA |
| `--ds-focus` | 포커스 링 |
| `--ds-tier-bronze…prime` | VIP 램프 |

### 3.2 Typography (~20)

| Token | 역할 |
|-------|------|
| `--ds-font-sans` · `--ds-font-display` · `--ds-font-mono` | 패밀리 |
| `--ds-text-xs…hero` | fluid clamp 스케일 |
| `--ds-line-height-body` · `-ko` · `-heading` | 행간 |
| `--ds-tracking-heading` · `--ds-weight-heading*` | 제목 (ko/en) |

### 3.3 Spacing / Radius (~17)

`--ds-space-1…12` (4px 그리드) · `--ds-radius-sm/md/lg/full` · `--ds-touch-target-min`

### 3.4 Elevation / Z (~8)

`--ds-shadow-1…4` · `--ds-shadow-overlay` · `--ds-z-chrome(40)` · `--ds-z-overlay(50)` · `--ds-z-toast(60)`

### 3.5 Motion (~10)

| Token | ms |
|-------|-----|
| `--ds-motion-press` | 120 |
| `--ds-motion-field` · `--ds-motion-toggle` | 150 |
| `--ds-motion-surface` | 200 |
| `--ds-motion-overlay` | 320 |
| `--ds-motion-count-up` | 400 |
| `--ds-ease-standard` | cubic-bezier(0.2,0,0,1) |

Deprecated aliases (P13 purge): `--ds-motion-fast/base/slow`

### 3.6 Layout / Breakpoints (~12)

`--ds-bp-*` · `--ds-content-max` · `--ds-panel-min` · `--ds-shell-gutter*`

### 3.7 Domain

`--ds-card-tier` + `[data-card-variant=…]` personalities (glow / heatmap / dense)

---

## 4. Primitives 목록 (33 tsx)

**Actions:** Button · IconButton  
**Surfaces:** Card · MissionCard · RoutineCard  
**Type:** Text · MoneyDisplay · MoneyDisplayWithFiatHint · BrandMark  
**Overlays:** Dialog · Sheet · ConfirmDialog · Popover · DropdownMenu · Tooltip · HelpTip · ToastZone  
**Forms:** Input · Field · Select · Switch · Slider · Tabs · SpendCurrencySelector  
**Feedback:** StatusBadge · Skeleton · EmptyState · ErrorPanel · ZeroBalanceState · ProgressRing · HowItWorks · CollapsibleSection  

---

## 5. Shell 컴포넌트 계층

```
AppShell
├── AuroraBackground (policy intensity)
├── TopBar
├── DomainSubnav (trade|sports|casino|wallet|earn)
├── EarnSideNavDesktop / EarnSideRailDesktop (Earn only)
├── ContentShell / ShellPage
├── BottomNav (5 tabs)
├── TradeFirstVisitEducationGate
├── TradeRealtimeFeedbackGate
└── PWA install banner (별도 shell)
```

MarketingShell — Landing 등 비앱 크롬.

---

## 6. 디자인 중복 · 부채

| ID | 항목 | 조치 |
|----|------|------|
| D1 | motion deprecated aliases | P13 purge |
| D2 | shadcn legacy `--color-primary` bridge | P13 제거 |
| D3 | `.shell-content-column` vs `.ds-shell-content-column` | 단일화 |
| D4 | Card CVA vs personality CSS | 문서화 유지 (의도적 분리) |
| D5 | Admin web-product-shims | Admin DS 정렬 |
| D6 | Chart rgb fallback (LWC) | OKLCH 미지원 — 유지 필요 |

---

## 7. Icon

- **Lucide React** (BottomNav 등)
- 별도 icon token 패키지 없음 — size는 Tailwind / touch target

---

## 8. Theme

- `color-scheme: light dark`
- Preferences `setTheme` → `data-theme`
- surface transition `--ds-motion-surface`
- Chart: `chart-theme.ts` dark rgb fallbacks

---

## 9. Director 입력용 DS 원칙 (현행)

1. `--ds-*` only — hex 하드코딩 금지  
2. Money = mono + tabular-nums · 재계산 금지  
3. Domain card personality로 챕터 시그니처  
4. Overlay z: chrome < overlay < toast  
5. reduced-motion = duration 0  
6. Touch ≥ 48px  
)
