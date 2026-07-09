# Sports UX Canon

> **상태:** D1 narrative SSOT (2026-07-01 · Stake식 IA + bet365 정보계층)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Sports  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Sports  
> **Display contract:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) — Sports rows  
> **Data audit:** [`SPORTS_DATA_AUDIT.md`](SPORTS_DATA_AUDIT.md) · [`SPORT_CODE_IMPACT.md`](SPORT_CODE_IMPACT.md)  
> **Routes:** `/sports` · `/sports/prematch` · `/sports/live` · `/sports/my-bets` · `/sports/fixture/$fixtureId` · `/sports/rules` — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 · [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

## 목표 경험

종목(sport) → 리그(league) → 경기(fixture) **3단 탐색**으로 컨텍스트를 잡고, center에서 **배당 표 스캔**, 우측/하단 bet slip에서 **선택 · stake · risk · 베팅**까지 끊김 없이 처리한다. Live에서는 score · timer · status를 숨기지 않는다. 다크+민트 PHONARA 토큰 유지 — reference 제품의 로고·카피·색·고유 visual identity **복제 금지**.

## Reference

**Primary (IA):** Stake.com sportsbook — 종목 트리 · desktop 3-column · bet slip 상시 · fixture row 밀도  
**Secondary (정보계층):** bet365 — 리그 컨텍스트 · odds table scan · live header rhythm  
**부가:** DraftKings (mobile bottom sheet) · Pinnacle (suspended state clarity) · Flashscore (live score/timer prominence)

Pattern only — no proprietary branding clone.

---

## 재구축 전 해결 대상 (현재 3문제)

| #   | 문제                              | 현재 원인                                                                      | 목표                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| 1   | **종목 분류 없음**                | `league_code`만 평평 나열 (전체/월드컵/MLB/EPL/K리그) — 축구·야구 한 줄에 혼재 | sport → league → fixture 3단            |
| 2   | **데스크탑 레이아웃 텅 빔**       | fixture row가 화면폭 전부 점유 · 팀명↔배당 사이 giant gap · bet slip 화면 밖   | 3-column · dense row · slip rail always |
| 3   | **모바일 bet slip 튜토리얼 과잉** | 슬립 열면 plain-language/how-to가 viewport 절반 · stake·CTA 묻힘               | 슬립 열면 **베팅 UI 주인공** · ? 접기   |

---

## Canonical sportsbook surfaces

| Route                                                   | Role                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/sports`                                               | **Canonical** sportsbook home — full 3-column + sport tree                            |
| `/sports/prematch` · `/sports/live` · `/sports/my-bets` | Sports **subnav only** — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 |
| `/sports/fixture/$fixtureId`                            | Match detail · market groups · same slip contract                                     |

**도메인 격리:** Sports chrome은 `/sports/**` only — Trade layout embed · `/trade?section=sports` **금지** (legacy → redirect `/sports`). **lg+:** bet slip **right rail always mounted** (FAB-only 금지).

---

## 정보 계층 (3단)

| 단계    | 필드                                             | UI 역할                                        |
| ------- | ------------------------------------------------ | ---------------------------------------------- |
| L1 종목 | `sport_code` (football, baseball, basketball, …) | desktop left sport tree · mobile sport tab bar |
| L2 리그 | `league_code` (epl, mlb, k-league, …)            | 선택 종목 하위 league list/chips               |
| L3 경기 | fixture row + inline odds                        | center/main board scan                         |

**기타(other):** `sport_code` 미매핑·unknown fixture — **숨기지 않고** 별도 종목/버킷에 노출.

**PHONARA 글로벌 IA ≠ 스포츠 종목 트리:** BottomNav · HomeSideNav(홈·부업·트레이딩)와 **별개**의 sports-only navigation. 동일 컴포넌트·동일 데이터 소스 아님.

---

## Desktop layout canon (1024+)

| Zone   | ~%     | Content                                                                                                             |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Left   | 18–22% | **Sports sport tree** — ⚽축구 · ⚾야구 · 🏀농구 … **세로**. 종목 클릭 → 하위 리그 accordion. **항상 visible**      |
| Center | 55–62% | 선택 sport/league의 fixture list. **한 행 =** kickoff · league badge · home/away · inline 1x2 odds                  |
| Right  | 20–24% | **Bet slip rail always mounted** — selection · stake · est. return · place bet. empty = compact “배당을 선택하세요” |

**행 정렬 규칙 (non-waivable):**

- 팀명↔배당 사이 **flex-grow 빈 gutter 금지** — odds cluster는 행 **우측 고정** (max gap `--ds-*` token)
- fixture row가 viewport **전폭 단독 점유 금지** — center column grid bound
- lg+ standalone `/sports`: slip **rail only** — sheet/FAB-only desktop **금지**
- Live: score · timer · status · key stats — row/header에 inline

---

## Mobile layout canon (390px)

**Sticky stack (순서 고정):**

1. **종목 탭** — 가로 스크롤 (탭 줄 **내부만** scroll)
2. **리그 칩** — 선택 종목 하위
3. **featured / live / today / upcoming** — market-time tabs

**Main:** compact fixture list only.

**Bet slip — bottom sheet:**

| 우선순위           | Content                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| 1 (above fold)     | 선택 leg · stake input · primary place-bet CTA                                                 |
| 2                  | est. return · risk one-liner                                                                   |
| 3 (default hidden) | onboarding — **? icon** → sheet/dialog (`SurfacePlainLanguageStrip` full-width block **금지**) |

**가로 스크롤:** 페이지 root(`ds-sports-hub`) **`overflow-x: hidden` 0** — 종목 탭·리그 칩 줄만 내부 scroll.

---

## Required modules

Sport Tree (desktop left) · Sport Tab Bar (mobile) · League Navigation (under selected sport) · Match Rows (dense scan) · Odds Table (inline 1x2 minimum) · Market Group Filters · Live Score · Timer · Bet Slip Rail (desktop always) · Bet Slip Sheet (mobile) · Slip Empty State (compact) · Slip How-To (? collapsed only) · Selection Summary · Stake/Risk Confirmation · Empty/suspended market states · sportsBlocked/gate reason display

---

## Priority order

1. Sport/league context (3단 탐색)
2. Match/odds scan (dense center)
3. Selection + stake + place bet (slip 주인공)
4. Live status and statistics
5. History/secondary markets · collapsed help

---

## Display data

- odds/fixture prices via `SportsPageControllerView.hubProps` — **exposed**
- sportsBlocked/gate reason — **exposed**
- Server-trusted odds and settlement only — no client recompute

### 데이터 의존성 · 구현 순서 (non-waivable)

**구현 순서:** **`sport_code` engine work 먼저 → RPC `sport_code`가 포함된 fixture payload로 종목 트리 UI** — league 파생 매핑으로 UI를 먼저 그리지 않는다 (데이터 소스 교체 시 UI 재작업 · 미수록 종목 누락 방지).

| 항목                                           | 상태                                                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`sport_code` on `rpc_list_sports_fixtures`** | **없음** — engine migration 필요 ([`SPORT_CODE_IMPACT.md`](SPORT_CODE_IMPACT.md))                                                                          |
| **종목 트리 UI**                               | **`sport_code` RPC green 후** 착수                                                                                                                         |
| **league → sport 파생**                        | **`sport_code`가 정본**; 그 전까지의 fallback 개념만 존재 ([`SPORTS_DATA_AUDIT.md`](SPORTS_DATA_AUDIT.md) §1.3 `_sports_league_sport_code`) — UI SSOT 아님 |
| **리그 카탈로그 RPC**                          | 없음 — sport별 league 목록은 engine/catalog work                                                                                                           |
| **`world-cup` 등 매핑 갭**                     | engine 보강 전 **기타** 버킷 또는 RPC `sport_code`로 수신                                                                                                  |

---

## Forbidden

- 종목 없이 **평평한 `league_code` 나열**만 (현재 `SPORTS_LEAGUE_OPTIONS` 패턴)
- **`league_code` 파생 매핑으로 종목 트리 UI 선구현** — `sport_code` engine 선행 위반
- Desktop center **full-bleed row** + 팀명↔배당 **giant empty gutter**
- lg+ **slip off-screen** · FAB-only · rail 미마운트
- Mobile slip 열림 시 **tutorial/plain-language strip이 viewport 50%+**
- Mobile **페이지 본체 가로 스크롤**
- Odds hidden behind modal-only flow
- Desktop odds as card grid only (no scan table)
- Detached bet slip losing selections
- Ambiguous suspended/closed markets
- Client-side odds or payout recompute
- Emoji in betting/settlement copy
- `/trade?section=sports` · Trade layout sports embed · Bet hub tab pattern

---

## Completion signals

- [ ] sport → league → fixture **3단 탐색** (desktop tree + mobile tabs/chips) — **`sport_code` RPC 기반**
- [ ] lg+ 우측 slip **항상 mounted** (empty compact OK)
- [ ] mobile sheet: stake + CTA **above fold** without scrolling past tutorial
- [ ] page root **가로 스크롤 0** (chip/tab rows exempt)
- [ ] 미매핑 fixture **기타** 버킷 노출
- [ ] Major sportsbook scan density · server-trusted odds · sportsBlocked visible
- [ ] impl: `SportsHubPage` vitest + operator visual sign-off
