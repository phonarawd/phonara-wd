# PHONARA · World Class 통합 로드맵 (operator 정본)

> **목적:** 「이미 한 것 · 업그레이드 · 앞으로 할 것」을 **한 문서**에 통합. Stake · Rollbit · Binance · Bybit · 한국 앱테크 · TikTok Lite급 **체감 bar** 기준.  
> **갱신:** 2026-06-16 · Lovable canvas 실측 · P2-Games 10/10 · §A §GREEN · preview §GREEN · 12-Z 다음  
> **상위:** [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) · [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md)  
> **진행판:** [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md) · [`CURRENT_STATUS.md`](CURRENT_STATUS.md) · [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md)

---

## 0. North Star (1줄)

**Earn-first → Casino → Wallet → Trade-last** funnel 위에, **엔진 Σ=0(이미 GREEN)** + **Stake급 casino UX** + **Binance급 trade grammar** + **토스/TikTok급 Earn 미션** + **Stake agent급 partner**를 **한 ops(1인 99% 자동화)** 로 운영.

---

## 1. 3층 아키텍처 (절대 혼동 금지)

> **순차 실행 정본:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) — **큐 head 1건만** · 안 한 것부터 · Plan→§GREEN.

| 층 | 위치 | 지금 | ZIP/paste |
|----|------|------|-----------|
| **L1 · Presentation** | Lovable canvas | 슬라이스 §GREEN 누적 중 | operator **100% + ZIP GO** 후 1회 ZIP |
| **L2 · Integration** | PHONARA `apps/web` paste + adapter | placeholder 다수 | operator **paste GO Wave-1** 후 |
| **L3 · Engine** | `packages/*` `supabase/*` | ENGINE 100 · migration 098 | paste **후** Wave별 LOCK |

**금지:** L1만 끝났다고 ZIP · L2 없이 엔진 UI invent · clone 코드 merge

---

## 2. 지금 Lovable canvas — DONE 스냅샷 (2026-06-16)

| ID | 항목 | 상태 | 실측 |
|----|------|------|------|
| L-D01 | P2-Games Controls 10종 | **§GREEN** | wrapper leak 0 · named compose 10/10 |
| L-D02 | §A Theme 12-H v0.1 | **§GREEN** | styles.css hex 0 · oklch · html.dark |
| L-D03 | §B Home Bento 12-F.2 | **§GREEN** | BentoCell + HomeHub teasers |
| L-D04 | §Y FOMO Full Mount | **§GREEN** | FomoFullSection · fomo testid ≥7 |
| L-D05 | 12-A Casino Hub | **§GREEN** | hub + 10 game routes |
| L-D06 | 12-G SEO scope B | **§GREEN 부분** | head ≥10 routes · leaf 전수 별건 |
| L-D07 | 12-B Missions 6-lane | **§GREEN** (Phase 12) | mock/preview |
| L-D08 | 12-C Home scaffold | **§GREEN** | FOMO/tier → v0.3 defer |
| L-D09 | 12-D Trade scaffold | **§GREEN** | depth/FOMO → v0.2 defer |
| L-D10 | 12-E Partner/Referral | **§GREEN UI** | **mock** · Wave-2 wire defer |
| L-D11 | 11-B/C PWA/SEO base | **§GREEN** | paste merge defer |
| L-D12 | preview blackjack test | **§GREEN** | vitest 82/2 files · 384/4 |
| L-D16 | 12-C FOMO/tier v0.3 | **§GREEN** | catalog 1470 · F8 |
| L-D13 | i18n catalog | **§GREEN** | KO=EN=**1470** |
| L-D14 | 12-Z PRODUCT FINAL | **§GREEN** | verify-only |
| L-D15 | 12-A v0.2 TournamentStrip · RecentlyPlayed | **§GREEN** | testid 4/4 |

**PHONARA repo:** `apps/web` 게임·presentation = **placeholder** (paste 전).

---

## 3. DONE → World Class **업그레이드** 매트릭스 (빠짐없이)

> **벤치:** Stake · Rollbit · Binance · Bybit · 토스 · 캐시워크 · TikTok Lite  
> **담당:** L=Lovable · P=PHONARA paste/Cursor · E=Engine

### 3.1 Casino · P2-Games (L-D01)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-C01 | Controls P1–P3 §GREEN | Stake betting window · chip row · auto tab grammar | per-game **motion polish** · sound settings panel | L |
| U-C02 | Crash auto-bet 5s only | Rollbit live crash FOMO | **mid-cashout live** · server timestamp | **E Wave-1** |
| U-C03 | Crash replay UI | Stake flying curve | global room WS · anti-cheat | E defer |
| U-C04 | PF 10-game engine GREEN | Stake fairness page | **verify UI** · seed history · client recompute display | L + P |
| U-C05 | Stage 한국어 literal | i18n strict | **Stage i18n** 슬라이스 (게임별) | L |
| U-C06 | Plinko Pixi v2 | Rollbit physics feel | **§GREEN** L1-06 | L done |
| U-C07 | auto.wiring jsdom 2 fail | vitest green | MutationObserver mock baseline 문서화 · 선택 fix | L |
| U-C08 | 10 games paste contract | P2.0c adapter 6+ui3 | **dice/limbo/hilo/… adapt-* clone** | P paste |
| U-C09 | — | TournamentStrip · RecentlyPlayed | **12-A v0.2** | L **다음 defer 1** |
| U-C10 | — | Live wins · jackpot ticker | presentation FOMO OK · **real aggregate feed** optional | L mock → E defer |

### 3.2 Home · Earn · FOMO (L-D03/L-D04/L-D07/L-D08)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-E01 | FomoFullSection mock | Rollbit urgency density | **첫 3초** hero · countdown · limited slots | L 12-C v0.3 |
| U-E02 | 6-lane missions UI | 토스 미션 · TikTok streak | **tier progression §E v35** | L |
| U-E03 | Missions mock | 토스 포인트 즉시성 | **Wave-3** `rpc_get_mission_status` wire | E→P |
| U-E04 | viral defer | TikTok referral pyramid | **§GREEN** L1-07 v0.1 | L done |
| U-E05 | Earn-first funnel | TikTok Lite watch-to-earn | daily/growth/viral/**season** lane read surface | L+E |
| U-E06 | Home Bento | Stake home hub density | Bento **motion** · live participant counts | L |
| U-E07 | — | 캐시워크 만보기 | step/mission **presentation** (engine 없이 string props OK) | L defer |

### 3.3 Trade (L-D09)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-T01 | TradeHub scaffold | Binance spot terminal | **12-D v0.2 depth** · OB panel · tabular nums | L |
| U-T02 | synthetic book RPC | Binance CLOB 착각 방지 | UI **display-only** label · no fake matching | L+P |
| U-T03 | spot/futures MVP engine | Bybit perps grammar | position panel · TP/SL UX · funding display | L+P |
| U-T04 | trade/* 9 carry files | i18n complete | Phase 10 defer **13 files** paste wire | P |
| U-T05 | — | Real CLOB | **영구 defer** | — |

### 3.4 Partner · Referral (L-D10)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-P01 | `/partner` mock UI | Stake agent portal | tier · depth-2 tree · commission 3-state | L done |
| U-P02 | affiliate schema O | live dashboard | **Wave-2** read RPC 3종 | E |
| U-P03 | settlements admin | agent self-serve | `affiliate_settlements.state` enum map paste | P |

### 3.5 Theme · Shell · SEO · PWA (L-D02/L-D06/L-D11)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-S01 | oklch SOT v0.1 | Binance design tokens | `@theme` PHONARA merge · dark-only → optional toggle defer | P |
| U-S02 | SEO partial | Stake meta + Binance trust | **45 leaf** full audit · og:image **absolute URL** | L→P |
| U-S03 | PWA 11-C | Stake install funnel | `PwaShell` merge · manifest shortcuts · SW `sw.ts` | P |
| U-S04 | shell components | Rollbit nav density | SideNav · ⌘K · mobile apex (Crush P1.4–P1.8) | P paste |
| U-S05 | scrim/cva/toast defer | polish | **§GREEN** L1-09 | L done |

### 3.6 Engine (이미 GREEN — **체감** 업그레이드만)

| # | 현재 | World Class bar | 업그레이드 | 담당 |
|---|------|-----------------|-----------|------|
| U-EN01 | Σ=0 · PF 10 games | Stake provably fair | 유지 · **touch only via LOCK** | E |
| U-EN02 | Crash snapshot settle | Rollbit live | **Wave-1** rpc_crash_cashout | E |
| U-EN03 | crypto 097 · viral 098 | — | 유지 | — |
| U-EN04 | spot p95 local | Binance HFT | observability · p95 prod re-measure | E defer |
| U-EN05 | G9 E2E FAIL | launch gate | paste + testid wire | P |

---

## 4. NOT DONE — 앞으로 할 일 (전체 백로그)

### 4.1 Lovable 즉시 큐 (operator GO 순)

```text
① ~~12-Z PRODUCT FINAL verify-only~~ ✅ §GREEN
② ~~TournamentStrip~~ ✅ §GREEN
③ ~~12-C FOMO/tier v0.3~~ ✅ §GREEN
④ ~~12-D Trade depth v0.2~~ ✅ §GREEN
⑤ ~~Stage i18n (10 games)~~ ✅ §GREEN · catalog **1492**
⑥ ~~Pixi Plinko v2~~ ✅ §GREEN
⑦ ~~Phase 7 viral v0.1~~ ✅ §GREEN · catalog **1502**
⑧ ~~Sportsbook UI~~ ⏸ **DEFER** (operator L1-08 defer)
⑨ ~~Phase 6 polish~~ ✅ §GREEN
⑩ ~~Phase 10 carry~~ ✅ §GREEN · catalog **1512**
⑪ ~~Phase 11 form/a11y~~ ✅ §GREEN · catalog **1512**
⑫ SEO leaf  ← 지금
⑬ Signup polish (L1-13a)
⑭ /tier guide (L1-13b) · operator flagged · **presentation/mock**
⑭-b VIP tier engine (L3-06) · **operator 「VIP tier Engine GO」** · L1-13b scope 밖
⑮ PF verify (L1-13c opt)
GATE ZIP GO (audit: L1-12+13a+13b 후 operator 판단)
```

### 4.2 PHONARA paste + Crush (operator paste GO 후)

| Wave | 문서 | 내용 |
|------|------|------|
| **Paste-0** | `PRESENTATION_IMPORT.md` | ZIP → presentation-import · games/* · i18n merge |
| **P0–P7** | `PHONARA_CURSOR_PASTE_CRUSH_LOCK.md` | BootSplash · shell · route · og absolute |
| **P1.1–P1.10** | `PHONARA_CURSOR_PASTE_CRUSH_P1_*` | Casino alive · GameDetailFrame · ⌘K · SideNav · BetPanel |
| **P2** | `PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md` | Trade crush |
| **Route dedup** | `PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md` | ✅ GREEN |
| **Adapter** | GAP §4 P1 | mapGameSurfaceProps · derive-ui-bet · 9 games adapt |
| **E2E G9** | `QUALITY_GATES.md` | placeholder → testid · 41/41 restore |

### 4.3 Engine Wave (paste 후 · LOCK GO 각각)

| Wave | 목표 | 문서 | 병렬 |
|------|------|------|------|
| **Wave-1** | Crash live + manual cashout | `PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK` | **Wave-S3 금지** |
| **Wave-2** | Partner read RPC | `LOVABLE_ZENITH_PHASE12_E_LOCK` | 독립 가능 |
| **Wave-3** | Earn 6-lane status read | GAP §4 | 독립 가능 |
| **L3-06 / Wave-6** | **VIP tier schema/RPC** (XP · ladder read) | §3.1.1 sequential contract | **operator 「VIP tier Engine GO」** · L1-13b scope 밖 |
| **Wave-S1~S5** | Sportsbook engine | `PHONARA_SPORTSBOOK_MASTER_PLAN` | 「스포츠 GO」+ LEGAL |
| **Wave-S UI** | `/sports` Lovable | `LOVABLE_SPORTSBOOK_UI_LOCK` | S3 전 mock |

### 4.4 Admin · Ops · Launch

| # | 항목 | 상태 |
|---|------|------|
| A-01 | Admin 1-person 99% automation | engine GREEN · UI paste defer |
| A-02 | prod authenticated smoke | blocked (auth.users=2) |
| A-03 | ops loop / incident drill | RUNBOOK exists |
| A-04 | observability SDK | defer `OBSERVABILITY_PRIVACY.md` |
| A-05 | affiliate browser E2E | SQL/admin pattern only |
| A-06 | locale toggle E2E | defer |

### 4.5 Legal · Vendor (Sportsbook 전)

| # | 문서 | 시점 |
|---|------|------|
| L-01 | `PHONARA_SPORTSBOOK_LEGAL_GATE.md` | S1 migration 전 |
| L-02 | `PHONARA_SPORTSBOOK_VENDOR_DECISION.md` | S2 ingest 전 |
| L-03 | `LEGAL_BASIS.md` re-review triggers | vertical 추가 시 |

---

## 5. 실행 순서 (operator 단일 타임라인)

> **번호·head 실시간:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3

```text
[Lovable L1 — 지금]
  12-Z verify → defer slices (TournamentStrip → tier → trade depth → Stage i18n → Sportsbook UI mock)
  → operator Lovable 100% 판단
  → 「ZIP 발행 GO」 1회

[PHONARA L2 — paste GO 1회]
  ZIP paste → i18n/og/PWA merge
  → Crush P0–P7 + P1.x + P2
  → game adapters P2.0c clone
  → E2E G9 GREEN
  → check:full green

[Engine L3 — paste 후]
  Wave-1 Crash live (RED-first SQL)
  → Wave-2 Partner read
  → Wave-3 Earn status
  → (operator 「스포츠 GO」) Wave-S1→S5
  → Wave-S UI paste + hook wire

[영구 defer]
  Real CLOB · global crash room · observability SDK · full Binance matching
```

---

## 6. World Class 참고 링크 (visual / pattern only)

> 상세: [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) §7 · Sportsbook: [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §7

| 축 | Tier A 참고 |
|----|-------------|
| Casino | tanh1c/stake-originals-clone · dscnsec/Stake-frontend-clone · hades255/reflow-bc-game-next-frontend · gamba-labs/platform |
| Crash UX | samott/crash · KaniCasino |
| Trade | tradingview/lightweight-charts · cokepoppy/my-binance · jose-donato/crypto-orderbook · brlocky/trading-app-bybit |
| Partner | rtavytran/rt-commission-dashboard |
| Sportsbook UI | richiekaroki/solami-sportsbook-landing · OpenBet Core demo |
| Earn UX (리서치) | 토스 게이미피케이션 case study · 캐시워크 UX 분석 · TikTok gamification 2025 |

**merge 금지:** MERN clones · Ant Design import · Tier E full platform copy

---

## 7. §GREEN / ZIP / paste 게이트

| 게이트 | 조건 |
|--------|------|
| **Slice §GREEN** | Plan APPROVE · EXECUTE · self-check · FAIL contract |
| **12-Z §GREEN** | 매크로 9행 + defer 5행 NOT GREEN 명시 · vitest 82/2 baseline |
| **Lovable 100%** | operator 판단 · defer/Sportsbook 의도적 잔여 OK |
| **ZIP GO** | operator 「ZIP 발행 GO」명시 1회 |
| **paste GO** | ZIP 수령 + operator 「PHONARA paste GO Wave-1」 |
| **Engine LOCK GO** | paste 후 · db reset · SQL conservation · advisor 0 ERROR |

---

## 8. 문서 정본 인덱스 (중복 방지)

| 읽을 때 | 파일 |
|---------|------|
| **순차 실행 정본 (큐 head)** | `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` |
| **통합 백로그 (본 문서)** | `PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md` |
| **Lovable AI 끝판왕 프롬프트** | `LOVABLE_AI_MASTER_PROMPT.md` |
| **Cursor Engine mandate** | `CURSOR_ENGINE_MASTER_PROMPT.md` |
| Lovable 진행판 | `PHONARA_LOVABLE_P2_GAMES_HANDOFF.md` |
| 목차 | `LOVABLE_ZENITH_INDEX.md` |
| 엔진 vs UI 갭 | `PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md` |
| 스포츠북 | `PHONARA_SPORTSBOOK_MASTER_PLAN.md` |
| paste Crush | `PHONARA_CURSOR_PASTE_CRUSH_LOCK.md` |
| 엔진 대시보드 | `CURRENT_STATUS.md` |
| 비전 | `PHONARA_NORTH_STAR_PLAN.md` |

**archive/** · legacy 9 stub = EXECUTE 금지

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — DONE/UPGRADE/NOT DONE 통합 · Lovable 실측 반영 · operator ZIP 100% 워크플로 |

---

*operator 정본 · 「빠짐없이」 통합 백로그 · 구현은 슬라이스 LOCK 1건씩*
