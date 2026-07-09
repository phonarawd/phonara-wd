# Casino UX Canon (D1.5)

> **상태:** D1.5 complete (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Casino  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Casino  
> **Display contract:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) · Auto Bet §  
> **Engine boundary:** [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) · Safe legacy wiring rule  
> **Routes:** [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md) · [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 — `/casino` · `/casino/*` · `/games/*` only

## 목표 경험

world-class gaming platform — **premium · fast · clear · trustworthy**. 게임 발견 → play loop → rebet/auto bet이 **끊김 없이** 이어지고, provably fair · balance · session state가 **항상 surface**에 있다. indie crypto casino · generic admin-dashboard 느낌 **금지**.

**Reference (pattern only):** Stake · BC.Game · Roobet · Shuffle — branding · copy · artwork clone **금지**.

---

## Mission — presentation layer 전면 교체

카지노 **presentation layer만** zero-base로 재설계한다. 목표는 “기존 게임 화면을 버려라”가 아니라 **기존 카지노 UX 사고방식 자체를 버리고, engine 위 presentation layer를 새로 설계**하는 것이다.

| 구분                                                                                | 정책                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| redesign / refactor / visual refresh                                                | **아님** — **complete replacement**                     |
| engine · settlement · RPC · hooks · controllers · money · provably fair · websocket | **frozen** ([`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)) |
| legacy layout · HUD · auto bet UX · navigation · animation · interaction flow       | **reference 아님** — rebuild 대상                       |
| wiring 있는 component                                                               | wiring **보존** · presentation만 rebuild                |

U-phase 구현은 **기존 route/surface 자리에서 in-place 교체** — parallel hub · parallel game surface **금지** ([`PRESENTATION_REBUILD_SCOPE.md`](PRESENTATION_REBUILD_SCOPE.md)).

---

## Legacy presentation policy (non-waivable)

아래 **전부 obsolete**로 간주한다. U-phase에서 **보존·미세 조정·“이미 있으니 유지” 주장 금지**.

- visual hierarchy · page layout · betting layout · navigation · component hierarchy
- HUD placement · modal structure · auto-bet UX · animations · interaction flow
- mobile layout · desktop layout

**유일 보존:** engine integration (controller hook · RPC call · Pixi/canvas wiring · settlement truth path).

**Safe wiring rule** ([`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) §Safe legacy component rule):

1. legacy component에 engine wiring 또는 shared logic 포함 → **wiring 보존**, presentation만 rebuild
2. 그 외 → in-place replace
3. reuse 필수 시 → [`DECISION_LOG.md`](DECISION_LOG.md)에 **exact wiring reason** 기록

---

## Product vision · UX quality target

- indie crypto casino 느낌 **금지** — world-class gaming platform
- premium quality · speed · clarity · trust · professional polish · smooth interaction
- placeholder · developer layout · generic admin-dashboard appearance **금지**
- every screen **intentionally designed** — title 없이도 “지금 어떤 게임인지” instant recognition
- reference: interaction pattern · layout philosophy · information hierarchy · betting workflow · motion language · accessibility · mobile ergonomics **만** — proprietary identity 복제 **금지**

---

## Lobby layout canon

**Routes:** `/casino` (lobby) · `/casino/fairness` · `/casino/tournaments` · `/games/$gameCode`

**도메인 격리:** Casino chrome은 `/casino` · `/games/**` only — Trade layout embed · `/trade?section=casino` **금지** (legacy → redirect `/casino`).

### Desktop

| Zone           | Content                                                               |
| -------------- | --------------------------------------------------------------------- |
| Top            | category nav · balance · provably fair entry · network/session status |
| Main           | featured · recent · category grid                                     |
| Side (in-game) | fairness · rules · live stats · session summary                       |

### Mobile

| Zone           | Content                          |
| -------------- | -------------------------------- |
| Top            | balance · game/category selector |
| Main           | stage or discovery grid          |
| Sticky bottom  | bet controls · manual/auto tabs  |
| Secondary tabs | fairness · history · rules       |

**Priority order:** playable game → bet + balance → result/history → fairness → discovery

**Required lobby modules:** Category Nav · Game Grid · Balance · Provably Fair entry · Recent/Featured

---

## Auto Bet first-class (non-waivable)

Auto Bet은 **부가 기능이 아니다**. experienced user의 대부분 시간을 Auto Bet으로 보낸다고 가정하고, **Manual Bet과 동등한 polish**를 요구한다.

### 금지

- optional popup / modal-only auto bet
- auto tab bury · running session 중 manual 전환으로 state 숨김
- session stats를 ledger/RPC로 drive (client queue가 settlement 대체 **금지**)

### 필수 visible (running 중 포함)

| Field                                        | Source                               | Contract          |
| -------------------------------------------- | ------------------------------------ | ----------------- |
| Running state (active / stopping / paused)   | `useAutoBetQueue`                    | **ui-only-local** |
| Remaining cycles                             | `useAutoBetQueue.remaining`          | **ui-only-local** |
| Stop conditions (profit target · loss limit) | `AutoBetConfig`                      | **ui-only-local** |
| Session profit                               | `useAutoBetQueue.cumulativeProfit`   | **ui-only-local** |
| Fires placed                                 | `useAutoBetQueue.firesPlaced`        | **ui-only-local** |
| Pause / resume                               | panel control                        | presentation      |
| Emergency stop                               | panel control — settle 후 stop       | presentation      |
| Available balance                            | `CasinoPageControllerView.available` | **exposed**       |
| Pipeline fire action                         | `CasinoPageControllerView.autoBet()` | **exposed**       |

**Boundary:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) §Auto Bet explicit boundary — payout/balance **재계산 금지**.

### UX contract (all 12 games)

- **Entry:** Manual / Auto **동등 tab** — `BetModeTabs` 패턴 또는 동등 UX (modal-only **금지**)
- **Panel:** dedicated `AutoBetPanel` owner — count · stopOnProfit · stopOnLoss · onWin/onLoss stake adjust · start/stop
- **Safety:** unbounded session **금지** — `count > 0` OR `stopOnLoss > 0` 없으면 start refuse
- **Lock:** auto active 중 mode switch lock · stake edit lock (settle truth: `bet` reference)
- **Desktop:** operator-grade dense controls · keyboard-friendly where applicable
- **Mobile:** thumb-safe · one-handed · sticky panel or bottom sheet — **not** desktop shrink
- **Per-game slot:** game-specific auto params (`autoSlot` / typed slot) — Crash countdown · Mines tile guard · Roulette bet selection 등

### Copy tone

[`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) Casino zone — minimal · state-focused · excitement without spam.

---

## Trust layer (always surface)

중요 금융·공정성 정보 **숨김 금지**. overlay/modal-only bury **금지**.

| Signal                               | When                           | Source                          |
| ------------------------------------ | ------------------------------ | ------------------------------- |
| Provably Fair (hash · seed · verify) | in-game + `/casino/fairness`   | controller + PF recompute UI    |
| RTP (where applicable)               | rules/fairness panel           | engine/RPC display              |
| Current Balance                      | always                         | `available`                     |
| Bet Amount                           | pre-bet + active round         | controller                      |
| Profit/Loss (session + last result)  | post-settle                    | controller + auto queue display |
| Network Status                       | disconnect/reconnect           | connection indicator            |
| Session State                        | round open · settling · halted | controller + platform gate      |
| Auto Bet Status                      | when auto tab or active        | `useAutoBetQueue`               |

Kill switch · RG limit · feature halt → **actionable banner** ([`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)).

---

## Motion · performance

- animation은 **state change 설명**용만 — decoration **금지**
- 60fps target · reduced motion respect (`prefers-reduced-motion`)
- betting blocked by animation **금지** — outcome must remain readable during motion
- win: satisfying · restrained · lose: calm · respectful
- flash spam · visual overload · excessive popups · intrusive promos **금지**

Casino canvas: rotation/transform may disable; **outcome text/icon must remain visible** ([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)).

---

## Mobile first-class

- simplified desktop **아님** — **게임별 dedicated mobile UX**
- thumb-safe · one-handed · fast repeat bet · minimal scroll · no tiny controls
- landscape layout — beneficial games (Plinko · Mint Reels · Gold Rush · Momentum)에서 **허용·권장**
- 3-tier responsive: 390 · 768 (`md:`) · 1024 (`lg:`) — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)

---

## Every game is unique (non-waivable)

**generic one-layout-fits-all 금지.** Crash ≠ Roulette ≠ Slots ≠ Blackjack — title 없이 instant recognition.

각 게임 **필수 산출물:**

- dedicated desktop layout · dedicated mobile layout
- game-specific HUD · betting flow · animation language
- auto bet workflow (typed slot + safety guards)
- history/statistics · onboarding hint · loading · empty · error states

**Canonical routes:** `/casino/<game-slug>` — [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)

| #   | Game       | Route                | Primary UX focus                                |
| --- | ---------- | -------------------- | ----------------------------------------------- |
| 1   | Crash      | `/casino/crash`      | live multiplier · graph-first · lightning rebet |
| 2   | Limbo      | `/casino/limbo`      | target multiplier · instant iteration           |
| 3   | Dice       | `/casino/dice`       | probability · payout visualization              |
| 4   | Mines      | `/casino/mines`      | large grid · risk progression                   |
| 5   | Hi-Lo      | `/casino/hilo`       | card visibility · decision confidence           |
| 6   | Plinko     | `/casino/plinko`     | physics stage dominates · intuitive controls    |
| 7   | Mint Reels | `/casino/mint-reels` | modern slot cabinet · spin flow                 |
| 8   | Gold Rush  | `/casino/gold-rush`  | reward anticipation · bonus progression         |
| 9   | Roulette   | `/casino/roulette`   | table clarity · chip management · rapid repeat  |
| 10  | Blackjack  | `/casino/blackjack`  | clean table · decisive actions                  |
| 11  | Deepshaft  | `/casino/deepshaft`  | progressive descent · depth · risk feedback     |
| 12  | Momentum   | `/casino/momentum`   | high-tempo · combo · multiplier emphasis        |

---

## Game-specific UX canon

### 1. Crash

**Feel:** live tension · graph is hero · cash-out decision under time pressure.

| Tier    | Layout                                                                                    |
| ------- | ----------------------------------------------------------------------------------------- |
| Desktop | full-width multiplier graph · side/bottom bet panel · live history strip · fairness chip  |
| Mobile  | graph top 55%+ · sticky bet controls · one-tap rebet · auto tab with crash countdown slot |

**Betting flow:** stake → (optional auto cash-out target) → bet → live multiplier → manual cash-out or bust → instant rebet CTA.

**Auto bet:** inter-fire delay visible (`countdownSlot`) · auto cash-out target in typed slot · graph **must not block** bet/cash-out controls.

**Animation:** multiplier line + crash burst explain state only · reduced motion = numeric outcome primary.

**Forbidden:** graph-as-decoration without live data · hiding current multiplier during round.

---

### 2. Limbo

**Feel:** target multiplier dial · instant bet → instant result loop.

| Tier    | Layout                                                                           |
| ------- | -------------------------------------------------------------------------------- |
| Desktop | large target multiplier control center · payout preview · compact history        |
| Mobile  | target slider/picker thumb-first · single primary bet CTA · result flash minimal |

**Betting flow:** set target multiplier → stake → bet → immediate outcome → adjust target + rebet.

**Auto bet:** target multiplier locked or adjustable per config in slot · fast iteration — animation must not gate next fire.

**Forbidden:** hiding win chance / payout preview · dice-like generic layout reuse.

---

### 3. Dice

**Feel:** probability math visible · roll outcome secondary to understanding odds.

| Tier    | Layout                                                            |
| ------- | ----------------------------------------------------------------- |
| Desktop | probability bar/slider + payout table · roll animation contained  |
| Mobile  | stacked probability control · large roll result · thumb bet panel |

**Betting flow:** set win chance / threshold → stake → roll → outcome + P/L → repeat.

**Auto bet:** preserve threshold in auto slot · show expected payout from RPC display only.

**Forbidden:** client-side odds recompute · generic “number picker” without probability visualization.

---

### 4. Mines

**Feel:** spatial risk · each reveal changes tension · cash-out is a decision.

| Tier    | Layout                                                               |
| ------- | -------------------------------------------------------------------- |
| Desktop | large tile grid center · mine count + multiplier progression sidebar |
| Mobile  | full-width grid · bottom cash-out + reveal stats · minimal scroll    |

**Betting flow:** stake + mine count → start → reveal tiles OR cash out → settle.

**Auto bet:** `startDisabledReason` until valid prep (mine count / first state) · auto must not reveal tiles without explicit auto strategy slot (future: document in Decision Log if added).

**Forbidden:** tiny grid on mobile · hiding current multiplier at cash-out decision.

---

### 5. Hi-Lo

**Feel:** card-forward · higher/lower confidence · streak readable.

| Tier    | Layout                                                 |
| ------- | ------------------------------------------------------ |
| Desktop | current + history cards large · HI/LO actions flanking |
| Mobile  | single card focus · thumb HI/LO buttons · streak chip  |

**Betting flow:** stake → start round → HI or LO → chain or cash out.

**Auto bet:** typed slot for auto HI/LO policy if supported · card state always visible during auto.

**Forbidden:** obscured current card · blackjack table layout reuse.

---

### 6. Plinko

**Feel:** physics stage dominates · drop anticipation · result path readable.

| Tier    | Layout                                                                 |
| ------- | ---------------------------------------------------------------------- |
| Desktop | Pixi/canvas stage 60%+ width · risk rows + peg count controls adjacent |
| Mobile  | stage top · landscape **권장** · controls bottom sticky                |

**Betting flow:** configure rows/risk → stake → drop → watch path → payout.

**Auto bet:** fire delay respects physics settle · stage visible during auto — never cover canvas with modal.

**Forbidden:** shrinking stage below 50% mobile height · blocking drop with overlay promo.

**Engine note:** Pixi wiring protected — JSX/CSS rebuild only ([`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)).

---

### 7. Mint Reels

**Feel:** modern slot cabinet · spin rhythm · line wins scannable.

| Tier    | Layout                                                              |
| ------- | ------------------------------------------------------------------- |
| Desktop | reel window center · paylines/info side · spin + auto spin adjacent |
| Mobile  | cabinet metaphor · large spin button · landscape optional           |

**Betting flow:** stake + lines → spin → win presentation → rebet/spin again.

**Auto bet:** `SlotLinesAutoSlot` pattern — lines/stake lock rules visible · spin state blocks duplicate fire.

**Forbidden:** generic crash HUD reuse · hiding line count or stake during spin.

---

### 8. Gold Rush

**Feel:** bonus anticipation · progression meter · reward tease without false promise.

| Tier    | Layout                                                   |
| ------- | -------------------------------------------------------- |
| Desktop | feature meter + reel/stage · bonus entry clearly labeled |
| Mobile  | progression top · stage middle · spin/bet sticky         |

**Betting flow:** base spin → feature collect → bonus round entry → return to base.

**Auto bet:** bonus state must pause or show “finishing feature” in auto panel · no silent queue during bonus.

**Forbidden:** guaranteed-profit copy · exaggerated bonus claims ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)).

---

### 9. Roulette

**Feel:** table clarity · chip denomination · rapid repeat on same bet.

| Tier    | Layout                                                            |
| ------- | ----------------------------------------------------------------- |
| Desktop | table layout readable · chip rack · bet map + recent numbers      |
| Mobile  | simplified table OR scroll-snap sectors · chip selector thumb row |

**Betting flow:** select chips → place on table → spin → result highlight → repeat last bet one-tap.

**Auto bet:** `RouletteAutoSlot` — bet map selection required before start · repeat pattern visible.

**Forbidden:** unreadable mobile table · hiding total stake on table.

---

### 10. Blackjack

**Feel:** clean felt · dealer vs player · decisive hit/stand/double/split.

| Tier    | Layout                                                             |
| ------- | ------------------------------------------------------------------ |
| Desktop | table center · action bar below hand · rules/fairness side         |
| Mobile  | hands stacked · large action buttons · no cramped multi-button row |

**Betting flow:** stake → deal → player actions → settle → rebet.

**Auto bet:** basic strategy auto slot if offered · **never** hide dealer up-card.

**Forbidden:** poker-style layout · action buttons below fold on mobile.

---

### 11. Deepshaft

**Feel:** descent depth · escalating risk · cash-out vs dig tension.

| Tier    | Layout                                                         |
| ------- | -------------------------------------------------------------- |
| Desktop | vertical shaft visualization · depth meter · multiplier ladder |
| Mobile  | shaft scroll/visual dominant · dig/cash-out thumb split        |

**Betting flow:** stake → dig level by level OR cash out → depth tied multiplier.

**Auto bet:** confirm i18n for destructive actions · depth state visible during auto.

**Forbidden:** flat generic grid reuse (Mines) without depth metaphor.

---

### 12. Momentum

**Feel:** high tempo · combo chain · multiplier stack emphasis.

| Tier    | Layout                                                          |
| ------- | --------------------------------------------------------------- |
| Desktop | fast reel/stage · combo meter prominent · rapid spin affordance |
| Mobile  | tempo-first · combo visible without scroll · landscape optional |

**Betting flow:** stake → spin → combo build → break/reset → immediate next spin.

**Auto bet:** `MomentumAutoSlot` · combo state shown in auto panel · fast fire delay tuned to animation settle.

**Forbidden:** slow ceremonial animation blocking rapid repeat · hiding combo multiplier.

---

## Cross-game forbidden (summary)

- generic one-layout-fits-all · auto bet modal-only · hiding fairness/balance/P/L
- client-side payout/balance/odds recompute · settlement/RPC changes for UX
- overstated win language · flash spam · intrusive promos
- parallel `/games/*` hub rebuild without Consolidation decision ([`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md))
- engine/Pixi wiring change for presentation convenience

---

## U-phase closeout signals (per game + lobby)

- [ ] Dedicated desktop + mobile layout — generic template reuse **0**
- [ ] Auto Bet first-class — required fields visible · modal-only **0**
- [ ] Trust layer always surface — contract fields wired or decision logged
- [ ] Motion explains state · betting not blocked · reduced motion OK
- [ ] Loading · empty · error · success states
- [ ] Controller/hook/RPC signature unchanged · Pixi wiring unchanged
- [ ] `gate:ai-impl -- --test <game-owner-vitest-path>` green
- [ ] Operator E2E: relevant `casino.spec` / game smoke (CI/operator)

Lobby closeout: fast play loop · fairness visible · category discovery · engine untouched.

---

## Verification (D1.5 done)

- [x] 본 문서 — mission · legacy policy · safe wiring · product vision
- [x] Auto Bet first-class — visible fields · contract boundary · UX rules
- [x] Trust layer · motion · mobile · delight · lobby layout canon
- [x] 12 games — route · layout · betting · auto · animation · forbidden (each unique)
- [x] Cross-game forbidden · U-phase closeout signals
- [x] [`DECISION_LOG.md`](DECISION_LOG.md) Decision 011
- [x] D1.5 narrative complete · Phase R queue — [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) (구 rebuild/NEXT_STEP.md는 2026-07-04 삭제)

**Next phase:** U5 casino/game 착수 전 [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Casino + 본 canon **동시** 충족 필수 (D2 `[x]` 2026-06-30).
