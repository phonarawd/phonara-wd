# PHONARA 전체 플랫폼 Zero Assumption Audit — 참고 정본

> **상태:** 참고용 감사 문서 · 실행 큐 아님  
> **감사일:** 2026-07-12  
> **원본:** Cursor Canvas `platform-zero-assumption-audit.canvas.tsx`  
> **고정 Supabase 프로젝트:** `yocjhjsdwoijfdrehzoq`  
> **Denylist:** 이 문서는 `docs/rebuild/NEXT_STEP.md`와 별개이며 denylist 대상이 아니다.

## 후속 수정 필독 규칙

- 이 감사 결과를 근거로 수정·보완·재검증 작업을 시작할 때는 **코드 수정 전에 이 문서를 먼저 읽는다.**
- 이 문서는 결함과 증거를 보존하는 **참고 정본**이다. 실행 순서와 착수 권한은
  [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md)와
  [`docs/PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)를 따른다.
- 이 문서를 근거로 완료 todo를 재착수하거나 엔진·migration 변경을 자동 승인하지 않는다.
- `docs/rebuild/NEXT_STEP.md`를 복구하거나 이 문서로 대체하지 않는다.
- `UNVERIFIED` 항목은 추측으로 확정하지 않고 지정된 실제 실행 환경에서 다시 확인한다.

---

## 1. 감사 범위와 증거 원칙

| 등급         | 대상                                    | 의미                                                                            |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------- |
| `STATIC`     | 현재 작업 트리                          | route, surface, control, handler, RPC, type, CSS를 파일과 라인으로 추적         |
| `DB`         | Supabase `yocjhjsdwoijfdrehzoq`         | catalog, migration, advisor, log, aggregate `SELECT`만 사용                     |
| `DEPLOYED`   | `https://preview.phonara-web.pages.dev` | WebFetch로 공개 본문과 404/stub 확인 · JavaScript DOM 렌더는 아님               |
| `UNVERIFIED` | Browser 1455px·580px                    | Browser MCP 부재로 viewport, bounding box, click, network 미검증                |
| `UNVERIFIED` | Admin runtime                           | Admin URL과 로그인 탭을 현재 도구에서 볼 수 없음                                |
| `UNVERIFIED` | `SS-01`~`SS-48` 원본                    | 이 실행에는 이미지 파일이 없고 감사 plan의 설명만 존재                          |
| `READ-ONLY`  | 상태 변경                               | submit, bet, trade, withdraw, 권한 변경, DDL, DML, gate, test 모두 미실행       |
| `UNVERIFIED` | Repo 기준 상태 귀속                     | 제공된 시작 snapshot과 첫 git capture 사이 path set drift가 있어 원인 귀속 불가 |

### Runtime 판정 범위

Preview 공개 HTML은 확인했지만 Browser MCP가 없어 1455px·580px 렌더, BottomNav 겹침,
44×44 touch target, 로그인 후 route, console/network를 검증하지 못했다. 해당 항목은
결함으로 확정하지 않고 `UNVERIFIED`로 유지한다.

---

## 2. 감사 스냅샷

| 항목                | 값                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Branch              | `phase-r/platform-integrity-2026-07-11`                                                                             |
| HEAD                | `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`                                                                          |
| HEAD subject        | `fix(test): mock app-install action in home missions controller tests`                                              |
| 감사 시작 작업 트리 | modified 32 + untracked 1                                                                                           |
| 기준 상태 drift     | 제공 snapshot은 `.cursorignore` 수정, 첫 agent capture는 `apps/admin/src/routeTree.gen.ts` 수정 · 원인 `UNVERIFIED` |
| Web preview         | `https://preview.phonara-web.pages.dev`                                                                             |
| Supabase project    | `yocjhjsdwoijfdrehzoq` only                                                                                         |
| DB capture          | 2026-07-12 20:41–20:59 KST                                                                                          |
| 개인정보            | Canvas·본 문서에서 사용자별 row, 이메일, UUID, IP를 재노출하지 않음                                                 |
| 직접 변경           | DB·배포 write 0 · test/gate 실행 0                                                                                  |

---

## 3. 통합 요약

| 심각도           |  수 |
| ---------------- | --: |
| Critical         |   2 |
| High             |  11 |
| Medium           |  21 |
| DB advisor ERROR |   0 |

### 출시 차단

공개 랜딩의 합성 사회적 증거와 작업 트리의 고정 정상 상태 페이지는 현재 원격 사실과
충돌한다. 이 두 영역은 배포 전에 먼저 닫아야 한다.

### 표면 분모

| 대상   | 분모                                      |
| ------ | ----------------------------------------- |
| Web    | canonical 84 · route file 93              |
| Admin  | canonical 29 · redirect 3 · route file 34 |
| Casino | dynamic slug 12/12                        |

### DB 분모

| 대상                     |  분모 |
| ------------------------ | ----: |
| Public tables            |   137 |
| Public views             |     4 |
| Columns                  | 1,425 |
| Function overloads       |   592 |
| Function names           |   589 |
| RLS policies             |   248 |
| Remote migration rows    |   231 |
| Distinct migration names |   230 |

### 엔진 안전

| 항목                     | 결과  |
| ------------------------ | ----- |
| PHON·USDT·KRW 보존       | `Σ=0` |
| Wallet hash-chain broken | 0     |
| System hash-chain broken | 0     |
| Latest reconciliation    | `ok`  |

### 원격 상태 요약

| 상태                           |      수치 |
| ------------------------------ | --------: |
| Halted markets                 |   33 / 42 |
| Stale oracle prices            |   35 / 42 |
| Stale sports odds              | 337 / 337 |
| Crypto provider missing config |     2 / 2 |

Source: Supabase catalog·aggregate `SELECT` · 2026-07-12 20:59 KST.

---

## 4. 근거 기반 즉시 착수 순서

| 순서 | 목표           | 작업                                                                               |
| ---: | -------------- | ---------------------------------------------------------------------------------- |
|    0 | 출시 신뢰 보호 | 작업 트리 `/status` 배포 중지 · 합성 회원/지급/후기 숨김                           |
|    1 | 머니 표기      | `1 PHON = 1 KRW` 제거 · live FiatHint · `P`→`PHON` 통일                            |
|    2 | 보안           | `rpc_lock_wallet` client revoke · anon write abuse guard · leaked-password 보호    |
|    3 | 시장 운영      | crypto provider 설정 · price feed/market breaker · sports odds ingest 복구         |
|    4 | 노출·배포      | Crypto/Sports/Giftcard/Withdrawal gate와 실제 capability 일치 · E10 preview 재배포 |
|    5 | Admin          | role menu allowlist · settlement reason/RBAC · tier write 상태 정합                |
|    6 | 타입·UI 수렴   | RPC casts 제거 · money formatter · raw controls/token debt 정리                    |
|    7 | 런타임 확인    | Browser MCP로 1455px·580px 전체 route·44px·network 재검증                          |

---

## 5. 전체 사이트맵

### 5.1 Web canonical route — 84

| 도메인           |  수 | Canonical routes                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 공개·인증        |   7 | `/` · `/login` · `/signup` · `/reset-password` · `/verify-email` · `/auth/callback` · `/install`                                                                                                                                                                                                                                                                        |
| 마케팅·신뢰      |  12 | `/features` · `/features/earn` · `/features/vip` · `/fees` · `/security` · `/announcements` · `/status` · `/support` · `/support/faq` · `/support/ticket` · `/feedback` · `/tier`                                                                                                                                                                                       |
| 법적 고지        |   6 | `/legal/terms` · `/legal/privacy` · `/legal/cookies` · `/legal/affiliate` · `/legal/risk-disclosure` · `/legal/responsible-gaming`                                                                                                                                                                                                                                      |
| Earn             |  19 | `/home` · `/home/missions` · `/home/missions/invite` · `/home/missions/referral` · `/home/attendance` · `/referral` · `/referral/invite` · `/referral/leaderboard` · `/tier/me` · `/tier/benefits` · `/tier/leaderboard` · `/earn/cashback` · `/earn/play` · `/events` · `/share/earnings` · `/onboarding` · `/onboarding/missions` · `/staking` · `/staking/positions` |
| Wallet           |  13 | `/wallet` · `/wallet/deposit` · `/wallet/deposit/crypto` · `/wallet/deposit/krw` · `/wallet/deposit/giftcard` · `/wallet/withdraw` · `/wallet/withdraw/crypto` · `/wallet/withdraw/krw` · `/wallet/transfer` · `/wallet/redeem` · `/wallet/redeem/giftcard` · `/ledger` · `/rewards/history`                                                                            |
| Trade            |   4 | `/trade` · `/trade/futures` · `/trade/positions` · `/trade/orders`                                                                                                                                                                                                                                                                                                      |
| Sports           |   7 | `/sports` · `/sports/prematch` · `/sports/live` · `/sports/my-bets` · `/sports/rules` · `/sports/vip` · `/sports/fixture/$fixtureId`                                                                                                                                                                                                                                    |
| Casino           |   3 | `/casino` · `/casino/fairness` · `/games/$gameCode`                                                                                                                                                                                                                                                                                                                     |
| Account·Settings |  13 | `/account` · `/account/profile` · `/account/kyc` · `/account/responsible-gaming` · `/settings` · `/settings/account` · `/settings/security` · `/settings/bank-accounts` · `/settings/referral` · `/settings/preferences` · `/settings/notifications` · `/settings/api-keys` · `/notifications`                                                                          |

### 5.2 Casino dynamic game route — 12

`/games/$gameCode`는 아래 12개 slug로 확장된다.

1. `crash`
2. `limbo`
3. `dice`
4. `mines`
5. `hilo`
6. `plinko`
7. `mint-reels`
8. `gold-rush`
9. `roulette`
10. `blackjack`
11. `deepshaft`
12. `momentum`

### 5.3 Web redirect

| 종류          |  수 |
| ------------- | --: |
| Registry 전체 |  66 |
| Exact         |  56 |
| Prefix        |   7 |
| Query         |   3 |

- `/r/$code` → signup referral
- betting id helper와 trade query strip 추가

### 5.4 Shell navigation

- BottomNav 5: Earn · Wallet · Trade · Sports · Casino
- Earn chip 10
- Wallet chip 6
- Trade chip 5
- Sports chip 6
- Casino chip 2
- `/onboarding`은 Earn boundary지만 matcher 활성화가 누락됐다.

### 5.5 Admin route

| 분류        |  수 | Routes                                                                                                                                                                                                                                                                                                                                          |
| ----------- | --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 운영 데스크 |  25 | `/` · `/queues` · `/deposits` · `/withdrawals` · `/sports` · `/earn` · `/earn/referrals` · `/earn/missions` · `/earn/rewards` · `/earn/activity` · `/viral-stats` · `/users` · `/tiers` · `/tier-benefits` · `/promotions` · `/cms` · `/casino` · `/risk` · `/staking` · `/audit` · `/settings` · `/team` · `/support` · `/ops` · `/mfa/policy` |
| 인증·MFA    |   3 | `/login` · `/mfa/enroll` · `/mfa/challenge`                                                                                                                                                                                                                                                                                                     |
| 상세 링크   |   1 | `/users/$userId/tier`                                                                                                                                                                                                                                                                                                                           |
| 리다이렉트  |   3 | `/rewards` → `/earn/rewards` · `/audit-logs` → `/audit` · `/config` → `/settings`                                                                                                                                                                                                                                                               |

### 5.6 Route·surface drift

| 유형            | 항목                                                                       | 판정                                       |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| Dead raw target | `/casino/tournaments`                                                      | registry 잔존 · route 없음 · chip은 필터됨 |
| Orphan surface  | `domain-hub-page` · `system-status-stub-page` · `support-ticket-stub-page` | route import 없음                          |
| Subnav omission | `/events` · `/referral/leaderboard` · `/tier/leaderboard` 등               | route는 있으나 Earn chip 없음              |
| Deploy drift    | `/status` · `/support/ticket` · `/tier/leaderboard`                        | preview stub/stub/404 · worktree live      |

---

## 6. Route-group 상호작용 추적

정적 control ledger는 route·surface별로 handler → controller/hook → navigate/RPC/table까지
묶었다. Browser MCP 부재로 실제 click 성공과 disabled computed state는 별도 확인이 필요하다.

| 도메인    | Route/화면                               | Control 분모                                              | Handler/API chain                                              | 판정                                                  | 근거                                                                                                                                                                             |
| --------- | ---------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell     | 전역                                     | BottomNav 5 · 알림 · 계정                                 | `Link` → canonical route                                       | 일부 불일치                                           | `bottom-nav.tsx:23-29` · `top-bar.tsx:45-81`                                                                                                                                     |
| Earn      | Earn 왼쪽 메뉴                           | 10/10                                                     | `EARN_SUBNAV` → `Link`                                         | `STATIC` route 정합 · runtime `UNVERIFIED`            | `earn-subnav.ts:12-33` · `domain-subnav.tsx:49-109`                                                                                                                              |
| Earn      | `/home`                                  | 상호작용 최대 14 · tier 없음 13                           | Link · resolver · mission controller                           | `STATIC` 결함: 카드 3개 비활성 · runtime `UNVERIFIED` | `earn-home-page.tsx:110-133,163-269,388-428,443-463`                                                                                                                             |
| Earn      | `/home/missions`                         | 탭·상세·claim·install 약 20                               | controller → viral/repeatable RPC                              | `STATIC` RPC 정합 · runtime `UNVERIFIED`              | `home-missions-page.tsx:92-245` · `use-home-missions-page-controller.ts:116-129,234-309` · `use-repeatable-missions.ts:59-85`                                                    |
| Earn      | `/referral*` · `/share/earnings`         | 복사·공유·Kakao·claim                                     | Clipboard/Web Share/Kakao → mission RPC                        | 기능 환경 의존                                        | `use-referral-invite-page-controller.ts:198-256`                                                                                                                                 |
| Earn      | `/events` · `/earn/play`                 | tap · spin · season links                                 | golden-earth/spin RPC                                          | `STATIC` RPC 정합 · runtime `UNVERIFIED`              | `events-hub-page.tsx:127-164` · `use-events-hub-page-controller.ts:27-93` · `use-earn-play-page-controller.ts:83`                                                                |
| Earn      | `/staking*`                              | wizard · stake · claim · unstake                          | `rpc_stake*` · `rpc_claim_staking_reward` · `rpc_unstake_phon` | `STATIC` RPC 정합 · runtime `UNVERIFIED`              | `staking-hub-page.tsx:308-676` · `use-trading.ts:1809-1884`                                                                                                                      |
| Wallet    | `/wallet`                                | 입금·출금·원장·새로고침                                   | platform gates → route/RPC                                     | 출금 차단                                             | `wallet-page.tsx:174-247` · `use-wallet-page-controller.ts:38-70` · `use-platform-gates`                                                                                         |
| Wallet    | `/wallet/deposit*`                       | KRW·Crypto·Giftcard 3 rail                                | create request RPC/edge                                        | Crypto 노출 결함                                      | `deposit-hub-display.ts:38-58` · `use-deposit-hub-controller.ts:70-95` · `use-krw-deposit-controller.ts:68-120` · `use-crypto-deposit.ts:39-110` · `launch-gates.ts:8`           |
| Wallet    | `/wallet/withdraw*`                      | KRW·Crypto submit                                         | `rpc_request_withdrawal`                                       | 전역 차단                                             | `withdraw-hub-display.ts:34-47` · `use-withdraw-hub-controller.ts:48-80` · `use-krw-withdraw-controller.ts:141-220` · `use-crypto-withdraw-controller.ts:84-150` · app_config DB |
| Wallet    | `/wallet/transfer` · `/wallet/redeem*`   | transfer · preview · redeem                               | P2P/giftcard RPC                                               | Giftcard 시장 비활성                                  | `use-wallet-transfer-controller.ts:52-145` · `use-giftcard-redeem-controller.ts:49-175` · `wallet.ts:300-364` · giftcard DB                                                      |
| Wallet    | `/ledger` · `/rewards/history`           | 검색·기간·통화·페이지                                     | RLS table read                                                 | `STATIC` read 정합 · runtime `UNVERIFIED`             | `use-wallet.ts:61-99` · `ledger-page.tsx:170-282` · `rewards-history-page.tsx`                                                                                                   |
| Auth      | `/login` · `/signup` · `/reset-password` | password · magic · passkey · forms                        | Supabase Auth                                                  | SIWE 숨김                                             | `use-login-page-controller.ts:50-125` · `lib/auth.ts` password/magic/passkey · `launch-gates.ts:98`                                                                              |
| Account   | `/account` · `/settings*`                | 프로필·KYC·MFA·bank·API key                               | Auth/table/RPC/local prefs                                     | 알림 노출 불일치                                      | `use-account-hub-controller.ts:45-90` · `use-settings-hub-controller.ts:42-95` · `use-settings-api-keys-controller.ts:53-92` · `settings-hub-display-contract.ts:83-131`         |
| Marketing | `/support/ticket`                        | 분류·제목·본문·확인·submit                                | `rpc_create_support_ticket` · list                             | 작업 트리 live·배포 stub                              | `support-ticket-page.tsx:34-227` · `use-support-ticket-controller.ts:26-90` · `support-ticket-display-contract` RPC constants                                                    |
| Marketing | `/status`                                | 구성요소 5 · 공지·지원 링크                               | 정적 상태만                                                    | 거짓 정상 표시                                        | `system-status-page.tsx:48-83`                                                                                                                                                   |
| Trade     | `/trade*`                                | spot/futures ticket·chart·orders·positions control groups | ticket/wire → spot/futures RPC · chart feed                    | 대규모 market halt                                    | `use-spot-desk-wire.ts:408-515` · `use-futures-desk-wire.ts:366-560` · `use-trading.ts:1208-1884` · DB breaker snapshot                                                          |
| Sports    | `/sports*`                               | league·fixture·odds·slip·cashout                          | `sportsRpc` → list/place/cashout RPC                           | 배당 오래됨·place 차단                                | `use-sports-betting.ts:101-432` · `launch-gates.ts:9-12`                                                                                                                         |
| Sports    | `/sports/vip`                            | 등급 조회·fixture board·돌아가기                          | `rpc_get_user_tier_summary` + 공용 fixture                     | 전용 VIP market 없음                                  | `sports-vip-stub-panel.tsx:45-152`                                                                                                                                               |
| Casino    | `/casino`                                | 12개 Play · category · fairness                           | anchor → `/games/{slug}`                                       | `STATIC` 12/12 route 정합 · runtime `UNVERIFIED`      | `casino-lobby-page.tsx:76-82,202-278`                                                                                                                                            |
| Casino    | `/games/$gameCode`                       | stake·prepare·place·auto·live·PF                          | open/place/reveal + E23 ×9 RPC                                 | `STATIC`·DB 정합 · runtime `UNVERIFIED`               | `casino-game-shell.tsx:594-721` · `use-casino-round.ts:136-183` · `use-game-pf-state.ts:33-65` · `use-progressive-round.ts:53-103` · `use-live-crash.ts:59-108`                  |
| Admin     | AdminNav                                 | desktop 25 · mobile 8                                     | Link · route gate                                              | 역할 메뉴 필터 미적용                                 | `admin-nav.tsx:28-77,160-199`                                                                                                                                                    |
| Admin     | `/queues` · `/deposits` · `/withdrawals` | 탭 12 · 승인·거절·전송·proof                              | reason dialog → admin RPC                                      | 일부 client RBAC 없음                                 | `admin-queues-page.tsx:183-206,944` · `domain/queues.ts:43-110` · `useAdminWalletDesk.ts:300-390`                                                                                |
| Admin     | `/sports` · `/casino` · `/staking`       | settle·halt·void·status·pool                              | confirm → admin RPC                                            | client RBAC 없음                                      | `admin-sports-page.tsx:90-160,350-371,570` · `useAdminSports.ts:240` · `admin-casino-page.tsx:76-129` · `admin-staking-page.tsx`                                                 |
| Admin     | `/earn*`                                 | settlement·mission·reward·referral                        | affiliate/mission/wallet RPC                                   | settlement 사유 UX 결함                               | `admin-earn-page.tsx:358` · `useAdminEarnDesk.ts:120-128`                                                                                                                        |
| Admin     | `/users` · `/tiers` · user tier          | moderate·tier detail·read                                 | admin user/tier RPC                                            | tier write UI 누락                                    | `useAdminUserTierDesk.ts:129-147`                                                                                                                                                |
| Admin     | `/cms` · `/promotions` · `/casino`       | publish·archive·activate·빈 상태 refresh                  | admin CMS/RPC                                                  | refresh no-op                                         | `admin-cms-page.tsx:84` · `admin-promotions-page.tsx:77`                                                                                                                         |
| Admin     | `/team` · `/support` · `/mfa/policy`     | role grant·ticket resolve·MFA policy                      | reason + audited RPC                                           | `STATIC` owner 정합 · runtime `UNVERIFIED`            | `useAdminTeamDesk.ts:114-173` · `useAdminSupportDesk.ts:200-230` · `useAdminMfaPolicyDesk.ts:140-175`                                                                            |

---

## 7. 통합 결함 등록부

### 7.1 Critical

| ID   | 도메인 | 결함                                                             | 증상                                                                                 | 근본 원인                                                                                    | 근거                                                                                                                | 즉시 조치                                    |
| ---- | ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| C-01 | Trust  | 공개 랜딩이 합성 수치를 실제 참여·지급 실적처럼 표시             | 100만+ 회원, 동시 가입자, 156,800,000 PHON, 52,400건 출금, 실제 참여자 후기가 노출됨 | member/signup bot과 정적 누적 수치·후기 pool을 기본 presentation 모드에서 사실형 문구로 렌더 | `landing-member-bot.ts:8-12,61-97` · `landing-display-contract.ts:140-233` · i18n `index.ts:602-624` · `DEPLOYED /` | 즉시 숨김 또는 검증된 집계만 표시            |
| C-02 | Status | 작업 트리 `/status`가 원격 장애와 무관하게 전 구성요소 정상 표시 | Trade·Sports·Crypto가 실제로 저하됐지만 공개 상태 화면은 모든 lane을 정상으로 표시   | `SystemStatusPage`가 health RPC/table을 읽지 않고 `StatusBadge state="settled"`를 고정       | `system-status-page.tsx:48-83` · DB 33/42 halt · 35/42 stale · crypto missing_config                                | live 상태 연결 전 배포 금지 · 현재 stub 유지 |

### 7.2 High

| ID   | 도메인   | 결함                                                           | 증상                                                                                                 | 근본 원인                                                                                    | 근거                                                                                                                 | 즉시 조치                                              |
| ---- | -------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| H-01 | Money    | 랜딩 지갑이 `1 PHON = 1 KRW`로 잘못 환산                       | 2,900 PHON을 약 ₩2,900으로 표시하나 최신 활성 rate는 14.910000                                       | 같은 JS number를 PHON과 KRW에 재사용하고 고정 1:1 문구 노출                                  | i18n `index.ts:596-600` · `landing-display-contract.ts:133,259-264` · DB rate 2026-07-12T11:59:05Z                   | FiatHint snapshot 사용 또는 환산 제거                  |
| H-02 | Security | 범용 `rpc_lock_wallet`이 authenticated에 노출                  | 사용자가 임의 reason/idempotency로 자기 지갑 잠금을 호출하고 wagering progress 조건을 자극할 수 있음 | generic wallet mutator 재GRANT가 privilege policy와 충돌                                     | `20260701000001_phon_bonus_real_wagering.sql:679-680` · `check-wallet-mutator-privileges.ts:48-54` · live definition | client EXECUTE revoke · 목적별 guarded RPC만 허용      |
| H-03 | Wallet   | Crypto rail 노출과 운영 설정이 서로 모순                       | 입출금 허브에 Crypto가 보이지만 TRC20/ERC20 provider는 missing_config, 주소·요청 0                   | `LAUNCH_GATES.cryptoRails=false`가 hub rail 필터에 적용되지 않음                             | `launch-gates.ts:8` · deposit/withdraw hub display · DB provider failures 13k+                                       | rail 숨김 후 provider 설정·주소 생성 검증              |
| H-04 | Trade    | 시장 데이터는 대규모 저하인데 edge 완료 이벤트는 `ok`          | 42개 시장 중 33 halt, oracle 35 stale; price-feed 이벤트 24시간 1,440건은 모두 `ok`                  | job 완료 상태와 provider/circuit 결과를 분리해 false-green 관측                              | DB `market_circuit_breakers` · `oracle_prices` · `provider_health` · `edge_ops_events`                               | job status를 부분 실패와 연동하고 시장 원인 복구       |
| H-05 | Sports   | 스포츠 배당 337개가 모두 오래됐고 베팅·cashout은 브라우저 차단 | UI는 배당 대신 `—`를 표시할 수 있고 place/cashout은 built_disabled                                   | odds ingest 중단 + `LAUNCH_GATES.sportsBetting/sportsCashout=false`                          | DB newest odds 2026-06-16 · `launch-gates.ts:9-12` · `sports-fixture-board.tsx:213-250`                              | ingest 복구·freshness gate 후에만 노출                 |
| H-06 | Deploy   | 배포본과 현재 작업 트리가 핵심 trust route에서 분리            | 배포 `/status`·`/support/ticket`은 stub, `/tier/leaderboard`는 404; 작업 트리는 live                 | 미커밋 E10 변경과 미리보기 배포 버전 불일치                                                  | `DEPLOYED` WebFetch 2026-07-12 · current route/surface files                                                         | 검증 전 상태 페이지 제외 · 나머지 route 배포 일치 확인 |
| H-07 | Admin    | Admin 역할별 메뉴 allowlist가 실제 nav에 적용되지 않음         | viewer 등 제한 역할도 다수 desk 링크를 보게 됨                                                       | `AdminNav`는 team/support만 필터하고 `ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST` 미사용           | `admin-nav.tsx:69-77` · `admin-beginner-language-display-contract.ts:172-211`                                        | desktop/mobile nav 모두 동일 RBAC predicate 적용       |
| H-08 | Admin    | Earn settlement 승인에 운영자 사유 입력이 없음                 | 승인 버튼이 즉시 실행되고 고정 문자열을 사유로 전송                                                  | 공용 reason dialog와 `can(earn.settlement.approve)` 검사를 우회                              | `admin-earn-page.tsx:358` · `useAdminEarnDesk.ts:120-128`                                                            | 확인·사유·RBAC를 한 경로로 통합                        |
| H-09 | Auth     | Supabase leaked-password protection 비활성                     | 유출된 비밀번호 차단 보호가 적용되지 않음                                                            | Auth 설정 미활성                                                                             | Supabase security advisor `auth_leaked_password_protection` WARN                                                     | Auth 설정 활성화 후 로그인 회귀 확인                   |
| H-10 | Wallet   | 출금 기능이 원격 feature flag로 전역 중지                      | 시스템 전체 halt는 아니지만 모든 출금 CTA가 차단된 운영 상태                                         | `app_config feature_withdrawal_enabled=false` · 코드 결함인지 운영 의도인지는 별도 확인 필요 | DB `app_config` · `platform-gate-contract.ts:14,64`                                                                  | 운영 사유 확인 후 출금 준비 조건과 함께 복구           |
| H-11 | Wallet   | Giftcard 시장 6개가 전부 비활성                                | 상품권 rail은 노출되지만 사용 가능한 fee market이 없는 운영 상태                                     | `giftcard_fee_market enabled 0/6`, 마지막 점검 2026-06-29 · 공급자 정책 사유 미확인          | DB `giftcard_fee_market` aggregate · `wallet.ts:234-236`                                                             | 검증된 공급자만 활성화하거나 rail 숨김                 |

### 7.3 Medium

| ID   | 도메인   | 결함                                                   | 증상                                                                                               | 근본 원인                                                            | 근거                                                                                               | 즉시 조치                                          |
| ---- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| M-01 | Money    | `P`와 `PHON` 단위가 같은 흐름에서 혼용                 | 미션은 `+200P`, 합계·지갑은 PHON으로 표시                                                          | `EARN_STATIC_MISSIONS`의 문자열 `rewardLabel`을 그대로 재사용        | `earn-static-missions.ts:3-237` · `landing-page.tsx:305-317` · i18n `index.ts:501-502`             | PHON 단위와 MoneyDisplay로 통일                    |
| M-02 | Admin    | Admin 3개 desk가 PHON 금액을 문자열로 이어 붙임        | 그룹·소수 정규화 없이 raw PHON이 표시됨                                                            | MoneyDisplay/`formatMoney` 우회                                      | `admin-tiers-page.tsx:145` · `admin-earn-missions-page.tsx:269` · `admin-viral-stats-page.tsx:222` | 공용 money formatter 사용                          |
| M-03 | Trade    | 비지갑 base asset도 USDT precision으로 포맷            | BTC·ETH 수량이 USDT 6자리 규칙을 적용받음                                                          | `formatMoney(amount, "USDT")` 뒤 실제 asset label을 별도 붙임        | `spot-desk-page.tsx:99` · `spot-order-ticket.tsx:66`                                               | asset별 quantity formatter 분리                    |
| M-04 | Security | 익명 SIWE·analytics 쓰기에 익명 rate limit이 없음      | anon이 challenge/event row를 반복 생성할 수 있음                                                   | rate limiter가 `auth.uid()`가 있을 때만 실행                         | `20260812000002_ew_e9_identity_support.sql:320-324,830-832` · live grants                          | IP/anonymous key rate limit·payload/retention 제한 |
| M-05 | Security | 함수 hardening 경고가 대량 잔존                        | search_path mutable 8, anon definer 10, authenticated definer 206 경고                             | advisor 0 ERROR만 충족하고 WARN surface를 허용                       | Supabase security advisor: 225 WARN · 3 INFO                                                       | 내부 helper·trigger 권한과 8개 search_path 정리    |
| M-06 | Security | 일부 service-write table에 client DML base GRANT 잔존  | RLS가 현재 차단하지만 `live_crash_rounds` 등은 불필요한 DML privilege 보유                         | GRANT가 policy보다 넓어 방어 계층이 RLS 하나에 의존                  | DB table grants + `pg_policies`                                                                    | 필요하지 않은 base DML revoke                      |
| M-07 | Account  | 알림 센터 launch gate가 chrome마다 다르게 적용         | TopBar·Account는 숨기지만 Settings는 `/notifications` 링크 노출                                    | Settings nav resolver가 `notificationsCenter`를 필터하지 않음        | `top-bar.tsx:45-63` · `settings-hub-display-contract.ts:83-131`                                    | 단일 capability resolver 사용                      |
| M-08 | Earn     | Home Fold4 미션 카드가 route를 받지만 클릭 불가        | 카드 3개가 CTA처럼 보이지만 handler/Link 없음                                                      | controller route가 `MissionCard`에 전달되지 않음                     | `earn-home-page.tsx:416-428` · `use-earn-home-page-controller.ts:163-186`                          | 카드 전체 Link 또는 명시 버튼 제공                 |
| M-09 | Casino   | `/casino/tournaments`가 registry에 남았지만 route 없음 | 현재 chip은 필터되나 직접 URL은 404                                                                | `CASINO_SUBNAV`와 등록 route manifest drift                          | `casino-subnav.ts:4-8` · `subnav-route-manifest.test.ts:121-124`                                   | 항목 삭제 또는 실제 route 계획까지 완전 숨김       |
| M-10 | Trade    | Price alert가 local store에만 저장                     | 브라우저·기기 변경 시 알림 유실                                                                    | server persistence RPC 없음                                          | `trade-price-alert-control.tsx:74-94`                                                              | 제품 의도에 맞게 로컬임을 고지하거나 서버 저장     |
| M-11 | Trade    | limit/stop TP·SL과 cross margin이 구축됐지만 비활성    | 고급 주문 기대와 실제 capability가 어긋남                                                          | `entryTpSlOnOpenOrders=false` · `feature_cross_margin_enabled=false` | `trade-rpc-capabilities.ts:18` · `margin-mode-segment.tsx:67-79` · DB app_config                   | capability에 맞춘 노출·설명 통일                   |
| M-12 | Admin    | 사용자 tier write hook은 열렸지만 화면에 조작 UI 없음  | 운영자가 `setUserTier`를 호출할 수 없음                                                            | `writeUiUnlocked=true`와 page 조립 불일치                            | `admin-tier-option-b-display-contract.ts:14` · `useAdminUserTierDesk.ts:129-147`                   | 승인·사유·RBAC 포함 UI 제공 또는 flag 닫기         |
| M-13 | Admin    | agents tab과 여러 EmptyState action이 no-op            | Earn agents는 빈 배열, CMS·promotion·casino refresh는 아무 동작 없음                               | stub/no-op handler가 production surface에 남음                       | `useAdminEarnDesk.ts:152-173` · `admin-cms-page.tsx:84` · `admin-casino-page.tsx:76,129`           | 행동 제거 또는 실제 refresh 연결                   |
| M-14 | Hygiene  | route 미사용 surface·hook 잔존                         | stub pages와 Admin Access/Giftcard hooks가 live owner 없이 남음                                    | 이전 wave artifact 정리 누락                                         | `domain-hub-page` · `system-status-stub-page` · `support-ticket-stub-page` · `useAdminAccessDesk`  | 정본 확인 후 삭제 또는 명시적 owner 연결           |
| M-15 | Frontend | 공용 primitive·token 우회가 특정 도메인에 집중         | primitive 밖 raw button 42개/22파일, raw input 14개/7파일, `text-[11px]` 2개, chart hard color 6줄 | Casino·Trade·Auth의 page-local control styling                       | `STATIC` production TSX census · `chart-theme.ts:12-16,30`                                         | 접근성·focus·touch size 기준으로 단계 수렴         |
| M-16 | RPC      | RPC 이름은 맞지만 정적 타입 증명이 cast로 약화         | 198 call site 중 dynamic args 11, `as never`/type-lie 33, overload 3                               | 일부 hook이 runtime 문자열과 다른 RPC type으로 강제 cast             | `use-sports-betting.ts:62` · `use-crypto-withdraw.ts:38-70` · Admin hooks                          | typed `callRpc`와 정확한 Args union으로 통합       |
| M-17 | Data     | 운영 auth에 test-like 이름 패턴 3개 존재               | 전체 12개 중 3개가 test/dummy/seed/example 문자열 패턴과 일치                                      | 실제 테스트 계정인지 정상 계정인지 개인정보를 열지 않아 `UNVERIFIED` | DB aggregate only · 신원 비공개                                                                    | 운영자 확인 후 세션·계정 정리                      |
| M-18 | Runtime  | 1455px·580px Browser DOM 검증을 수행할 도구가 없음     | BottomNav 겹침·44px touch target·실제 click/network 판정 불가                                      | 현재 세션 MCP catalog에 Browser/DevTools/Chrome tool 0               | GetMcpTools browser search 0 · WebFetch는 비렌더링 HTTP 본문만 확인                                | Browser MCP 연결 후 동일 분모 재실행               |
| M-19 | PWA      | install banner bottom offset이 shell token과 분리      | chrome 높이 변경 시 BottomNav와 간격/겹침 drift 가능                                               | `4.5rem` 고정값 사용                                                 | `pwa-install-banner.tsx:65` · shell bottomnav token                                                | bottomnav CSS variable 사용                        |
| M-20 | Database | 성능 advisor 경고가 62개 남음                          | auth initplan 26, multiple permissive policies 36                                                  | 정확성은 유지되나 policy evaluation·중복 비용 누적                   | Supabase performance advisor · INFO 191 추가                                                       | hot relation부터 정책 통합                         |
| M-21 | Wallet   | KRW proof RPC는 live지만 Web caller 없음               | proof upload UI gate는 false이고 `rpc_attach_krw_deposit_proof` 미사용                             | E10 backend와 frontend unlock 분리                                   | `launch-gates.ts:130` · live RPC signature · production call inventory                             | 검증된 upload wire 후 gate를 함께 열기             |

---

## 8. 프론트엔드 일관성

### 8.1 반응형·chrome

| 검사                       | 수치·판정    | 근거                                        |
| -------------------------- | ------------ | ------------------------------------------- |
| 390px root bypass          | 0            | page-root `max-w-[390px]`, `w-[390px]` 없음 |
| Surface-owned subnav       | 0            | AppShell 단일 owner                         |
| Table inner min-width      | 7            | 의도된 table/card wrapper 내부              |
| `overflow-x` wrapper files | 19           | 대부분 table/chip/carousel wrapper          |
| AppShell ownership         | 양호         | TopBar·subnav·BottomNav 단일 owner          |
| Admin chrome               | 양호         | desktop aside + mobile header quick nav     |
| Trade sticky CTA           | 양호         | BottomNav height + safe-area offset         |
| PWA banner                 | 개선 필요    | `4.5rem` 고정 bottom offset                 |
| 1455px·580px 실제 DOM      | `UNVERIFIED` | Browser MCP 부재                            |

### 8.2 통화·표시

| 항목                | 현재                               | 정본·판정                    |
| ------------------- | ---------------------------------- | ---------------------------- |
| Landing rate        | `1 PHON = 1 KRW`                   | live `14.910000` · High 결함 |
| Mission reward      | `+200P` 등 26개 label              | PHON과 혼용 · Medium         |
| Admin raw PHON      | 3개 desk 문자열 결합               | MoneyDisplay 우회            |
| Spot base quantity  | USDT formatter 재사용              | BTC/ETH precision 오류 가능  |
| Canonical formatter | `@phonara/money` + MoneyDisplay    | PHON/USDT 6 · KRW 0          |
| FiatHint            | KRW 0자리 · HALF_EVEN · stale 정책 | landing preview만 우회       |

### 8.3 폰트·token·primitive

| 분모                           |        정확한 수 | 비고                         |
| ------------------------------ | ---------------: | ---------------------------- |
| Production product TSX         |              273 | Web 236 · Admin 37           |
| Button primitive import        |        135 files | surface 126                  |
| Card primitive import          |        109 files | surface 105                  |
| Input primitive import         |         48 files | surface 47                   |
| Raw button outside primitives  |    42 / 22 files | Casino·Trade·Auth 집중       |
| Raw input outside primitives   |     14 / 7 files | Trade·Casino·KYC·API keys    |
| `text-[Npx]`                   |                2 | order book `text-[11px]`     |
| `rgb/#hex` in product surfaces | 6 lines / 1 file | `trade/chart/chart-theme.ts` |

Font SOT:

- Pretendard Variable
- Space Grotesk Variable
- JetBrains Mono Variable

세 서체가 `apps/web/src/product/tokens/fonts.css` 한 곳에 있고 Admin도 같은 token entry를
사용한다. 별도 `@font-face` stack은 확인되지 않았다.

---

## 9. DB·RPC 전수 대조

### 9.1 Live catalog

| 항목                       |  수치 | 판정                          |
| -------------------------- | ----: | ----------------------------- |
| Public tables              |   137 | RLS enabled 137/137           |
| Public views               |     4 | 모두 `security_invoker=true`  |
| Columns                    | 1,425 | NOT NULL 1,035 · nullable 390 |
| Primary keys               |   137 | 모든 table                    |
| Foreign keys               |   198 | unique constraint count       |
| Check constraints          |   201 | catalog 실측                  |
| Columns with default       |   553 | catalog 실측                  |
| RLS policies               |   248 | RLS disabled table 0          |
| Function names             |   589 | overload 592                  |
| SECURITY DEFINER overloads |   494 | catalog 실측                  |
| Anon EXECUTE               |    14 | advisor·정의 교차 검증        |
| Authenticated EXECUTE      |   210 | advisor·정의 교차 검증        |
| Service role EXECUTE       |   592 | 전체 overload                 |

### 9.2 View security

| View                    | 옵션                    | SELECT 역할          |
| ----------------------- | ----------------------- | -------------------- |
| `casino_game_rtp_stats` | `security_invoker=true` | anon + authenticated |
| `v_game_bets_client`    | `security_invoker=true` | authenticated        |
| `v_game_rounds_public`  | `security_invoker=true` | anon + authenticated |
| `v_user_consent_latest` | `security_invoker=true` | authenticated        |

### 9.3 Migration·generated type parity

| 항목                       | 결과                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| Remote migration rows      | 231                                                                        |
| Distinct remote names      | 230                                                                        |
| Duplicate name             | `p1b_admin_ops_visibility` 1개 · remote version 2개                        |
| Local lock                 | 231 files · 같은 name multiset                                             |
| Timestamp                  | Management API remote timestamp와 local prefix는 다르지만 name parity 유지 |
| Public type drift          | 0                                                                          |
| Generated public tables    | 137                                                                        |
| Generated public views     | 4                                                                          |
| Generated public functions | 568                                                                        |
| Generated public enums     | 45                                                                         |
| Callable signatures        | 571                                                                        |
| Semantic drift             | 0                                                                          |

### 9.4 Frontend RPC contract

| 분모                           |      수치 | 판정                                                                  |
| ------------------------------ | --------: | --------------------------------------------------------------------- |
| Production call sites          |       198 | Web 122 · Admin 76                                                    |
| Distinct frontend-used `rpc_*` | 150 / 249 | 99 backend RPC는 frontend 미사용                                      |
| Missing RPC names              |         0 | live types와 이름 정합                                                |
| Literal argument mismatch      |         0 | dynamic arg site 11은 정적 증명 제한                                  |
| Untyped/type-lie casts         |        33 | `as never` 또는 다른 RPC 이름으로 강제 cast                           |
| Overloaded RPC                 |         3 | `rpc_place_game_bet` · `rpc_spot_market_buy` · `rpc_spot_market_sell` |
| Live type parity               | 754 names | 137 tables · 4 views · 568 functions · 45 enums                       |

#### RPC denominator 재현 근거

| 단계                        |                               수치 | 산출 근거                                                                      |
| --------------------------- | ---------------------------------: | ------------------------------------------------------------------------------ |
| Base production scan        |                     189 call sites | Web/Admin production TS/TSX · tests/wrapper definition 제외                    |
| Generic Casino correction   |                      +9 call sites | `use-game-pf-state` 3 · `use-progressive-round` 3 · `use-live-crash` 3         |
| Final call-site denominator |                                198 | Web 122 · Admin 76                                                             |
| Distinct denominator        |                                150 | Web 90 · Admin 61 · 교집합 1                                                   |
| Dynamic Args                |                                 11 | Web 6 · Admin 5                                                                |
| Dynamic Args 세부           |                    Web 6 · Admin 5 | repeatable 1 · trading 5 · Admin MFA/RBAC/support 5                            |
| Representative cast debt    |                           33 sites | `sportsRpc`/`casinoLiveRpc` · crypto whitelist · Admin Access/MFA/Team/Support |
| Schema comparison           | missing 0 · literal arg mismatch 0 | live generated public types와 semantic 비교                                    |

### 9.5 Advisor

| 분류             |  수 | 내용                                                                                     |
| ---------------- | --: | ---------------------------------------------------------------------------------------- |
| Security ERROR   |   0 | 차단 오류 없음                                                                           |
| Security WARN    | 225 | search_path 8 · anon definer 10 · authenticated definer 206 · leaked password 1          |
| Security INFO    |   3 | RLS enabled, policy 없음: `pg_webhook_replay` · `siwe_challenges` · `user_game_pf_state` |
| Performance WARN |  62 | `auth_rls_initplan` 26 · `multiple_permissive_policies` 36                               |
| Performance INFO | 191 | unindexed FK 24 · unused index 167                                                       |

### 9.6 실제 설치 extension

- `pgcrypto`
- `supabase_vault`
- `pg_stat_statements`
- `uuid-ossp`
- `pg_cron`
- `pg_net`
- `plpgsql`

목록 API가 반환한 “설치 가능” extension과 실제 `installed_version`을 분리해 집계했다.

---

## 10. 엔진 교차 검증

### 10.1 Frontend ↔ backend matrix

| 영역              | 판정                 | `STATIC + DB` 근거                                                                       |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| Wallet/Ledger     | GREEN                | PHON·USDT·KRW `Σ=0` · wallet/system hash broken 0 · latest reconciliation `ok`           |
| KRW → PHON        | GREEN                | request RPC는 credit 없음 · admin/webhook만 internal credit · helper client EXECUTE 없음 |
| Crypto deposit    | RED                  | provider 2/2 missing_config · 13k+ failures · address 0 · request 0                      |
| Giftcard          | RED                  | fee market 6개 전부 disabled                                                             |
| Withdrawal        | RED                  | `feature_withdrawal_enabled=false`                                                       |
| Trade market data | RED                  | breaker 33/42 halt · oracle 35/42 stale · provider 3 degraded                            |
| Sports            | RED                  | fixture 108 · outcome 337 · odds 337/337 stale · place/cashout browser gate off          |
| Casino 12         | GREEN / `UNVERIFIED` | enum·route·stage·RPC 정합 · bet data는 crash/dice 10건만 · click 미검증                  |
| Trading API keys  | GREEN / `UNVERIFIED` | list/create/revoke + RLS table 정합 · live row 0 · mutation 미실행                       |
| Support/Tier E10  | DEPLOY DRIFT         | RPC 존재·row 0 · current surface live · preview stub/404                                 |

### 10.2 Wallet·Ledger exact invariant

| 통화 |  User total | System total |        Σ |
| ---- | ----------: | -----------: | -------: |
| KRW  |           0 |     0.000000 | 0.000000 |
| PHON | 5550.000000 | -5550.000000 | 0.000000 |
| USDT |    0.000000 |     0.000000 | 0.000000 |

Source: DB aggregate `SELECT` · 2026-07-12. 사용자별 데이터는 포함하지 않았다.

### 10.3 Casino 12

- route · stage · enum · one-shot/E23 RPC 정합
- DB `game_code` enum 12/12 정합
- One-shot: `rpc_open_game_round` → `rpc_place_game_bet` → `rpc_reveal_game_round`
- E23 production-used RPC 9개:
  - `rpc_get_game_pf_state`
  - `rpc_set_game_client_seed`
  - `rpc_rotate_game_server_seed`
  - `rpc_progressive_start`
  - `rpc_progressive_step`
  - `rpc_progressive_cashout`
  - `rpc_live_crash_get_current`
  - `rpc_live_crash_place_bet`
  - `rpc_live_crash_cashout`
- Service-only:
  - `rpc_live_crash_advance`
  - `rpc_sweep_stale_progressive_sessions`
- Live bet data는 10건이며 crash/dice에서만 관찰됐다.
- `parity_hold` row는 0이다.
- 실제 click·bet 실행은 `UNVERIFIED`다.

### 10.4 Sports

- Fixture 108
- Outcome 337
- Outcome snapshot 보유 337
- 15분 초과 stale 337
- Newest snapshot: 2026-06-16
- Fresh outcome 0
- `feature_sports_enabled=true`
- Browser `LAUNCH_GATES.sportsBetting=false`
- Browser `LAUNCH_GATES.sportsCashout=false`
- `/sports/vip`는 `rpc_get_user_tier_summary`와 공용 fixture board를 사용한다.
- 전용 VIP market RPC는 없다.

### 10.5 Trading API keys

- `rpc_list_trading_api_keys`
- `rpc_create_trading_api_key`
- `rpc_revoke_trading_api_key`
- 함수와 table은 live DB에 존재한다.
- RLS own `SELECT`, direct client write 없음.
- Live key row 0.
- 실제 create/revoke mutation은 `UNVERIFIED`다.

### 10.6 Wallet rail 상태

| Rail                | 상태                                       |
| ------------------- | ------------------------------------------ |
| KRW deposit         | `feature_deposit_enabled=true`             |
| Withdrawal          | `feature_withdrawal_enabled=false`         |
| Crypto TRC20        | provider `missing_config`                  |
| Crypto ERC20        | provider `missing_config`                  |
| Crypto address      | 0                                          |
| Crypto request      | 0                                          |
| Giftcard fee market | 6 rows · enabled 0                         |
| KRW proof           | RPC live · Web caller 없음 · UI gate false |

### 10.7 24시간 ops 신호

| 신호              | 관찰                                                                                        | 판정                     |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| `edge_ops_events` | ops-notify 1,442 · price-feed/crypto-watcher/notification/usdt-krw 각각 1,440 · status `ok` | job 완료만 반영          |
| `provider_health` | degraded 3 · missing_config 2 · healthy 3                                                   | 실제 provider 상태       |
| API logs          | `rpc_submit_oracle_source_price` 400 반복                                                   | `market_halted`          |
| Postgres logs     | ERROR `market_halted` 반복                                                                  | circuit breaker와 일치   |
| Auth logs         | 관찰 sample 200 중심                                                                        | 신원·IP 마스킹           |
| Storage logs      | 반환 row 0                                                                                  | sample 범위 내 오류 없음 |
| Realtime logs     | idle shutdown/reconnect                                                                     | 일반 lifecycle           |

---

## 11. DB 결과 provenance

| 조회                      | 시각                 | 집계 결과                                                                                    |
| ------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Catalog snapshot          | 2026-07-12T11:41:52Z | table 137 · view 4 · column 1,425 · function overload 592 · policy 248                       |
| Migration `SELECT`        | 2026-07-12 audit     | remote row 231 · distinct name 230 · `p1b_admin_ops_visibility` 중복 1                       |
| Generated types           | 2026-07-12 audit     | 137 tables · 4 views · 568 functions · 45 enums · 571 callable signatures · semantic drift 0 |
| Integrity verifier        | 2026-07-12T11:49:36Z | reconciliation `ok` · wallet/system hash broken 0                                            |
| Conservation `SELECT`     | 2026-07-12 audit     | KRW·PHON·USDT `Σ=0.000000`                                                                   |
| Rate snapshot             | 2026-07-12T11:59:05Z | PHON/KRW 14.910000 · USDT/KRW 1491.000000                                                    |
| Market health `SELECT`    | 2026-07-12 audit     | breaker halt 33/42 · oracle stale 35/42                                                      |
| Sports freshness `SELECT` | 2026-07-12 audit     | outcome 337 · latest snapshot 337 · stale >15m 337                                           |
| Provider health `SELECT`  | 2026-07-12 audit     | healthy 3 · degraded 3 · missing_config 2 · max failures 13k+                                |
| Feature config `SELECT`   | 2026-07-12 audit     | deposit=true · sports=true · withdrawal=false · system_halt=false · system_readonly=false    |
| Scoped count `SELECT`     | 2026-07-12 audit     | crypto address 0 · crypto request 0 · API key 0 · giftcard enabled 0/6 · support/tier row 0  |
| Casino activity `SELECT`  | 2026-07-12 audit     | `game_bets` 10 · crash/dice만 관찰 · `parity_hold` 0                                         |
| Edge event aggregate      | 최근 24시간          | ops-notify 1,442 · 나머지 주요 job 각각 1,440 · status `ok`                                  |
| Service log sample        | 최근 24시간          | API/Postgres `market_halted` 반복 · Auth 200 중심 · Storage row 0 · Realtime idle lifecycle  |

---

## 12. 독립 검증 체크

아래 표는 Canvas 본문에 포함된 독립 검증 체크 원문이다.

| 검증 항목               | 결과                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Route denominator       | Web 84 · Admin 29 · redirect 별도 분리                                                                |
| Control cross-reference | route-group ledger + 필수 Home/Earn/Casino/VIP/Admin 행 연결                                          |
| RPC denominator         | 198 call site · 150 used · missing 0 · arg mismatch 0                                                 |
| Table denominator       | 137 table · 4 view · RLS 137/137                                                                      |
| Migration/type parity   | 231 rows · public type semantic drift 0                                                               |
| `UNVERIFIED` 사유       | Browser/Admin session/SS 원본 부재 명시                                                               |
| Plan mutation           | agent write 0 · 외부 plan pre/post hash가 없어 전체 세션 불변은 `UNVERIFIED`                          |
| Repository mutation     | agent가 감사 중 repo 파일을 편집하지 않았으나 시작 snapshot→첫 capture path drift 원인은 `UNVERIFIED` |
| 원본 감사 artifact      | Canvas 1개만 저장소 밖 managed canvases 경로에 생성                                                   |

### 12.1 Canvas 작성 후 외부 마감 검증

아래 항목은 Canvas 본문과 별도로 수행한 closeout 메타데이터다.

| 항목                    | 결과   |
| ----------------------- | ------ |
| Final readonly verifier | PASS   |
| Canvas TypeScript check | 오류 0 |

---

## 13. 후속 수정 시 유지할 판정 경계

1. `Critical`·`High`라고 해서 이 문서만으로 엔진 변경을 승인하지 않는다.
2. DB·RPC·RLS·GRANT 수정은 별도 operator 승인과 Supabase 안전 절차를 따른다.
3. 운영 flag가 꺼진 상태는 코드 결함으로 단정하지 않고 운영 의도를 먼저 확인한다.
4. `STATIC` 정합은 runtime 성공과 다르다.
5. Browser·Admin·스크린샷 원본 관련 항목은 실제 세션에서 재검증한다.
6. 합성 사회적 증거, 환율, 상태 표시는 검증된 데이터가 없으면 숨긴다.
7. 돈·잔액·보상·환율은 문자열 Decimal 경로와 서버 정본을 사용한다.
8. 수정 후에도 canonical route·surface를 확장하며 parallel 파일을 만들지 않는다.
