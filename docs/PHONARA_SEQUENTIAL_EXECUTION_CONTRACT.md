# PHONARA · 순차 실행 정본 (Sequential Execution Contract)

> **목적:** 모든 작업을 **기존 플랜 순서대로** · **안 한 것부터** · **세계 1위 개발팀 방식**으로만 진행.  
> **갱신:** 2026-06-21 · **operator: Lovable 플랫폼 종료 → Cursor 전담** · ACTIVE HEAD **C-3** L1-20/21 (Cursor presentation) · **C-1 ✅ 58/58** · **C-2 ✅ 개별 gate green** (통합 `check:full` defer) · Earn **광고시청·설문 미션 제거**  
> **상위:** [`PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md`](PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md)

---

## 0. 절대 규칙 (non-negotiable)

| # | 규칙 | FAIL |
|---|------|------|
| S1 | **큐 head 1건만** active — 앞 슬라이스 §GREEN 전 다음 **금지** | skip · 병렬 2슬라이스 |
| S2 | **Plan → APPROVE → EXECUTE → §GREEN** — 코드 먼저 **금지** | Plan 없이 구현 |
| S3 | **트랙 분리:** Lovable(L1) · paste(L2) · Engine(L3) — **게이트 건너뛰기 금지** | paste 전 Engine · ZIP 전 paste |
| S4 | **LOCK 1건 = scope 1건** — creep · “겸사겸사” **금지** | 한 EXECUTE에 2 LOCK |
| S5 | **정본 순서만** — operator 임의 재정렬 없이 큐 **아래→위** 진행 | Sportsbook Engine S1을 paste 전 |
| S6 | **NO-TOUCH 존중** — §GREEN·FROZEN·baseline 건드리지 않음 | P2 재EXECUTE · Crash md5 |
| S7 | **World Crush bar** — generic/MVP feel = REVISE | urgency/density 전무 |

**한 줄:** Stripe/Google급 팀처럼 **한 PR(슬라이스)씩 green main** — PHONARA는 **한 LOCK씩 §GREEN**.

### Cursor 전담 모드 (2026-06-19 · operator 확정)

| 이전 | 이후 |
|------|------|
| L1 = Lovable canvas EXECUTE | **L1 CLOSED** — 미구현 슬라이스(L1-20 K1 등) = **Cursor presentation** |
| Lovable 프롬프트 dispatch | **0** — LOCK 문서는 scope 참고만 |
| PHONARA repo L1 구현 금지 | **허용** — `presentation-import` · adapter · wiring only |

**제품 금지 (operator):** Earn에 **광고 시청·설문조사형 리워드** UI/RPC **0** (틱톡라이트류 제외 · 출석·미션·룰렛·추천·퀴즈 OK).

**Cursor 단일 큐 head (순서):**

```text
C-0 ✅ → C-1 ✅ 58/58 → C-2 ✅ (개별 gate · 통합 defer) → **C-3 HEAD** L1-20/21
→ C-4 wire sweep → C-5 L2-S/L2-A (GO) → C-6 L3 Engine (GO 각각)
```

### Cursor C-track (2026-06-19~)

| ID | scope | 상태 | evidence |
|----|-------|------|----------|
| C-0 | Wiring · Earn 정책 | ✅ | vitest green · 광고/설문 제거 |
| C-1 | L2 E2E | ✅ **58/58 skip 0** | F1 dice · F2 plinko · F3 `/terms` · `6840d0e` `7646133` |
| C-2 | `check:full` 하위 gate | ✅ **개별 green · 통합 1-shot defer** | standard check vitest **931** · migrations **133** · mirror **309** · guard **118/0 gaps** · sql **66/66** · casino-sql-parity · E2E **60/60** · `e800bd5` |
| C-3 | L1-20 K1 + L1-21 K3 | **HEAD** | LOCK draft → APPROVE → EXECUTE · archive §9 scope |
| C-4~C-6 | wire sweep · L2-S/L2-A · L3 | defer | C-3 §GREEN 후 |

> **§9 정본 위치 (2026-06-21):** 계약이 참조하는 `docs/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`는 active 경로에 없음. 유일 사본: [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9 (K1 황금 지구 · K3 생존 신고). **active 복원 여부 = operator 판단.** C-3 LOCK draft는 archive §9를 scope 근거로 작성 가능.

---

## 1. 세계 1위 팀 · 작업 방식 (Lovable / Cursor 공통)

```text
1. 큐 head 확인 (본 문서 §3)
2. LOCK/Plan draft — scope 1줄 · FAIL= · self-check rg block
3. Cursor(또는 operator) REVIEW → APPROVE / REVISE / REJECT
4. EXECUTE GO Step 0 — 담당 AI만 구현 (Lovable canvas vs PHONARA repo)
5. §GREEN report + evidence (vitest · catalog · rg)
6. APPROVE §GREEN → 큐 head +1 → 다음 LOCK plan--create
7. 게이트 도달 시 operator GO 1줄 (ZIP · paste · Engine Wave · 스포츠)
```

| 역할 | L1 Lovable | L2 Cursor paste | L3 Cursor Engine |
|------|------------|-----------------|----------------|
| 구현 | Lovable AI | Cursor | Cursor |
| Plan 검토 | Cursor · operator | operator | operator |
| §GREEN 검증 | Cursor · operator | operator | operator + SQL/E2E |

---

## 2. 3트랙 게이트 (순서 고정)

```text
[L1 · CLOSED · Cursor presentation]  ← Lovable canvas 종료 · C-3 HEAD L1-20/21
  … 큐 §3.1 L1-GP ✅ · paste Wave-1 ✅ · C-1/C-2 ✅ …
  → operator 「ZIP 발행 GO」 1회 (defer · Lovable 100% 판단 시)

[L2 · PHONARA paste]  ← Wave-1 ✅ · C-1/C-2 ✅
  operator 「PHONARA paste GO Wave-1」
  → Paste-0 → Crush P0–P7 → P1.x → P2 → adapters → E2E G9 → check:full

[L3 · Engine]  ← L2 GREEN 후만
  Wave-1 Crash (Wave-S3와 병렬 금지)
  → Wave-2 Partner → Wave-3 Earn
  → (operator 「스포츠 GO」+ LEGAL) Wave-S1→S5 → /sports wire
```

**Cursor (2026-06-19~):** L1 미구현 슬라이스 = **PHONARA presentation** · L2 paste/E2E · L3 Engine.  
**Lovable canvas:** **중단** — L2/L3 **항상 0**.

---

## 3. 마스터 큐 (번호 = 실행 순서)

### 3.1 L1 · Lovable — **지금 여기**

| # | 슬라이스 | 상태 | LOCK / 문서 |
|---|---------|------|-------------|
| L1-01 | 12-Z PRODUCT FINAL verify-only | ✅ §GREEN | — |
| L1-02 | 12-A v0.2 TournamentStrip · RecentlyPlayed | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_A_V02_LOCK.md`](LOVABLE_ZENITH_PHASE12_A_V02_LOCK.md) |
| L1-03 | 12-C FOMO/tier v0.3 | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_C_V03_LOCK.md`](LOVABLE_ZENITH_PHASE12_C_V03_LOCK.md) |
| L1-04 | 12-D Trade depth v0.2 | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_D_V02_LOCK.md`](LOVABLE_ZENITH_PHASE12_D_V02_LOCK.md) |
| L1-05 | Stage i18n (10 games) | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_STAGE_I18N_LOCK.md`](LOVABLE_ZENITH_PHASE12_STAGE_I18N_LOCK.md) |
| L1-06 | Pixi Plinko v2 | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_PLINKO_V2_LOCK.md`](LOVABLE_ZENITH_PHASE12_PLINKO_V2_LOCK.md) |
| L1-07 | Phase 7 viral v0.1 | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_VIRAL_V01_LOCK.md`](LOVABLE_ZENITH_PHASE12_VIRAL_V01_LOCK.md) |
| L1-08 | Sportsbook UI `/sports` mock + **V polish** | ✅ **§GREEN** | [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) · v0.2.1 + **L1-08-V** · canvas **1701** · sports **66** |
| L1-09 | Phase 6 polish | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_POLISH_V01_LOCK.md`](LOVABLE_ZENITH_PHASE12_POLISH_V01_LOCK.md) |
| L1-10 | Phase 10 carry | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_CARRY_V01_LOCK.md`](LOVABLE_ZENITH_PHASE12_CARRY_V01_LOCK.md) |
| L1-11 | Phase 11 form/a11y | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_FORM_A11Y_V01_LOCK.md`](LOVABLE_ZENITH_PHASE12_FORM_A11Y_V01_LOCK.md) |
| L1-12 | 12-G SEO leaf | ✅ §GREEN | [`LOVABLE_ZENITH_PHASE12_SEO_LEAF_V01_LOCK.md`](LOVABLE_ZENITH_PHASE12_SEO_LEAF_V01_LOCK.md) · JSON-LD 38 routes · og 24 · catalog **1521** Δ=0 |
| L1-13a | Signup polish (ImportedSignupPage · Cute KR) | ✅ §GREEN | GAP G-01 page · catalog **1536** (Δ=+21) |
| L1-13a.1 | Signup CTA wiring (shell nav hotfix) | ✅ §GREEN | 4 surfaces · +5 keys · catalog pre-slice **1550** (doc 1541 drift) |
| L1-13b | **`/tier` guide route** (ladder · perks · mock) | ✅ §GREEN | `tier.guide.*` **41** · catalog **1591** (Δ=+41) |
| L1-13b.1 | AccountSheet → `/tier` CTA (funnel hotfix) | ✅ §GREEN | MENU index 0 · **+2 keys** · catalog **1593** |
| L1-13c | PF verify deepen (`/casino/fairness`) | ✅ §GREEN | `casino.fairness.*` **20** |
| L1-13d | **`/account` polish** (img3 · toast-only chips) | ✅ §GREEN | account.* **+4** · catalog **1608** |
| L1-13e | **`/settings` Display polish** (img4 top) | ✅ §GREEN | `settings.display.*` **+5** · catalog **1622** |
| L1-13f | settings **알림** 4토글 (localStorage) | ✅ §GREEN | `settings.notifications.*` **+14** · catalog **1636** |
| L1-13g | settings **거래·정보** (img5) | ✅ §GREEN | `settings.trade.*` **+8** · catalog **1644** · **L1 settings 완료** |
| L1-14 | KYC/OAuth surface prep | **E defer** | paste/Engine gate |
| **GATE** | sports ZIP Wave-1 ✅ · **paste Wave-1 ✅** | **L1-10-W G4 대기** | Step 9b PASS · S8 §GREEN · operator 「ZIP 발행 GO」 · L1-14 E defer |

**지금 할 일:** Sports **GATE close ✅** (2026-06-16) → ZIP Wave-1 ✅ (92.4 KB · 32 files) → **「PHONARA paste GO Wave-1」**. ZIP 전 Lovable NO-TOUCH (sports · mocks · i18n 1701/66 · wallet 0).


#### 3.1.2 L1-10-W · Wallet UI (post-paste Wave-2 · **EXECUTE 0**)

> **정본:** [`LOVABLE_WALLET_UI_LOCK.md`](LOVABLE_WALLET_UI_LOCK.md)  
> **주의:** historical **L1-10 carry**와 ID 충돌 없음 — `L1-10-W` = Wallet slice 전용.

| # | 게이트 | 상태 |
|---|--------|------|
| G1 | L1-09-S Step 9b sports manual PASS | ⏳ HEAD 선행 |
| G2 | Lovable 100% sports + ZIP Wave-1 | ⏳ |
| G3 | PHONARA paste Wave-1 §GREEN | ✅ |
| G4 | operator 「L1-10-W EXECUTE GO」 | ⏳ |

| 슬라이스 | scope |
|---------|--------|
| W1 | `/wallet` hub — cash/bonus/locked + tx list |
| W2 | `/wallet/deposit` mock |
| W3 | `/wallet/withdraw` mock + KYC gate badge |

**FAIL =** G1–G3 전 EXECUTE · sports/i18n 회귀 · rpc wire


#### 3.1.3 L1-15-A · Admin Sports Desk (Lovable · **EXECUTE 0**)

> **정본:** [`LOVABLE_ADMIN_SPORTS_DESK_LOCK.md`](LOVABLE_ADMIN_SPORTS_DESK_LOCK.md) · [`PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md`](PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md)  
> **operator 정정 (2026-06-16):** 어드민 UI = **Lovable 플랫폼** — Cursor `apps/admin` 직접 UI 작성 **0**

| # | 게이트 | 상태 |
|---|--------|------|
| G1 | L1-10-W Wallet §GREEN | ⏳ |
| G2 | operator 「L1-15-A EXECUTE GO」 | ⏳ |
| G3 | L2-S hook wire §GREEN | ⏳ |

| 슬라이스 | scope |
|---------|--------|
| A0–A6 | Admin nav · unsettled · exposure · risk · kill-switch — **Lovable mock** → ZIP → `apps/admin` paste |

**FAIL =** Cursor admin UI 선구현 · Lovable admin ZIP 없이 paste · rpc invent


#### 3.1.4 L1-16~18 · World Crush Platform UI (user app · **PLAN · EXECUTE 0**)

> **정본:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)  
> **operator 감사 (2026-06-17):** 홈 난잡 · Trade Spot/Futures/Staking 미분리 · FOMO bar 미달 → **ZIP 전 필수**

| # | 슬라이스 | 상태 | LOCK (예정) |
|---|---------|------|-------------|
| L1-15-UX | Admin plain i18n | **✅ §GREEN** | [`LOVABLE_ADMIN_UX_PLAIN_LANGUAGE_LOCK.md`](LOVABLE_ADMIN_UX_PLAIN_LANGUAGE_LOCK.md) · vitest 525/529 · 2535/2535 |
| **L1-16** | Home IA · G-WC1 | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md) · vitest 529/533 · 2552 |
| **L1-16b** | Home density · WalletSnapshot · tier→VIP | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16B_HOME_DENSITY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16B_HOME_DENSITY_LOCK.md) · vitest **533/537** · catalog **2557** |
| **L1-16c** | Stake-lobby restructure · Earn-killer fold · G-WC1.5 | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md) · vitest **540/544** · catalog **2591** |
| **L1-16d** | CategoryRow poster cards · 16 assets | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16D_HOME_POSTER_CARDS_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16D_HOME_POSTER_CARDS_LOCK.md) · 16 posters · 6 new + 10 mapped |
| **L1-16e** | Nav overlap hotfix · SideNav slim | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md) · SideNav **6** · D∩E **0** |
| **L1-16f** | Casino game detail desktop · stake layout | **~~CANCELLED~~** | [`LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md) · **operator 2026-06-18 계획 제외** · EXECUTE **0** · L1-17 §GREEN 선행 완료로 blocked 조건 무효 |
| **L1-16g** | MobileGameFrame bet collapse + fullscreen | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16G_MOBILE_GAME_FRAME_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16G_MOBILE_GAME_FRAME_LOCK.md) · tests **3/3** · i18n **+4** |
| **L1-16h** | Game posters + live counts · `/games`+`/casino` seeds | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16H_GAMES_CATALOG_POSTERS_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16H_GAMES_CATALOG_POSTERS_LOCK.md) v0.2 · ~79k seeds · **4 NO-TOUCH carry** |
| **L1-16i** | Games QA sweep · auto-bet · crash timer · e2e | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16I_GAMES_QA_SWEEP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16I_GAMES_QA_SWEEP_LOCK.md) · vitest **572/572** · e2e specs **10/10** |
| **L1-16j** | Casino route dedup · `/casino` hub wire | **~~CANCELLED~~** | **superseded by L1-16l** (casino.games delete · ImportedCasinoPage wire assumed done) |
| **L1-16k** | Global sidebar · SideNav → HomeSideNav | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16K_GLOBAL_SIDEBAR_UNIFY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16K_GLOBAL_SIDEBAR_UNIFY_LOCK.md) · import 0 · 6-item global (→ **5** after 16l) |
| **L1-16l** | Dead code & dedup sweep · delete-only | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md) · vitest **572/572** · routes **−6** · orphans **−8** · sidebar **5** |
| **L1-16m** | Mines audit doc · Marquee · PF badge | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-16M_MINES_AUDIT_MARQUEE_PF_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16M_MINES_AUDIT_MARQUEE_PF_LOCK.md) · vitest **572/572** · HUD ×7 · PF meta footer |
| **L1-17** | Trade Spot \| Futures \| Staking · G-WC2 | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-17_TRADE_SPLIT_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-17_TRADE_SPLIT_LOCK.md) · vitest **577/577** (+5) · catalog **Δ=+26** |
| **L1-18** | FOMO motion V2 · platform rhythm | **✅ §GREEN** | [`LOVABLE_WORLD_CRUSH_L1-18_FOMO_MOTION_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-18_FOMO_MOTION_LOCK.md) · vitest **580/580** (+3) · catalog **Δ=0** |
| L1-19 | Shell density (optional) | **defer** | — |
| **L1-20** | K1 · 황금 지구 전국민 탭 (시그니처) | **C-3 HEAD · Cursor** | archive §9 · LOCK draft → APPROVE → EXECUTE · `L1-20_GOLDEN_EARTH_LOCK` |
| **L1-21** | K3 · 7시 생존 신고 + 친구 랭킹 | **C-3 · Cursor** | archive §9 · L1-20 §GREEN 후 · operator 확정 |
| **L1-22** | K2 · 홈 위젯 펫 | **defer** | §9 · PWA+/네이티브 |
| **L1-23** | K4 · 클립보드/스크린줍 (웹 축소안) | **defer** | §9 · privacy |
| **L1-10-W-T** | Wallet tone · navy+mint SOT rebind | **✅ §GREEN** | [`LOVABLE_WALLET_TONE_UNIFY_LOCK.md`](LOVABLE_WALLET_TONE_UNIFY_LOCK.md) · CSS-only · violet hex 0 · 580/580 carry |
| **L1-24** | Stake-equivalent typography · system-ui+Pretendard | **✅ §GREEN + Pass 1.1** | [`LOVABLE_WORLD_CRUSH_L1-24_STAKE_TYPOGRAPHY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-24_STAKE_TYPOGRAPHY_LOCK.md) · 586/586 · KO=2620 · D1 held |

**Earn Killer Missions 정본:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) **§9** — active `docs/` 경로 **없음** · [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9 only · operator 복원 판단 대기

**큐 순서 (1 head):** … → L1-24 ✅ → **L1-GP G#1–G#10 ✅ FINAL** → **C-3: L1-20** (K1 · HEAD) → **L1-21** (K3) → C-4~6 · **L1-16f 제외**

### Operator backlog (post-C-3)

- **Trade UI/UX 전면 재설계** (`/trade` · PC+모바일 · 장수 디자인) — **C-3 §GREEN 후** 착수
- 근거: operator 약속 2026-06-21 · 엔진·UI 정합·거래 안전 토대 완료 (`96c435a` `6f26219` `3d0d509` `82f625b` `6840d0e` `e800bd5`)

#### 3.1.5 L1-GP · Games Polish Sub-Queue (12 originals · operator priority parallel)

> **정본:** [`PHONARA_LOVABLE_GAMES_POLISH_MASTER.md`](PHONARA_LOVABLE_GAMES_POLISH_MASTER.md) · desktop `PHONARA-lovable-master-prompt.md` 흡수  
> **목표:** Stake 압살 · 렉 0 · 엔진 오차 0 · LAW 1–7 · 게임 1 pass = LOCK 1건

| # | Game | 상태 | LOCK |
|---|------|------|------|
| G#1 | crash | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md) · vitest **603/603** · §3.1 1280+390 · Stage withAlpha approved |
| **G#2** | **dice** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G2_DICE_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G2_DICE_LOCK.md) · vitest **608/608** · §3.1 1280+390 |
| **G#3** | **limbo** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G3_LIMBO_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G3_LIMBO_LOCK.md) · vitest **608/608** · §3.1 1280+390 · fast-ramp · §3.10 funded autobet **defer** |
| **G#4** | **hilo** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G4_HILO_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G4_HILO_LOCK.md) · vitest **611/611** · §3.2 outcome-leak · §3.1 not-applicable · §3.10 defer |
| **G#5** | **roulette** | **✅ §GREEN + W + C** | [`PHONARA_LOVABLE_GAMES_POLISH_G5_ROULETTE_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G5_ROULETTE_LOCK.md) · **G#5-C ✅** [`PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md) · §3.7 0/0/0 · GameDetailFrame sm→md |
| **G#6** | **mint_reels** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md) · vitest **618/618** · contract-gap FLAG · G6-S1 S1–S8 · §3.1 N/A · §3.10 defer |
| **G#7** | **gold_rush** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G7_GOLD_RUSH_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G7_GOLD_RUSH_LOCK.md) · vitest **621/621** · gold-premium distinct · contract-gap FLAG · §3.1 N/A · §3.10 defer |
| **G#8** | **blackjack** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G8_BLACKJACK_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G8_BLACKJACK_LOCK.md) · vitest **625/625** · 4-state banner · LOSS=0 · contract-gap FLAG · §3.1 N/A · §3.10 defer |
| **G#9** | **deepshaft** | **✅ §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G9_DEEPSHAFT_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G9_DEEPSHAFT_LOCK.md) · vitest **630/630** · LAW 4 FULL · greenfield · engine-vs-mock · AutoSlot 1280+390 · poster wired · §3.10 defer |
| **G#10** | **momentum** | **✅ FINAL §GREEN** | [`PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md) · G#10-W0.5 · G#10-R · G#10-FINAL · vitest **658/658** · LAW 4 roll-reveal · AutoSlot 2/5/10 · WC shots carry-defer |
| — | plinko · mines | ✅ signed-off | regression only |

**L1-GP:** **G#1–G#10 ✅ COMPLETE** (operator 「Lovable 100%」· ZIP GO는 별도) · vitest **658/658** · i18n **2712/2712 DIFF=0** · ZIP **defer**


#### 3.1.1 VIP tier · L1-13b vs L3-06 (operator 정본)

| 트랙 | 슬라이스 | 뭐 하는지 | 언제 |
|------|---------|-----------|------|
| **L1 · Lovable (기본)** | **L1-13b** | `/tier` **안내표 UI** · canvas `tier.*` 5이름 · `tier.guide.*` 목업 · JSON-LD | GATE 전 · **엔진 0** |
| **L3 · Engine (별도)** | **L3-06 VIP tier** | VIP ladder **schema + RPC** · XP/등급 read · (선택) perk snapshot | **L2 paste GREEN 후** · operator GO 필수 |

**한 줄:** L1-13b = **보이는 안내표** · L3-06 = **돈/진실 tier 엔진** — **같은 슬라이스 아님**.

| operator 의도 | 진행 |
|---------------|------|
| **기본 (권장)** | L1-13b 목업 안내표 → ZIP/GATE → paste(L2) → **원하면** L3-06 GO 후 `/tier`·`TierProgressPanel` wire |
| **엔진 먼저** | operator **「VIP tier Engine GO」** 1줄 → L3-06 Plan(DDL/RPC/conservation) **먼저** → UI 숫자는 RPC SOT에 맞춤 · **L1-13b scope 밖** |

**L3-06 범위 (GO 시 · Cursor):**

- VIP tier enum/table · user tier progress · `rpc_get_vip_tier_status` (가칭) read path
- **`profiles.kyc_tier`(본인인증) ≠ VIP casino tier** — 혼동 금지
- money/perk payout touch 시 migration + SQL conservation + advisor — standing autonomy이어도 **operator GO 없으면 착수 금지**
- L1-13b EXECUTE 중 L3-06 **병렬 금지** (L1 head §GREEN 후 L3 큐)

**FAIL =** L1-13b에서 Supabase/RPC invent · operator GO 없이 L3-06 착수 · kyc_tier를 VIP tier로 착각 매핑

---

| # | 작업 | 문서 |
|---|------|------|
| L2-01 | ZIP → presentation-import | `PRESENTATION_IMPORT.md` |
| L2-02 | Crush P0–P7 | `PHONARA_CURSOR_PASTE_CRUSH_LOCK.md` |
| L2-03 | Crush P1.1–P1.10 | `PHONARA_CURSOR_PASTE_CRUSH_P1_*` |
| L2-04 | Crush P2 Trade | `PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md` |
| L2-05 | Game adapters P2.0c | GAP §4 |
| L2-06 | i18n · og · PWA merge | handoff paste memo |
| L2-07 | E2E G9 · 41/41 | `QUALITY_GATES.md` |
| L2-08 | check:full green | — |
| **L2-S** | **/sports hook wire** | mock place 삭제 · `use-sports-betting` · sports E2E Σ=0 |
| **L2-A** | **Admin Sports Desk** | L1-15-A Lovable §GREEN → paste → **L2-A-W wire** · [`PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md`](PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md) |

### 3.3 L3 · Engine (L2 GREEN 후)

| # | Wave | 병렬 | 문서 |
|---|------|------|------|
| L3-01 | Wave-1 Crash live | **S3 금지** | `PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK` |
| L3-02 | Wave-2 Partner read | Wave-3과 순차 권장 | `LOVABLE_ZENITH_PHASE12_E_LOCK` |
| L3-03 | Wave-3 Earn status | after L3-02 | GAP §4 |
| L3-04 | Wave-S1→S5 Sportsbook | operator 스포츠 GO + LEGAL | `PHONARA_SPORTSBOOK_MASTER_PLAN` |
| L3-05 | /sports hook wire | after S3 + L1-08 UI | paste adapter |
| **L3-06** | **VIP tier schema/RPC** (XP · ladder read · perk snapshot) | **operator 「VIP tier Engine GO」** · after L2 GREEN 권장 | §3.1.1 · **L1-13b scope 밖** |


### 3.4 L2-A · Admin Sports Desk (Lovable UI → paste · Cursor wire only)

> **정본:** [`PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md`](PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md) · Lovable LOCK [`LOVABLE_ADMIN_SPORTS_DESK_LOCK.md`](LOVABLE_ADMIN_SPORTS_DESK_LOCK.md)

| 단계 | 트랙 | 소유 |
|------|------|------|
| **L1-15-A** | Admin UI mock + ZIP | **Lovable** |
| **paste Wave-Admin-1** | `apps/admin` 1:1 | **Cursor** adapter only |
| **L2-A-W** | `rpc_admin_*` hook wire | **Cursor** · UI 0 |

| # | 슬라이스 | 상태 | 비고 |
|---|---------|------|------|
| A-0 | nav + `/sports` stub | **PLAN** | Lovable A-0 |
| A-1 | `feature_sports_enabled` ops 토글 UI | **PLAN** | mock → wire |
| A-2 | 미정산 fixture 큐 | **PLAN** | read-only RPC |
| A-2b | 수동 score 입력 UI | **defer** | service_role only |
| A-3 | market suspend + audit | **PLAN** | 기존 RPC |
| A-4 | exposure dashboard | **PLAN** | read-only |
| A-5 | risk events + tier | **PLAN** | sports 전용 |
| A-6 | admin E2E + §GREEN | **PLAN** | paste 후 |

**착수:** L1-15-A Lovable §GREEN + **Admin paste GO** + L2-S §GREEN + operator 「Admin Sports Desk GO」(wire)  
**FAIL =** Cursor에서 admin UI 선작성 · Lovable 0 주장 · browser service_role · migration invent
---

## 4. 금지 패턴 (1위 팀이 하지 않는 것)

- 「일단 Sportsbook」「일단 paste」「일단 Engine Wave-1」— **큐 head 무시**
- Lovable 100% 전 ZIP · paste GO 전 `apps/web` presentation 대량 교체
- 두 슬라이스 동시 EXECUTE (같은 트랙)
- archive LOCK으로 EXECUTE
- §GREEN 없이 “완료” 주장 · ZIP KB in §GREEN without operator GO
- UI bar 낮추기: optional · GO해도 됨 · MVP feel accept

---

## 5. operator · AI 일일 체크 (30초)

```text
1. queue head 번호는? → 본 문서 §3.1 표
2. head §GREEN 됐나? → YES면 다음 LOCK plan--create · NO면 head만 EXECUTE
3. 어느 트랙? → L1=Lovable · L2=paste · L3=Engine
4. 게이트 필요? → ZIP / paste / Engine / 스포츠 — operator 한 줄 GO
5. 마스터 프롬프트 붙였나? → LOVABLE_AI_MASTER_PROMPT §1 또는 CURSOR_ENGINE §1
```

---

## 6. 변경 이력

| 날짜 | head | 내용 |
|------|------|------|
| 2026-06-16 | GATE | L1-13g §GREEN · L1 settings 완료 · catalog 1644 |
| 2026-06-16 | L1-13g | L1-13f §GREEN · notif 4-toggle · catalog 1636 |
| 2026-06-16 | L1-13d | L1-13c §GREEN · /account HEAD · Plan APPROVE |
| 2026-06-16 | L1-13c | L1-13b.1 §GREEN · PF verify HEAD |
| 2026-06-16 | L1-13b | L1-13a.1 §GREEN · `/tier` guide HEAD · Plan v0.2 APPROVE |
| 2026-06-16 | L1-13b/L3-06 | VIP tier L1 presentation vs L3 engine 분리 · operator GO 게이트 |
| 2026-06-16 | L1-13a.1 | L1-13a §GREEN · shell signup CTA hotfix · catalog 1536→1541 |
| 2026-06-16 | L1-13a | L1-12 SEO §GREEN · JSON-LD 38 · og 24 · catalog 1521 Δ=0 · Signup polish next |
| 2026-06-16 | GAP audit | Canvas 62 routes · ZIP GO NO · L1-13a/b/c queued |
| 2026-06-16 | L1-12 | L1-11 form/a11y §GREEN · catalog 1512 · SEO leaf next |
| 2026-06-16 | L1-11 | L1-10 carry §GREEN · catalog 1512 · form/a11y next |
| 2026-06-16 | L1-10 | L1-09 polish §GREEN · catalog 1502 · Phase 10 carry next |
| 2026-06-16 | L1-09 | operator L1-08 defer · Phase 6 polish HEAD |
| 2026-06-16 | L1-07 | L1-06 Plinko §GREEN · catalog 1492 · Phase 7 viral next |
| 2026-06-16 | L1-05 | L1-04 12-D v0.2 §GREEN · catalog 1478 · OrderBookDepthPanel · Stage i18n next |
| 2026-06-16 | L1-04 | L1-03 12-C v0.3 §GREEN · catalog 1470 · Trade depth next |
| 2026-06-16 | L1-03 | L1-02 12-A v0.2 §GREEN · catalog 1459 · tier v0.3 next |
| 2026-06-16 | L1-02 | 초판 · 12-Z §GREEN · TournamentStrip next |
| 2026-06-17 | **L1-24 Pass 1.1** | §GREEN · D2 test lock · KO=2620 EN=2620 · D1 held · **L1-20 HEAD** |
| 2026-06-17 | **L1-18** | §GREEN · FOMO motion dedup · vitest 580/580 · **G-WC3 ✅ · G-ZIP gate** |
| 2026-06-17 | **Earn K1~K4** | §9 backlog — L1-20~23 PLAN · World Crush UI plan |
| 2026-06-17 | **L1-17** | §GREEN · TradeModeShell Spot\|Futures\|Staking · vitest 577/577 (+5) · catalog Δ=+26 · **G-WC2 ✅ · L1-18 HEAD** |
| 2026-06-17 | **L1-16l** | §GREEN · sidebar 5 · routes −6 · orphans −8 · vitest 572/572 · **L1-17 HEAD** |
| 2026-06-17 | **L1-16l** | Dead code sweep HEAD · L1-16j cancelled · L1-17 blocked |
| 2026-06-17 | **L1-16g** | MobileGameFrame §GREEN · collapse+fs · 3/3 tests |
| 2026-06-17 | **L1-16d** | Poster cards §GREEN · 6 new + 10 mapped |
| 2026-06-17 | **L1-16d** | Poster cards HEAD · L1-17 re-blocked · 16 assets |
| 2026-06-17 | **L1-17** | L1-16c §GREEN · **re-blocked by 16d** |
| 2026-06-17 | **L1-16c** | Stake-lobby §GREEN · sidebar+EarnPowerRow · overflow-x 0 · G-WC1.5 |
| 2026-06-17 | L1-16c | Stake-lobby restructure HEAD · L1-17 blocked · operator visual amend |
| 2026-06-17 | **L1-17** | L1-16b §GREEN · vitest 533/537 · catalog 2557 · **re-blocked by 16c** |
| 2026-06-17 | **L1-16b** | Home density §GREEN · WalletSnapshot · tier→rank/vip · hideAssets |
| 2026-06-17 | L1-16 | G-WC1 · vitest 529/533 · catalog 2552 |
| 2026-06-17 | L1-15-UX | World Crush L1-16~18 PLAN 등록 · ZIP 전 G-WC 게이트 |
| 2026-06-19 | **C-0** | Cursor 전담 · Lovable canvas 종료 · Earn 광고/설문 제거 |
| 2026-06-21 | **C-1** | L2 E2E **58/58 skip 0** · F1/F2/F3 · `6840d0e` `7646133` |
| 2026-06-21 | **C-2** | 개별 gate green (vitest 931 · migrations 133 · E2E 60/60 등) · 통합 `check:full` defer · `e800bd5` |
| 2026-06-21 | **C-3 HEAD** | L1-20 K1 + L1-21 K3 · Cursor LOCK draft pending · trade UI redesign backlog |

---

*operator 정본 · 순서 변경 시 본 파일 + INTEGRATED_ROADMAP §4·§5 + [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) (또는 archive §9) 동시 갱신*
