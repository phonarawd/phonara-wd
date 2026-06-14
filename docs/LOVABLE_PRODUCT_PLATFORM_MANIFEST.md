# PHONARA — Product Platform Manifest (Lovable UI/UX 계약)

> **사용법:** `LOVABLE_ZENITH_MASTER_PLAN.md`와 **함께** Lovable AI에 붙여넣기.  
> **목적:** Stake · Rollbit급 **등급·메뉴·퍼널 아키텍처** + **부업/부수입 마케팅** → Earn → Wallet → Casino → Trade → Staking까지 **끊김 없이** 이어지는 **완전체 플랫폼** UI를 Lovable에서 100% 구현.  
> **엔진:** PHONARA RPC/원장은 **읽기 전용 참조**. Lovable은 **props·콜백·mock adapter**만.

---

## §1. 제품 North Star

### 1.1 외부 홍보 포지션 (랜딩·Earn 톤)

| 홍보 축 | 제품 내부 표현 (UI Master 준수) |
|---------|--------------------------------|
| 부업 · 부수입 · 집에서 돈 벌기 | `reward task`, `daily mission`, `earn loop` |
| 친구 초대 · 바이럴 수익 | `referral`, `affiliate`, `share toolkit` |
| 게임·베팅 재미 | `Live Games`, provably fair |
| 트레이딩 수익 | `Pro Trading` (현물·선물·스테이킹) |

**금지:** 광고 시청·설문조사·앱 설치 미션 UI — **절대 구현하지 않음**.  
**허용:** 한국 소형/대형 앱테크·TikTok Lite형 **유저 주도 바이럴** (링크 공유, 초대 코드, 템플릿 복사, SNS 스토리 키트, 추천 트리).

### 1.2 4축 → 1퍼널 (끊김 없는 여정)

```text
Landing (부업 훅)
  → Signup (+ referral code)
  → Earn Hub (출석 · 엔진 미션 · 바이럴 미션 · 스핀 · 추천)
  → Wallet (코인 입금 주력 → PHON 잔액 확인)
  → Games (10종 · 카탈로그 · 토너먼트 · fairness)
  → Trade (현물 · 선물 · 고밀도 PC 워크스테이션)
  → Staking (PHON lock · APY preview)
  → Withdraw (코인 출금 주력 · KRW 계좌 선택적)
```

**모든 축 전환:** `RewardPromisePreview`, `NextActionBar`, Tier perk CTA로 **한 탭 이내** 이동.  
**데스크톱:** Dashboard 4패널(Earn · Games · Trade · Wallet) 동시 노출 — UI Master §5.

---

## §2. Stake / Rollbit급 등급·메뉴 아키텍처

### 2.1 등급 시스템 (Tier / VIP)

**Lovable:** 전부 **presentation props**. wager·deposit·referral volume은 **표시만** — 재계산 금지.

| Tier | 표시명 (i18n `tier.name.*`) | Perks (i18n `tier.perk.*`) |
|------|----------------------------|----------------------------|
| Bronze | 브론즈 | 기본 미션 · 일일 출석 |
| Silver | 실버 | Earn 스핀 +1 · 수수료 할인 표시 |
| Gold | 골드 | 이벤트 early access · 리더보드 배지 |
| Platinum | 플래티넘 | VIP 채팅 우선 · 한도 상향 **표시** |
| Diamond | 다이아 | 한정 드롭 · 토너먼트 시드 |

**필수 UI:**

- `TierBadge` — TopBar · AccountSheet · Earn · Games HUD corner  
- `TierProgress` — 현재 tier + 다음 tier까지 progress bar (props: `currentTier`, `progressPct`, `nextTier`)  
- `ImportedTierBenefitsPage` 또는 `ImportedEventsPage` 내 tier 탭 — perk grid, locked/unlocked  
- `BonusTier` FOMO — limited-time tier boost countdown  

**PHONARA 엔진 참조 (Cursor paste 후 연결):**

- `profiles.kyc_tier` — KYC 등급 (별도 VIP tier UI와 **병렬 표시** 가능)  
- `affiliate_tier_snapshots` — 제휴/바이럴 등급 (Affiliate 페이지)  
- **신규 VIP wager tier RPC 없음** → Lovable은 mock props; Cursor adapter가 추후 연결

### 2.2 메뉴·내비게이션 시스템 (IA)

**Mobile — BottomNav 5탭 (고정, Stake 패턴):**

| Tab | Route | Primary CTA |
|-----|-------|-------------|
| Home | `/home` | Today reward + live feed |
| Earn | `/earn` | Claim · missions · viral |
| Games | `/games` | Catalog · favorites |
| Trade | `/trade` | Spot/Futures toggle |
| Wallet | `/wallet` | Balance · deposit |

**AccountSheet (햄버urger / avatar):** balance summary · tier badge · theme · sound · haptic · handedness · language · RG · **Support chat entry** · FAQ · logout

**More / overflow (`ImportedMorePage`):**

- Staking · Referral · Affiliate · Ledger · Announcements · Events · Leaderboard · Settings · Legal · **FAQ** · **Support**

**Desktop — SideNav + context:**

- Trade route → **compact density**, multi-panel (order book · chart · positions)  
- Games route → **Stake grid** `grid-cols-[1fr_360px]` game + bet panel  
- Earn route → **low density**, 48px+ touch targets  

**Global chrome:**

- TopBar: logo · balance pill · **notification bell** · tier badge · account  
- `GlobalCountdownBanner` — 이벤트/한정 드롭  
- `SiteFooter` — legal links (desktop)

---

## §3. 미션 시스템 — 엔진 vs 바이럴 (횟수 제한 필수)

### 3.1 엔진 미션 (PHONARA `mission_code` — 1회성, Cursor 연결)

| code | i18n key | 설명 |
|------|----------|------|
| `complete_profile` | `mission.complete_profile` | 프로필 완성 |
| `first_trade` | `mission.first_trade` | 첫 거래 |
| `first_game` | `mission.first_game` | 첫 게임 |
| `first_deposit` | `mission.first_deposit` | 첫 입금 |
| `kyc_verified` | `mission.kyc_verified` | KYC 완료 |
| `invite_3_friends` | `mission.invite_3_friends` | 친구 3명 초대 |
| `streak_7_days` | `mission.streak_7_days` | 7일 출석 |
| `streak_30_days` | `mission.streak_30_days` | 30일 출석 |

**Lovable:** `MissionChecklist` — props `{ missions: MissionRow[] }`, `onClaim(missionCode)` callback only.

### 3.2 바이럴 미션 (앱테크 / TikTok Lite형 — **Lovable 전량 UI**)

**원칙:** 유저가 **스스로** 마케팅·공유·초대. 플랫폼은 **도구 + 보상 preview + 횟수 제한 UI** 제공.

| Mission type | UI | 횟수 제한 (표시 props) |
|--------------|-----|------------------------|
| `share_referral_link` | 링크 복사 · 카카오/텔레gram share sheet mock | `{ usedToday, maxPerDay }` e.g. 3/3 |
| `share_story_template` | 이미지+문구 템플릿 다운로드 · 복사 | `{ usedWeek, maxPerWeek }` |
| `invite_friend_signup` | 초대 코드 · QR | `{ invitedToday, maxPerDay }` |
| `affiliate_content_post` | UGC 가이드 · 해시태그 키트 | `{ usedMonth, maxPerMonth }` |
| `viral_streak_share` | N일 연속 공유 스트릭 | `{ streakDays, targetDays }` |

**금지 미션 타입:** `watch_ad`, `complete_survey`, `install_app`, `captcha_farm`.

**필수 컴포넌트 (`components/earn/`):**

- `ViralMissionCard` — quota bar `remaining/max`, cooldown timer, CTA  
- `ShareToolkitSheet` — copy link · template · QR · social icons (display-only open)  
- `ReferralTree` / `AffiliateTree` — depth props, commission preview **display only**  
- `MissionQuotaBadge` — "오늘 2/3회 남음" (`viral.quota.*` i18n)

**엔진 경계:** 바이럴 미션 **보상 지급 RPC는 PHONARA에 아직 없음**. Lovable은:

- `onViralAction(missionId)` → toast "신청 접수" (display-only)  
- props로 `remaining`, `max`, `cooldownEndsAt` 받음  
- Cursor paste 후 **별도 엔진 태스크**로 RPC 추가 가능 (Lovable 작업 범위 밖)

### 3.3 반복 리텐션 (엔진 연결됨 — UI 필수)

| Feature | RPC (PHONARA) | 횟수 제한 |
|---------|---------------|-----------|
| Daily check-in | `rpc_claim_daily` | 1/day |
| Earn roulette | `rpc_spin_roulette` | 1/day (UI: SpinTicketStrip) |
| Welcome bonus | signup flow | 1× |
| Referral register | `rpc_register_referral` | 1 referrer |

---

## §4. 입금·출금 — 코인 주력 + 원화 계좌이체 (PG 없음)

### 4.1 원칙

- **입금 주력:** 온체인 코인 (USDT 등) — QR · 주소 복사 · 체인 선택 · 확인 수 · 최소 입금액  
- **입금 보조:** KRW **계좌이체** — PG/카드 **없음** — reference code + 안내 계좌 (PHONARA `rpc_create_krw_deposit_request`)  
- **출금 주력:** 코인 주소 출금 (기존 `wallet.withdraw.*` i18n)  
- **출금 보조:** KRW 계좌 (엔진 여부에 따라 UI 탭 — props `krwWithdrawEnabled`)

### 4.2 `ImportedDepositPage` (필수 named export)

**Tabs:** `crypto` (default) | `krw`

**Crypto tab props:**

```ts
type CryptoDepositProps = {
  asset: 'USDT' | 'PHON';
  chain: 'TRC20' | 'ERC20';
  address: string;
  qrDataUrl?: string;
  minDeposit: string;
  confirmationsRequired: number;
  onCopyAddress: () => void;
};
```

**KRW tab:** 기존 PHONARA 키 재사용 — `wallet.deposit.*`, timeline, confirm dialog, reference code.

**Cross-sell:** 입금 완료 preview → CTA "첫 게임" / "트레이딩 시작" (`wallet.deposit.nextAction.*` i18n).

### 4.3 `ImportedWithdrawPage`

- Currency selector (USDT · PHON · KRW if enabled)  
- Fee · net · confirm dialog (`wallet.withdraw.*`)  
- Risk/solvency hold state (`error.WITHDRAWAL_SOLVENCY_HOLD` display)  
- KYC gate state (tier badge + CTA to account)

### 4.4 `ImportedWalletPage`

- Balance cards (available · locked · staking)  
- Quick actions: Deposit · Withdraw · Ledger · Staking  
- Recent activity strip (props rows)

---

## §5. FAQ · 실시간 고객센터 · PWA

### 5.1 FAQ — `ImportedFaqPage`

- Accordion categories: account · deposit · withdraw · earn · games · trade · staking · RG · legal  
- Search filter (client-side on props `faqs: FaqItem[]`)  
- "Still need help?" → Support chat CTA  
- i18n: `faq.category.*`, `faq.item.*`

### 5.2 Live Support Chat — `ImportedSupportChatPage` + floating widget

**Lovable:** Crisp/Intercom급 **UI shell only** — no real websocket backend.

- Floating `SupportChatFab` (bottom-right, safe-area) — all authenticated routes  
- Full page: chat thread · agent avatar · typing indicator · attach mock · business hours banner  
- Props: `messages[]`, `onSend(text)`, `isOnline`, `queuePosition`  
- i18n: `support.chat.*`, `support.hours.*`, `support.offline.*`

### 5.3 PWA — 극강 (기존 `pwa.*` + 확장)

| Surface | Requirement |
|---------|-------------|
| Install prompt | `PwaInstallSheet` — dismiss · persist |
| Update banner | `PwaUpdateBanner` — refresh CTA |
| Offline | `ImportedOfflinePage` + stale-while-revalidate shell |
| Skip link | `pwa.skipLink` |
| Push UI | `notif.permission.*` — settings integration |
| Manifest meta | icons · theme-color · display standalone (Lovable preview meta) |
| iOS add-to-home | visual guide sheet (`pwa.iosGuide.*`) |

### 5.4 알림·토스트 톤 (한글 친화 + 이모티콘 존)

**원칙:** 모든 토스트 문구는 **i18n 키** (`*.toast.*`). JSX에 한국어·이모티콘 **직접 금지**.

#### 한글 친화 (ko catalog)

| DO | DON'T |
|----|-------|
| 짧은 구어체: `~했어요`, `~됐어요`, `지금 ~해보세요` | 번역체·딱딱한 공문: `~하였습니다`, `처리가 완료되었습니다` |
| 다음 행동 1개 암시 | 사과 남발·장문 설명 |
| 금액·배수는 `{amount}` placeholder + tabular nums | JSX에서 문자열拼接 |

**en catalog:** 동일 의미·동일 길이감. English mode에 한글 0.

#### 이모티콘 존 (필수)

| 존 | i18n prefix | 이모티콘 |
|----|-------------|----------|
| **베팅·카지노** | `casino.toast.*`, `casino.error.*` (toast로 노출 시) | **금지 0개** |
| **트레이딩** | `trade.toast.*`, 주문·체결·청산·증거금 토스트 | **금지 0개** |
| **그 외 전부** | `earn.toast.*`, `daily.*Toast`, `viral.toast.*`, `referral.toast.*`, `wallet.toast.*`, `mission.toast.*`, `tier.toast.*`, `pwa.toast.*`, `support.toast.*`, `auth.toast.*`, `toast.*` | **귀여운 이모티콘 1개** (문장 **앞** 권장) |

**귀여운 이모티콘 허용 예 (ko/en 동일):** `🎉` `✨` `🎁` `💫` `🙌` `⭐` `🔥`(Earn FOMO만) — **토스트당 최대 1개**.  
**금지:** `casino`/`trade` 존에 위 이모티콘 또는 임의 유니코드 이모지.

**Admin (`admin.toast.*`):** 이모티콘 없음 — 운영 톤 유지.

#### Lovable 구현 (`components/ui/` 또는 `hooks/use-app-toast.ts`)

```ts
type ToastSurface = 'default' | 'casino' | 'trade';

// surface 'casino' | 'trade' → title/description에 이모티콘 strip + dev assert
// surface 'default' → i18n 문자열 그대로 (이모티콘은 catalog에만)
toast({ surface: 'default', titleKey: 'daily.claimedToast', values: { amount } });
toast({ surface: 'casino', titleKey: 'casino.toast.settled' }); // emoji-free
toast({ surface: 'trade', titleKey: 'trade.toast.orderFilled' }); // emoji-free
```

**게이트 (Phase 6 + Phase 10):**

- [ ] `grep -P '[\x{1F300}-\x{1FAFF}]' ` on `casino.toast` / `trade.toast` ko+en lines → **0 matches**  
- [ ] Earn·viral·daily 샘플 토스트 ko catalog → 이모티콘 ≥1 (allowed zones)  
- [ ] vitest: `useAppToast` strips emoji when `surface: 'casino'|'trade'`

**PHONARA 기존 키 (paste merge 시):** `casino.toast.*`, `daily.claimedToast` — casino는 이모 없음 유지; daily는 ko에 `🎉` 등 **추가 가능** (meaning change 없이 톤만).

---

## §6. FOMO · 이벤트 · 공지 · 리더보드

**`components/fomo/`** (Zenith Phase 7) — 전부 Earn/Games/Trade에 **삽입**:

- `GlobalCountdownBanner`, `LimitedDropCard`, `Leaderboard`, `StreakRing`, `WheelOfFortune`, `EarlyAccessCodeInput`, `SlotMeter`, `LiveActivityFeed` (scripted OK)

**Pages:**

- `ImportedEventsPage` — tier benefits · seasonal · countdown  
- `ImportedAnnouncementsPage` — list/detail  
- `ImportedLeaderboardPage` — weekly/all-time tabs  

**Casino:** tournament page · share round · provably fair — Zenith Phase 8.

### 6.1 게임 규칙 — 10종 전 페이지 필수 (초등학생도 이해)

**원칙:** 플레이 화면에서 **1탭**으로 열리는 **예쁜 규칙 시트**. `/games/fairness`만으로는 **불충분**.

**UI:** `GameRulesTrigger` (`casino-game-rules`) → `GameRulesSheet` — numbered steps · tip cards · payout box · fairness 링크  
**카피:** 전부 `casino.rules.{gameCode}.*` i18n — JSX 한국어 0  
**말투:** 친절한 `~해요` · 짧은 문장 · 어려운 말은 괄호로 풀어쓰기 · **보장 수익·확정 당첨 표현 금지**

**게임 규칙 vs 토스트:** 규칙 시트에는 가벼운 이모 OK(과하지 않게). **베팅 결과 토스트**(`casino.toast.*`)는 §5.4대로 **이모 0**.

#### ko catalog 예시 (Crash — Lovable이 10종 동일 깊이로 작성)

```text
casino.rules.crash.title:       '크래시 게임 방법'
casino.rules.crash.summary:     '숫자(배수)가 쭉 올라가요. 터지기 전에 그만두면 이겨요!'
casino.rules.crash.step1:       '1. 먼저 베팅할 금액을 정해요.'
casino.rules.crash.step2:       '2. 그래프의 배수(몇 배로 불어나는지)가 올라가요.'
casino.rules.crash.step3:       '3. 마음에 드는 순간 "캐시아웃"을 눌러 그만두면 그 배수만큼 받아요.'
casino.rules.crash.step4:       '4. "자동 캐시아웃"을 켜두면, 내가 정한 배수에 도달하면 자동으로 그만둬요.'
casino.rules.crash.step5:       '5. 그래프가 터진 뒤에 그만두면 베팅은 0이에요. 빠르게 결정하는 게 중요해요!'
casino.rules.crash.tip1:        '💡 처음엔 작은 금액으로 연습해보세요.'
casino.rules.crash.tip2:        '💡 자동 캐시아웃은 손이 느릴 때 도움이 돼요.'
casino.rules.crash.payout:      '이기면: 베팅금 × 캐시아웃한 배수. 정확한 금액은 화면에 표시된 값을 따라요.'
casino.rules.common.cta:        '게임 방법'
```

**10종 checklist (step≥4 · tip≥2 · payout · summary 각각):**  
crash · plinko · mines · limbo · hilo · dice · mint_reels · gold_rush · blackjack · roulette

**엔진 정합:** GAMES-INTEGRATION selection/베팅 타입과 **다른 규칙 설명 금지** (예: roulette street/corner 미지원 → rules에도 없음).

---

## §7. Trade · Staking · Admin (빠짐 없음)

### 7.1 Trade

- Mobile: `MobileTradeView`, bottom sheets  
- Desktop: order book · chart shell · positions · leverage slider · FomoStack  
- Spot / Futures tab — `trade.spot`, `trade.futures`  
- High leverage warning + ack — `trade.highLeverageWarning`  
- **Props only** — no order RPC in Lovable components

### 7.2 Staking

- `ImportedStakingPage` — terms · est reward · stake/unstake confirm  
- i18n: `staking.*` (PHONARA catalog exists)

### 7.3 Admin (별도 tree)

Zenith Phase 9 — overview · alerts · queues (deposit/KYC/withdraw) · audit · operations · MFA

---

## §8. 전체 페이지 인벤토리 (User — 32 named exports)

| # | Component | Route |
|---|-----------|-------|
| 1–25 | *(Zenith Phase 8 표)* | *(동일)* |
| 26 | `ImportedDepositPage` | `/wallet/deposit` |
| 27 | `ImportedWithdrawPage` | `/wallet/withdraw` |
| 28 | `ImportedFaqPage` | `/faq` |
| 29 | `ImportedSupportChatPage` | `/support` |
| 30 | `ImportedAffiliatePage` | `/affiliate` |
| 31 | `ImportedTierBenefitsPage` | `/tier` |
| 32 | `ImportedViralMissionsPage` | `/earn/viral` *(또는 Earn 탭 inline — export는 필수)* |

**게이트:** **32/32** `export function Imported*Page` — route wrapper ≤30 lines.

---

## §9. i18n 네임스페이스 (Lovable catalog 추가)

기존 Zenith Phase 10 + **필수 추가:**

- `tier.*` — name, perk, progress, locked, unlocked  
- `viral.*` — mission titles, quota, cooldown, toolkit  
- `faq.*` — categories, items, search  
- `support.*` — chat, hours, offline, queue  
- `wallet.deposit.crypto.*` — chain, address, min, confirmations  
- `wallet.deposit.nextAction.*` — post-deposit CTAs  
- `affiliate.*` — tree, commission preview, tier  
- `casino.rules.*` · `casino.rules.common.*` — **10 games**, step/tip/payout per §6.1  
- `pwa.iosGuide.*` — add to home steps  
- `toast.*` · `earn.toast.*` · `viral.toast.*` · `trade.toast.*` · `wallet.toast.*` · `mission.toast.*` · `support.toast.*` — **§5.4 이모티존** 준수  

**JSX `[가-힣]` 0** — ko는 catalog only. **이모티콘도 catalog only** (casino/trade toast 키 제외).

---

## §10. 엔진 경계 요약 (Lovable vs PHONARA Cursor)

| 영역 | Lovable | PHONARA (paste 후) |
|------|---------|-------------------|
| 8× `mission_code` | UI + `onClaim` callback | hooks → `rpc_*` |
| 바이럴 미션 + quota | Full UI, mock reward | **신규 RPC 필요 — 별도 승인** |
| VIP tier progress | props/mock | adapter 또는 신규 RPC |
| KRW deposit | Full UI | `rpc_create_krw_deposit_request` |
| Crypto deposit | Full UI | adapter (엔진 경로 확인 후) |
| Withdraw | Full UI | withdrawal RPC hooks |
| Support chat | UI shell | Crisp/Supabase/3rd party — 별도 |
| FAQ content | props/CMS shape | Admin CMS 또는 static i18n |
| Trade/Staking/Casino | props/callbacks | existing hooks |

**Lovable RED:** Supabase import, money 재계산, `result.grid`, hyphen gameCode — Zenith §0.2.

---

## §11. 품질·퍼널 자가 점검 (Lovable 완료 전)

- [ ] Landing → Signup → Earn **3탭 이내**  
- [ ] Earn → Deposit → Games **CTA visible**  
- [ ] Tier badge **3곳 이상** (TopBar, AccountSheet, Earn)  
- [ ] 바이럴 미션 **quota UI** every card  
- [ ] 광고/설문 미션 **0건**  
- [ ] Crypto deposit tab **default**  
- [ ] FAQ + Support FAB **전 route**  
- [ ] PWA install + offline + update **3 surface**  
- [ ] 32/32 Imported*Page  
- [ ] ko/en full · JSX Korean 0  
- [ ] Toast §5.4: casino/trade toast **emoji 0** · Earn 등 **emoji 1**  
- [ ] **10/10 game rules:** step≥4 · tip≥2 · `casino-game-rules` on each HUD  

---

*PHONARA Product Platform Manifest · v1 · 2026-06-14 · companion to LOVABLE_ZENITH_MASTER_PLAN.md*
