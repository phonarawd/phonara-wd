# VISUAL_AUDIT — PHONARA Phase R

> **날짜:** 2026-07-11  
> **모드:** READ-ONLY 정적 감사 + 문서화 (픽셀 캡처는 `SCREENSHOT_INDEX.md` 참조)  
> **대상:** ChatGPT UI/UX Director · Cursor 재설계 명세 입력  
> **코드 수정:** 없음

---

## 0. 한 줄 판정

PHONARA UI는 **v5 Demolition 이후 Phase R 재구축 중**이다. Design System(`--ds-*`)·AppShell·5탭 IA·Trade Desk는 성숙하고, **Casino 12게임 stage는 placeholder**, Sports VIP는 stub이다. Plan 기준 구현률 **≈72.7%**, 시각 polish 체감 **≈55–60%**.

---

## 1. 제품 맥락

| 항목             | 값                                                                         |
| ---------------- | -------------------------------------------------------------------------- |
| Engine           | FULLY CLOSED — UI는 RPC/hook 표시만                                        |
| Demolition       | DONE — pre-demolition `components/ui` · `@phonara/ui` 삭제                 |
| Presentation SOT | `apps/web/src/product/**`                                                  |
| Plan             | `phase_r_super-app` · 278 todos · completed 202 · pending 69 · cancelled 7 |
| 현재 NEXT        | `pir-closeout-unblock-205` → Track A `#205` BLOCKED by PIR GATE            |
| 테마             | Light + Dark (`light-dark()` + `data-theme` · Preferences)                 |

---

## 2. Visual language — Digital Aurora

| 축           | 정본                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Color        | OKLCH · blue-tint neutral · mint accent (hue ~165)                                                      |
| Market       | `--ds-market-up/down` (semantic success/danger와 분리)                                                  |
| Type         | Pretendard (sans) · Space Grotesk (display) · JetBrains Mono (money)                                    |
| Elevation    | `--ds-shadow-1…4` · Neural Glow는 wallet-hero만                                                         |
| Domain cards | `domain-card-personalities.css` — mission / wallet-hero / vip / trade-dense / sports-odds / casino-play |
| Motion       | press 120 · surface 200 · overlay 320 · count-up 400 · reduced-motion 0                                 |
| Backdrop     | Aurora (`aurora-backdrop-policy`) — Earn 등 intensity                                                   |

**금지/부재:** hex/hsl 신규 토큰 · pre-demolition purple/cream 테마 · page root `max-w-[390px]`

---

## 3. 페이지 인벤토리 (Web)

| 도메인        | Route(s)                                                      | Surface                                 | 시각 성숙도   |
| ------------- | ------------------------------------------------------------- | --------------------------------------- | ------------- |
| Landing       | `/`                                                           | `landing-page`                          | 높음          |
| Earn Home     | `/home`                                                       | `earn-home-page`                        | 높음          |
| Missions      | `/home/missions*`                                             | missions / invite / referral            | 중~높음       |
| Attendance    | `/home/attendance`                                            | `home-attendance-page`                  | 중            |
| Referral      | `/referral` · `/referral/invite`                              | referral-\*                             | 중            |
| Tier          | `/tier/me` · `/tier/benefits`                                 | tier-\*                                 | 중            |
| Share         | `/share/earnings`                                             | share-earnings                          | 중            |
| Staking       | `/staking` · `/staking/positions`                             | staking-\*                              | 중            |
| Wallet        | `/wallet` + deposit/withdraw rails                            | wallet / crypto / KRW / giftcard        | 높음          |
| Ledger        | `/ledger`                                                     | ledger-page                             | 중~높음       |
| Rewards       | `/rewards/history`                                            | rewards-history                         | 중            |
| Trade Spot    | `/trade` · orders                                             | spot-desk + LWC                         | **최고**      |
| Trade Futures | `/trade/futures` · positions/orders                           | futures-desk                            | **최고**      |
| Sports        | `/sports` · live · prematch · fixture · rules · vip · my-bets | sports-page + panels                    | 중 (VIP stub) |
| Casino lobby  | `/casino`                                                     | casino-lobby-page                       | 중~높음       |
| Games ×12     | `/games/$gameCode`                                            | CasinoGameShell + **stage placeholder** | **낮음**      |
| Auth          | login · signup · reset · verify · callback                    | \*-page / forms                         | 중            |
| Account       | `/account` · profile · kyc · RG                               | account-\*                              | 중            |
| Settings      | `/settings*`                                                  | settings hub + leaves                   | 중            |
| Legal         | terms · privacy · risk · RG                                   | legal-\*                                | 낮~중         |
| Install       | `/install`                                                    | install-page + guide sheet              | 중            |
| Onboarding    | `/onboarding*`                                                | onboarding-\*                           | 중            |
| Notifications | `/notifications`                                              | notifications-page                      | 중            |

### 요청명 ↔ 실제 매핑

| 요청                    | 실제                                            |
| ----------------------- | ----------------------------------------------- |
| Spot / Futures          | `/trade` · `/trade/futures` (별도 `/spot` 없음) |
| Slot                    | **없음** — `mint-reels` · `gold-rush`           |
| Crash / Dice / Roulette | 12 slug 중 존재 · stage UI placeholder          |
| Profile                 | `/account/profile`                              |

### Casino 12 slug

`crash` · `limbo` · `dice` · `mines` · `hilo` · `plinko` · `mint-reels` · `gold-rush` · `roulette` · `blackjack` · `deepshaft` · `momentum`

---

## 4. Admin 인벤토리

| Surface                                    | Route 예                           |
| ------------------------------------------ | ---------------------------------- |
| Home / Ops / Queues / Risk                 | `/` · `/ops` · `/queues` · `/risk` |
| Users / User tier                          | `/users` · `/users/$userId/tier`   |
| Deposits / Withdrawals                     | `/deposits` · `/withdrawals`       |
| Sports (+ settle dialog)                   | `/sports`                          |
| Earn hub / missions / rewards / referrals  | `/earn*`                           |
| Staking / Tiers / Settings / Audit / Viral | 각 route                           |
| MFA enroll / challenge / policy            | `/mfa/*`                           |
| Login / Forbidden                          | `/login` · shell                   |

**Admin dialogs:** `admin-queue-action-dialog` · `admin-alert-action-dialog` · `admin-sports-settle-dialog`

---

## 5. Overlay · State 문법

| 유형         | 구현                                                    | 비고                    |
| ------------ | ------------------------------------------------------- | ----------------------- |
| Dialog       | Radix `dialog` + `ConfirmDialog`                        | 입출금·주문·스테이킹·RG |
| Sheet        | `sheet` + ads-consent · install-guide · trade-education | bottom sheet            |
| Dropdown     | `dropdown-menu`                                         | TopBar / 설정           |
| Tooltip      | `tooltip` + `HelpTip`                                   |                         |
| Toast        | `ToastZone` / `productToast`                            | z=60                    |
| Empty        | `EmptyState`                                            |                         |
| Error        | `ErrorPanel` · fetch banners                            |                         |
| Loading      | `Skeleton` + shimmer                                    | reduced-motion          |
| Zero balance | `ZeroBalanceState`                                      |                         |

---

## 6. Visual hierarchy (대표)

### Landing

BrandMark/Wordmark → AB headline/CTA → live proof/ticker → pillars → missions → FAQ → final CTA  
**리스크:** first viewport 정보 과밀 (hero budget 긴장)

### Earn Home

Balance/mission hero → Routine/Mission cards → cross-domain navigate CTA (embed 금지)

### Trade

Ticker → **Chart (primary)** → order book / ticket → fills / positions  
Desktop 3-col · Mobile tabs + sticky CTA

### Casino game

PF strip · bet controls · AutoBet · WinTier chrome → **빈 stage card** (시선 단절 — 최대 시각 부채)

### Wallet

Wallet-hero (Neural Glow) → rails cards → ledger link

---

## 7. UI 문제점 (우선)

1. Casino **stage placeholder** (12게임 공통)
2. Sports **VIP stub**
3. Landing first-fold **과밀**
4. Trade mobile **인지부하**
5. Legacy token alias / shadcn color bridge (P13 purge 예정)
6. Admin ↔ Web DS **완전 통일 미완**
7. Fiat hint session lock `#205` BLOCKED

---

## 8. 정량 (본 감사)

| 메트릭                          | 값                                 |
| ------------------------------- | ---------------------------------- |
| Web routes                      | 69                                 |
| Web `*-page.tsx`                | 55                                 |
| Web surface TSX (비테스트)      | 139                                |
| Web primitives                  | 33                                 |
| Admin routes                    | 27                                 |
| Admin pages/dialogs             | ~26                                |
| Design tokens (`--ds-*` unique) | ≈100                               |
| Charts                          | 2 (LWC + depth)                    |
| 스크린샷 PNG                    | 0 (인덱스·폴더만 — 캡처 패스 대기) |

---

## 9. 관련 파일

- Tokens: `apps/web/src/product/tokens/`
- Primitives: `apps/web/src/product/primitives/`
- Shell: `apps/web/src/product/shell/`
- Boundary: `apps/web/src/product/shell/surface-domain-boundary.ts`
- SSOT: `docs/SSOT/ACTIVE_WORK_SSOT.md`
  )
