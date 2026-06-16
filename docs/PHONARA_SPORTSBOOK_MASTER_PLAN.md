# PHONARA 스포츠북(토토) 마스터 플랜 — 기획 정본

> **단계:** **기획 planning only** — migration · RPC · UI wire · vendor 계약 **0**  
> **목표:** Bet365/국내 토토형 **체감**에 맞춘 스포츠 베팅 **엔진·피드·정산** 설계 정본 (Stake/Rollbit 카지노 축과 **분리**)  
> **갱신:** 2026-06-16  
> **분업 (non-negotiable):** **엔진 = Cursor(PHONARA repo)** · **UI/UX = Lovable canvas** → paste 후 Cursor adapter만  
> **하위 정본:** [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) (Wave-S · 참고 레포 Tier A~F · S1~S5 상세)  
> **상위 연결:** [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) · [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md) · [`LEGAL_BASIS.md`](LEGAL_BASIS.md) · [`CURRENT_STATUS.md`](CURRENT_STATUS.md)

---

## 0. 한 줄 요약

| 질문 | 답 (지금 상태 기준) |
|------|---------------------|
| 지금 스포츠북 엔진 있나? | **없음** (migration 098까지 **카지노·지갑·Earn**만) |
| 지금 뭘 할 수 있나? | **플랜·LOCK 초안·vendor 후보·아키텍처만** |
| 언제 코드? | **12-Z paste GO** + Wave-1~3 안정 + operator **「스포츠 GO」** + **LEGAL re-review** 후 |
| “세계 1위 1레포”? | **없음** — Tier 선별은 하위 Wave-S §2 |
| 정석 순서? | **엔진 first (Cursor)** · **UI/UX (Lovable)** · hook wire = Cursor paste adapter |
| 엔진 어디서? | **Cursor only** — `supabase/` · ingest worker · `features/sports/use-*.ts` |
| UI/UX 어디서? | **Lovable only** — `/sports` · BetSlip · i18n catalog · mock→paste |

---

## 0.1 Cursor ↔ Lovable 분업 (non-negotiable)

| 구분 | **Cursor (PHONARA repo)** | **Lovable (canvas)** |
|------|---------------------------|----------------------|
| **담당** | Wave-S **엔진 전부** | 스포츠북 **UI/UX 전부** |
| **포함** | migration · RPC · RLS · ingest worker · conservation SQL · security advisor · `use-*` hook · paste adapter · E2E wire | `/sports` IA · layout · motion · BetSlip UX · `sports.*` i18n · mock display props |
| **금지** | `/sports` 화면 **신규 디자인·레이아웃 창작** · presentation 토큰 임의 변경 | `supabase/*` · migration · RPC · ingest · wallet/ledger · engine package |
| **순서** | S1→S5 GREEN 먼저 (「스포츠 GO」+ LEGAL) | S3 전 mock OK · **S3 GREEN 후** paste GO · mock place **0** |
| **paste** | operator paste GO → **adapter + hook wire only** (시각 1:1 유지) | 12-Z 계열 paste 산출물이 **UI 정본** |

```text
[Lovable]  /sports UI/UX · BetSlip · i18n (mock until S3)
     ↓ paste GO (UI only)
[Cursor]   adapter · route wrap · use-place-sports-bet hook wire
     ↑
[Cursor]   Wave-S1~S5 engine (Lovable과 병렬 가능 — 단 supabase DDL은 GO gate)
```

**FAIL =** Lovable에서 migration/RPC 작성 · Cursor에서 `/sports` UI를 Lovable 없이 새로 그림 · paste 전 supabase sports DDL

---

## 1. 현재 PHONARA 스냅샷 (2026-06-16 · 기획 전제)

### 1.1 이미 GREEN — **재사용만** (재구현 금지)

| 축 | 상태 | 스포츠북 연결 |
|----|------|---------------|
| 원장 · Σ=0 · idempotency | migration ~098 · SQL green | `rpc_place_sports_bet` / settle **동일 패턴** |
| 지갑 lock/credit · PHON | wallet RPC green | stake · payout legs |
| 입금/출금 · crypto 097 | green | 베팅 자금원 |
| RG · kill switch · 073 | green | place hook **카지노와 동급** |
| Admin · audit · exception | green | void/settle 수동 큐 |
| 카지노 PF 10종 | green | **스포츠와 RPC/테이블 분리** |
| Earn · viral 098 · referral | green | 스포츠 GGR 커미션은 **Wave-2 이후 defer** |
| Affiliate schema | 백엔드 O · read RPC gap | Wave-2 후 스포츠 커미션 확장 검토 |

### 1.2 진행 중 — **스포츠와 충돌 주의**

| 축 | 상태 | 스포츠북 영향 |
|----|------|---------------|
| Lovable 12-Z paste | 진행 | paste 전 **supabase 0-touch** |
| G9 E2E | FAIL (testid) | paste wire · 스포츠 E2E **별도 spec** |
| Wave-1 Crash live | LOCK 대기 | **Wave-S3와 migration 병렬 금지** |
| Wave-2 Partner read | LOCK 대기 | 스포츠 전 **선행 권장 아님** (독립 가능) |

### 1.3 없음 — **Wave-S 전부**

- `sports_*` 테이블 · fixture/market/outcome  
- odds ingest · live WS fanout  
- `rpc_place_sports_bet` · settle/void  
- 스포츠 E2E · conservation SQL  

---

## 2. “지존급” 정의 (본 프로젝트 기준 · 과장 금지)

Bet365/토토 **전체 복제**가 아니라, PHONARA North Star에 맞는 **엔진 완성도 bar**:

| Bar | Bet365 대응 | PHONARA 1차 목표 (MVP) | Defer |
|-----|-------------|------------------------|-------|
| **B1** | 경기·리그 목록 | 축구 · K리그+EPL · prematch | 30+ 리그 |
| **B2** | 승무패·OU | 1X2 · OU 2.5 | 아시안핸디·선수 props |
| **B3** | 배당 실시간 | vendor WS → DB snapshot → UI | 자체 북메이킹 |
| **B4** | 베팅 슬립 | 단폴 + 조합(≤8) · **odds_at_bet 고정** | 시스템베팅 |
| **B5** | 정산 | FT 결과 · void/refund · **Σ=0** | cashout |
| **B6** | 라이브 | in-play · suspend on event | Bet Builder |
| **B7** | 신뢰 | RG · audit · idempotency | 200+ 마켓/경기 |

**World Crush 체감( Rollbit FOMO 등)** 은 스포츠 **엔진과 분리** — Home ticker는 presentation layer ([`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) §2).

---

## 3. 아키텍처 (기획 고정 · 구현 전)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Lovable canvas — /sports · BetSlip · i18n (UI/UX 정본)          │
│  paste → apps/web presentation-import / shell (시각 1:1)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Cursor paste adapter + hooks only
┌───────────────────────────────▼─────────────────────────────────┐
│  Cursor — features/sports/use-*.ts (S3 GREEN 후 wire · RPC only)  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Supabase RPC only (views)
┌───────────────────────────────▼─────────────────────────────────┐
│  PHONARA Sportsbook Engine (Wave-S) — NEW · PG/Supabase           │
│  sports_fixtures · markets · outcomes · odds_snapshots            │
│  sports_bets · sports_bet_legs                                   │
│  rpc_list_* · rpc_get_* · rpc_place_sports_bet · rpc_settle_*    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ wallet lock/credit          │ service_role settle
┌───────────────▼─────────────────────────────▼───────────────────┐
│  Existing PHONARA Core (NO schema merge with game_bets)          │
│  wallet_ledger · RG · kill · reconciliation · admin audit        │
└─────────────────────────────────────────────────────────────────┘
                ▲
                │ normalized odds (TEXT Decimal)
┌───────────────┴───────────────────────────────────────────────────┐
│  Odds Ingest Worker (Supabase 밖 — Edge/cron/VM) · API key server  │
│  Vendor WS/REST → normalizer (event_upsert / odds_upsert)        │
│  Tier B: odds-api-io · Tier A3: Oddsmarket · Tier A2: Betradar     │
└───────────────────────────────────────────────────────────────────┘
```

**Non-negotiable**

- `@phonara/game-engine` · `game_code` enum **확장 금지** (스포츠는 별도 domain)  
- odds/ stake / payout: **`@phonara/money` Decimal · TEXT storage**  
- client odds로 payout 계산 **금지** — server snapshot only  

---

## 4. 플랜 문서 트리 (어떤 .md를 어떤 순서로 만들지)

> **지금 단계:** 아래 **Planning** 행만 작성. **LOCK/EXECUTE**는 operator GO 후.

| # | 문서 (경로) | 단계 | 상태 |
|---|-------------|------|------|
| **P0** | **본 문서** `PHONARA_SPORTSBOOK_MASTER_PLAN.md` | Planning | ✅ |
| **P0** | [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) | Planning | ✅ |
| P1 | [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) | Planning | ✅ 초안 |
| P1 | [`PHONARA_SPORTSBOOK_VENDOR_DECISION.md`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md) | Planning | ✅ 초안 |
| P2 | [`PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md`](PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md) | LOCK DRAFT | ✅ |
| P3 | [`PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md`](PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md) | LOCK DRAFT | ✅ |
| P4 | [`PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md`](PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md) | LOCK DRAFT | ✅ |
| P5 | [`PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md`](PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md) | LOCK DRAFT | ✅ |
| P6 | [`PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md`](PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md) | LOCK DRAFT | ✅ |
| P7 | [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) | LOCK DRAFT (Lovable) | ✅ |
| P8 | [`PHONARA_SPORTSBOOK_E2E_MATRIX.md`](PHONARA_SPORTSBOOK_E2E_MATRIX.md) | Planning→EXECUTE | ✅ |

**문서 작성 규칙 (92-lovable-lock-execute 호환 · 스포츠 엔진용):**

- LOCK마다 **Scope 1줄 · FAIL 1줄 · self-check rg 블록 · EXECUTE 0→N**  
- money RPC는 **RED-first** `supabase/tests/sportsbook_*.sql` 명시  
- Tier E clone **인용 금지**

---

## 5. 실행 타임라인 (현재 repo 상태에 맞춤)

```text
[지금 · Planning]
  P0~P8 문서 트리 ✅ (LOCK = DRAFT · EXECUTE 0)
  operator: LEGAL_GATE §3 · VENDOR_DECISION §5 승인
       ↓
[12-Z paste GO · G9 GREEN · Wave-1~3 (기존 gap 로드map)]
       ↓
[operator 「스포츠 GO」+ LEGAL cleared]
       ↓
  S1 LOCK → migration → read RPC GREEN
  S2 LOCK → ingest worker → odds in DB GREEN
  S3 LOCK → place_bet → conservation GREEN
  S4 LOCK → settle/void GREEN        ← MVP “토토 prematch” 완료 bar
  S4 LOCK → settle/void GREEN        ← MVP “토토 prematch” 완료 bar
  S5 LOCK → in-play                  ← Bet365 live bar
       ↓
  Lovable /sports UI GREEN → paste GO → Cursor adapter + hook wire
  E2E matrix GREEN (Cursor)
```

**병렬 금지표**

| 동시 진행 | 판정 |
|-----------|------|
| Wave-1 Crash migration + Wave-S3 place | **금지** |
| Lovable /sports real wire + S2 ingest 없음 | **금지** (Lovable mock만) |
| Cursor /sports UI 신규 디자인 (Lovable bypass) | **금지** |
| Lovable supabase sports DDL | **금지** |
| paste 중 supabase sports DDL (Cursor) | **금지** (「스포츠 GO」 전) |

---

## 6. Wave-S 요약 (상세는 하위 정본)

| Wave | 목표 | MVP bar | 참고 Tier |
|------|------|---------|-----------|
| **S1** | schema + prematch **read** | B1 경기 목록 | A1 · A3 |
| **S2** | **실시간 배당 ingest** | B3 WS→snapshot | B1·B2 · C1 |
| **S3** | **place** · 단폴·조합 | B4 | A1 · D2 |
| **S4** | settle · void | B5 Σ=0 | A2 · A3 |
| **S5** | in-play | B6 | B2·B4·A3 |

→ 테이블/RPC/invariant 전체: [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) §3

---

## 7. 참고 OSS (선별 정본 · merge 금지)

**풀 플랫폼·상태머신:** [lets-bet](https://github.com/nutcas3/lets-bet)  
**엔터프라이즈 ingest:** [betradar-uof-service](https://github.com/gdszyy/betradar-uof-service)  
**WS 피드 계약:** [Oddsmarket client](https://github.com/AspiraLimited/oddsmarket_client)  
**실시간 SDK (TS):** [odds-api-node](https://github.com/odds-api-io/odds-api-node) · [WS guide](https://docs.odds-api.io/guides/websockets) · [sharpapi-ts](https://github.com/Sharp-API/sharpapi-ts)  
**정규화 contract:** [sportsbook-odds-streaming-api](https://github.com/rustchainer/sportsbook-odds-streaming-api)  

전체 Tier A~F: 하위 Wave-S §2

---

## 8. 법무 · operator 게이트

| Gate | 문서 | 시점 |
|------|------|------|
| 기존 LEGAL 범위 확인 | [`LEGAL_BASIS.md`](LEGAL_BASIS.md) | **P1** (지금) |
| 스포츠북 re-review | `PHONARA_SPORTSBOOK_LEGAL_GATE.md` | **S1 migration 전** |
| operator **「스포츠 GO」** | 본 문서 §10 체크리스트 | S1 LOCK 착수 |
| vendor 계약·API key | `PHONARA_SPORTSBOOK_VENDOR_DECISION.md` | **S2 전** |

**LEGAL trigger (자동 해당):** 신규 베팅 vertical · PHON payout path · 마케팅 범위 변경 → [`LEGAL_BASIS.md`](LEGAL_BASIS.md) § Re-review triggers

---

## 9. 품질 bar (슬라이스별 Definition of Done)

### Planning (지금)

- [x] P0~P8 문서 트리 존재 · gap roadmap §5 링크  
- [ ] P1 LEGAL_GATE · VENDOR_DECISION **operator 승인** (초안 ✅)  
- [ ] Tier E clone **플랜에 “정본”으로 없음**  
- [ ] `rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK*.md docs/PHONARA_ENGINE_WAVE_S*.md docs/LOVABLE_SPORTSBOOK*.md` → 0  

### S1~S4 (구현 단계 · 미래)

- [ ] `supabase db reset` clean  
- [ ] `sportsbook_*_test.sql` conservation **Σ=0**  
- [ ] security advisor **0 ERROR**  
- [ ] `grants_rls_inventory_test.sql` 갱신  
- [ ] rate limit · RG negative path SQL  

### S3 MVP “토토 prematch” product bar

- [ ] prematch 1X2+OU · 조합 ≤8 · kickoff 후 place reject  
- [ ] odds_at_bet ≠ server → reject  
- [ ] idempotency duplicate → 동일 bet id  
- [ ] void → full refund · ledger audit row  

### UI wire (S3 GREEN 후)

- [ ] Lovable `/sports` UI GREEN → **paste GO**
- [ ] Cursor adapter + hook only · **시각 변경 0**
- [ ] `check:i18n` · `sports.*` keys
- [ ] Playwright prematch smoke (Cursor)

---

## 10. operator Planning 체크리스트 (지금 할 일)

| # | 액션 | 담당 | 산출 |
|---|------|------|------|
| 1 | 본 마스터 + Wave-S **승인/수정** | operator | GO or REVISE |
| 2 | [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) counsel 전달 | operator + counsel | re-review 질문 목록 |
| 3 | [`PHONARA_SPORTSBOOK_VENDOR_DECISION.md`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md) §5 결정 | operator | V1/V2/V3 체크 |
| 4 | MVP bar 확정: **prematch 축구 only** vs in-play 동시 | operator | §2 B1~B6 strike |
| 5 | Wave-S vs Wave-1 **순서** 확인 (기본: 1→2→3→**S**) | operator | gap roadmap §5 |
| 6 | 「스포츠 GO」 시점 예약 (paste+Wave-1 후 권장) | operator | 일정 1줄 |

**「스포츠 GO」 없이:** S1 LOCK · migration · ingest worker **시작 금지**

---

## 11. Defer 레지스트리 (기획 단계 고정)

| 항목 | 이유 |
|------|------|
| Bet365급 마켓 depth (100+) | vendor·운영 비용 |
| cashout / partial cashout | S4 이후 별도 Wave |
| 자체 odds compilation | B2B 피드 사용 |
| sports affiliate GGR | Wave-2 partner read 후 |
| Kafka/NATS (초기) | S2는 worker+cron+Redis로 시작 · C2는 scale-out 시 |
| goldsvet / bet365 clone merge | Tier E |
| UI before S3 | mock only until place GREEN |

---

## 12. 리스크

| 리스크 | 완화 |
|--------|------|
| LEGAL 범위 밖 스포츠 | P1 gate · S1 전 서면 |
| vendor lock-in | normalizer contract (C1) · outcome_id canonical |
| odds stale live bet | snapshot TTL · place 시 server-side re-quote |
| Wave-1과 migration 충돌 | §5 병렬 금지 |
| ingest key leak | server-only · Edge secret · VITE 0 |

---

## 13. §GREEN self-check (Planning · migration 0)

```bash
# 마스터 플랜 트리 존재 (P0~P8)
for f in \
  PHONARA_SPORTSBOOK_MASTER_PLAN.md \
  PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md \
  PHONARA_SPORTSBOOK_LEGAL_GATE.md \
  PHONARA_SPORTSBOOK_VENDOR_DECISION.md \
  PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md \
  PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md \
  PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md \
  PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md \
  PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md \
  LOVABLE_SPORTSBOOK_UI_LOCK.md \
  PHONARA_SPORTSBOOK_E2E_MATRIX.md; do
  test -f "docs/$f"
done

# gap roadmap 연결
rg "PHONARA_SPORTSBOOK|LOVABLE_SPORTSBOOK|WAVE_S" docs/PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md

# operator doc CJK 0
rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK*.md docs/PHONARA_ENGINE_WAVE_S*.md docs/LOVABLE_SPORTSBOOK*.md

# paste 전 엔진 touch 0
git diff --stat supabase/ packages/money packages/trading-engine packages/game-engine wallet-ledger
```

**FAIL =** merge 허용 문구 · LEGAL 생략 · game_bets 연결 · paste 중 DDL 언급 without GO gate

---

## 14. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | P0~P8 문서 트리 전량 초안 · LOCK DRAFT · operator 승인 대기 |
| 2026-06-16 | §0.1 Cursor↔Lovable 분업 고정 — 엔진=Cursor · UI/UX=Lovable |

---

*Planning 정본 · 구현·migration·vendor 계약은 §10 operator GO 후 only*
