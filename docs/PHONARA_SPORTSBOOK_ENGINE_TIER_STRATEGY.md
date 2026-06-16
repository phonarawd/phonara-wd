# PHONARA 스포츠북 — Bet365/1xBet급 엔진 우선 · 수익 후 스케일 전략

> **operator 결정 (2026-06-16):** **엔진만** Bet365/1xBet **월드클래스 money·정산·리스크 bar**로 먼저 완성 → **수익 발생 후** 리그·피드·UI·마켓 **폭** 확장  
> **분업 유지:** Phase A = **Cursor 엔진 only** · Lovable `/sports` · premium feed · 30+ 리그 = **Phase B (수익 게이트)**  
> **상위:** [`PHONARA_SPORTSBOOK_INSTALL_STATUS.md`](PHONARA_SPORTSBOOK_INSTALL_STATUS.md) · [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md)

---

## 0. 한 줄

| 구분 | 내용 |
|------|------|
| **Phase A (지금)** | Bet365/1xBet과 **동급 엔진 코어** — 마켓 타입·정산·live·cashout·SGP·리스크·admin desk **기계 전부** |
| **Phase B (수익 후)** | **커버리지·비용** — 30+ 리그 WS · Betradar UOF · esports depth · Lovable UI polish · affiliate GGR |

**FAIL =** Phase A에서 “리그 2개만”을 **엔진 완성**으로 주장 · Tier E clone merge · browser vendor key

---

## 1. “Bet365/1xBet급 엔진”의 정의 (UI·리그 수 ≠ 엔진)

메이저 북의 **공개 OSS 엔진은 없음**. PHONARA가 맞출 bar는 **돈·정산·리스크 기계**:

| 계층 | Bet365/1xBet급 엔진에 포함 | Phase B (수익 후) |
|------|---------------------------|-------------------|
| **Money** | lock · idempotency · Σ=0 · exposure · liability | 한도 상향 · 통화 추가 |
| **Place** | prematch + live · stale · odds exact · combo/SGP/system | — |
| **Markets** | 1X2 · spread · Asian HC · multi totals · BTTS · period · **props framework** | props **카탈로그 폭** |
| **Settle** | FT · push · void · dead heat · partial void · score feed | — |
| **Live** | status · suspend window · goal/card · in-play TTL | **경기 수** scale |
| **Cashout** | full/partial · liability recompute | — |
| **Risk** | anti-arb · hedge · tier · device/IP (S13–14 ✅) | ML sharp (optional) |
| **Ingest** | C1 normalizer · multi-vendor · WS contract · **확장 가능 schema** | premium vendor · 30+ league |
| **Admin** | void queue · manual suspend · exposure RPC · audit | trading desk UI |
| **UI** | READ RPC + hooks (wire-ready) | Lovable `/sports` full |

**엔진 완성 ≠ 경기 500개 live.**  
**엔진 완성 = 어떤 마켓/leg 타입이 ingest되어도 place/settle/cashout이 틀리지 않음.**

---

## 2. 이미 GREEN (Phase A 기반 · 재작업 금지)

Wave **S1–S14** — schema · ingest C1 · place/settle · RG · OU2.5 · parlay≤8 · in-play status · 3-vendor failover · WS orchestrator · anti-arb · multi-account.

→ **뼈대 40%**. 마켓 2종 · cashout/SGP/props settle · system bet **미완**.

---

## 3. Phase A — Cursor 엔진 Wave (수익 게이트 **없음** · LEGAL+「스포츠 GO」만)

**상태 (2026-06-16):** **S15–S22 로컬 GREEN** · migration `20260616000110` · `20260616000111` · SQL `sportsbook_world_markets_test.sql`

순서 고정. UI/Lovable **병렬 0** (hooks·READ RPC만 유지).

| Wave | LOCK (예정) | 산출 | Bet365/1xBet 대응 |
|------|-------------|------|-------------------|
| **S15** | `PHONARA_ENGINE_WAVE_S15_MARKETS_LOCK.md` | `market_type` registry · spread · asian_hc · totals_* · BTTS · settle 분기 · SQL conservation | B2 마켓 기계 |
| **S16** | S16 in-play hardening | live place 규칙 · sport별 TTL · suspend matrix · score→settle 자동 | B6 live engine |
| **S17** | S17 cashout | `rpc_cashout_sports_bet` · partial · liability · idempotency | B5 cashout |
| **S18** | S18 SGP / Bet Builder | same-fixture correlated legs · 가격 검증 · settle | B6 Bet Builder |
| **S19** | S19 system bet | banker · permutations · 1xBet형 system | B4 system |
| **S20** | S20 props framework | player/team prop types · stat settle hook · void rules | props **엔진** (카탈로그는 B) |
| **S21** | S21 void/push/dead-heat | unified rules · admin override · audit | dispute bar |
| **S22** | S22 admin trading RPC | market suspend · fixture void · exposure list · risk events | ops desk data |

**Phase A §GREEN bar (엔진):**

- 모든 `market_type` place + settle SQL conservation **GREEN**
- cashout + SGP conservation SQL **GREEN**
- in-play stale/suspend E2E (RPC-level) **GREEN**
- `supabase db reset` · security advisor 0 ERROR
- unit + sportsbook SQL 15+ → **25+** (wave별 추가)
- **금지:** Lovable UI · 30+ league live WS를 Phase A 완료 조건에 넣기

**Phase A ingest (최소):**

- 검증용 리그 **EPL + K리그** (또는 operator 지정 2~3) — **엔진 테스트용**
- normalizer가 S15+ 마켓 타입 **전부** upsert 가능해야 함

---

## 4. Phase B — 수익 후 스케일 (Revenue Gate)

**트리거 (operator 서면 1줄 + 예산):** 「스포츠 스케일 GO」 또는 월 GGR/MAU 임계 도달

| ID | 항목 | 비고 |
|----|------|------|
| B1 | **Premium feed** — Betradar UOF / Oddsmarket enterprise | [`PHONARA_SPORTSBOOK_VENDOR_DECISION.md`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md) V3 |
| B2 | **30+ 리그** live WS fanout · orchestrator scale | env matrix · quota |
| B3 | **종목 확장** — esports · tennis · MMA · table tennis … | ingest slug만 추가 (엔진 S15–20 전제) |
| B4 | **Props 카탈로그** — 경기당 50~200 마켓 | vendor depth · **엔진은 S20** |
| B5 | **Lovable** `/sports` Stake/Bet365 IA · paste · hook wire | [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) 상향 |
| B6 | 스포츠 affiliate GGR | Wave-2 partner read 이후 |
| B7 | ML sharp · cross-book signal | optional |

**FAIL =** 수익 전 Betradar 계약을 Phase A 완료 조건으로 적기

---

## 5. operator · LEGAL (Phase A 착수 전)

Phase A도 **remote migration**은 기존 게이트:

- [ ] API 키 (검증용 1 vendor 이상)
- [ ] [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) clearance
- [ ] **「스포츠 GO」** 1줄

로컬 `supabase db reset` + SQL GREEN은 **GO 없이** Cursor가 S15 LOCK부터 진행 가능 (remote apply만 보류).

---

## 6. 문서 · LOCK 갱신 규칙

| 문서 | 변경 |
|------|------|
| 본 문서 | Phase A/B **단일 정본** |
| [`PHONARA_SPORTSBOOK_ENGINE_STANDARD.md`](PHONARA_SPORTSBOOK_ENGINE_STANDARD.md) | §4 market_type · §6 defer → S15–22 참조 |
| [`PHONARA_SPORTSBOOK_DEFERRED_TODO.md`](PHONARA_SPORTSBOOK_DEFERRED_TODO.md) | §6 장기 defer → **Phase B로 이동** 표기 |
| [`PHONARA_SPORTSBOOK_INSTALL_STATUS.md`](PHONARA_SPORTSBOOK_INSTALL_STATUS.md) | Phase A 진행률 |

---

## 7. self-check

```bash
rg "PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY" docs/
rg "2026061600010[0-9]" supabase/migrations | wc -l   # S1–S14 baseline
test ! -f docs/PHONARA_ENGINE_WAVE_S15_MARKETS_LOCK.md || echo "S15 LOCK exists"
rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md
```

**FAIL =** Phase B 항목을 Phase A §GREEN에 혼입 · Tier E sportsbook clone import
