# PHONARA 스포츠북 — 나중에 할 목록 (DEFERRED)

> **상태:** **전체 보류** — Odds API **미발급** · LEGAL clearance **미완** · operator **「스포츠 GO」** **미발언**  
> **갱신:** 2026-06-16  
> **정본 플랜:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md)  
> **이미 깔린 준비물:** [`PHONARA_SPORTSBOOK_INSTALL_STATUS.md`](PHONARA_SPORTSBOOK_INSTALL_STATUS.md)

---

## 0. 보류 이유 (지금 하지 않는 것)

| # | 조건 | 현재 |
|---|------|------|
| D0-1 | Odds-API.io (또는 확정 vendor) API 키 | **미발급** |
| D0-2 | [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) counsel clearance | **미완** |
| D0-3 | operator **「스포츠 GO」** (S1 migration 허용) | **미발언** |
| D0-4 | L1-08 Sportsbook UI mock | **DEFER** (operator) — Wave-S/API/LEGAL 후 **L1-08 재개** |

**시작 트리거 (아래 3개 모두 충족 후 Wave-S1 착수):**

- [ ] API 키 발급 + `.env`에 `ODDS_API_IO_KEY=` (서버 전용 · **VITE 금지**)
- [ ] LEGAL gate 통과 날짜 LOCK/본 문서에 1줄 기록
- [ ] operator 채팅 **「스포츠 GO」** 1줄

---

## 1. Operator 준비 (API 키 전·후)

### 1.1 API · Vendor

- [ ] [Odds-API.io](https://odds-api.io) 가입 · API 키 발급 (1차 후보 V1 — [`PHONARA_SPORTSBOOK_VENDOR_DECISION.md`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md))
- [ ] 플랜·bookmaker 커버 확인 (축구 **K리그 + EPL** · 1X2 · OU 2.5)
- [ ] vendor 계약/ToS — 재표시·지연 배당·데이터 사용 조항 검토 (LEGAL §2.3)
- [ ] `.env` / Supabase Edge secret에 `ODDS_API_IO_KEY` 등록 (**브라우저·VITE 0**)
- [ ] (선택) `SPORTS_INGEST_LEAGUES=epl,k-league` · `SPORTS_ODDS_VENDOR=odds-api-io` 설정

### 1.2 Legal

- [ ] counsel에 [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) §2 질문 전달
- [ ] prematch MVP vs in-play defer 서면 확인
- [ ] 공개 `/sports` 마케팅 전 clearance 확보
- [ ] clearance 날짜·근거 1줄 기록

### 1.3 Operator GO

- [ ] **「스포츠 GO」** — Cursor S1 EXECUTE 허용
- [ ] (paste 트랙) Lovable 스포츠 UI 100% 후 **ZIP GO** / **paste GO** (별도 지시)

---

## 2. Lovable UI 트랙 (API 없이 mock 가능 · L1-08)

> UI mock은 **실배당/베팅 RPC 불필요** — L1 큐 head가 L1-08일 때 Lovable EXECUTE.  
> **지금은 L1-04~07 선행** → 본 섹션 **큐 도달까지 보류**.

- [ ] [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) REVIEW → APPROVE
- [ ] Lovable EXECUTE: `/sports` IA · fixture list · market cards · **BetSlip** (display/mock)
- [ ] `sports.*` i18n catalog (ko/en) — mock odds는 string display props
- [ ] §GREEN: testid · catalog Δ · [`LOVABLE_VISUAL_REFERENCE_LINKS.md`](LOVABLE_VISUAL_REFERENCE_LINKS.md) §5 패턴 준수
- [ ] operator **ZIP GO** → PHONARA paste (adapter only · 엔진 0-touch)
- [ ] S3 GREEN 전: BetSlip place 버튼 **toast/display-only** (real RPC **0**)

---

## 3. Cursor 엔진 Wave-S (API + GO + LEGAL 후)

순서 고정: **S1 → S2 → S3 → S4 → S5** · Crash Wave-1 migration과 **S3 병렬 금지**.

### S1 — Schema + READ RPC

**LOCK:** [`PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md`](PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md)

- [ ] migration: `sports_fixtures` · `sports_markets` · `sports_outcomes` · `sports_odds_snapshots`
- [ ] odds 컬럼 **TEXT Decimal** · float **금지**
- [ ] `rpc_list_sports_fixtures` · `rpc_get_fixture_markets` (READ only)
- [ ] RLS · GRANT/REVOKE · `sportsbook_rls_read_test.sql`
- [ ] `supabase db reset` · security advisor 0 ERROR
- [ ] **금지:** S1에 `rpc_place_sports_bet` · `sports_bets` 테이블

### S2 — Odds Ingest

**LOCK:** [`PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md`](PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md)  
**전제:** S1 GREEN · API 키 · vendor 확정

- [ ] `scripts/sports-odds-ingest/` WS/REST **live** 연결 (`odds-api-io` SDK)
- [ ] normalizer C1 → PG upsert (service_role)
- [ ] reconnect · lastSeq · stall detector
- [ ] `SPORTS_INGEST_DRY_RUN=false` live persist
- [ ] 수동 1회: K리그+EPL fixture ≥1 · 1X2 odds 갱신 확인
- [ ] **금지:** vendor SDK browser bundle · `VITE_*` API key

### S3 — Place Bet

**LOCK:** [`PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md`](PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md)

- [ ] `sports_bets` · `sports_bet_legs` migration
- [ ] `rpc_place_sports_bet` · wallet lock · RG · kill switch (카지노 동급)
- [ ] combo ≤8 legs · server odds snapshot match · idempotency
- [ ] RED-first: `supabase/tests/sportsbook_place_conservation_test.sql`
- [ ] `apps/web/src/features/sports/use-place-sports-bet.ts` (**S3 GREEN 후 only**)
- [ ] Lovable BetSlip → hook wire (paste adapter · 시각 1:1)

### S4 — Settle / Void

**LOCK:** [`PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md`](PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md)

- [ ] `rpc_settle_sports_bet` · void/refund · **Σ=0** conservation
- [ ] FT 결과 ingest (vendor scores channel 또는 수동 admin)
- [ ] Admin exception queue (void · dispute)
- [ ] SQL conservation + hash-chain 테스트

### S5 — In-Play

**LOCK:** [`PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md`](PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md)

- [ ] live status · suspend on goal/red card
- [ ] in-play odds refresh · stale snapshot place **차단**
- [ ] Realtime/UI fanout (presentation은 hook 값만 표시)

---

## 4. E2E · 품질 게이트 (S3 이후 순차)

**매트릭스:** [`PHONARA_SPORTSBOOK_E2E_MATRIX.md`](PHONARA_SPORTSBOOK_E2E_MATRIX.md)

- [ ] Playwright: fixture list smoke (mock → live RPC)
- [ ] Place bet E2E: success + odds_changed + insufficient balance
- [ ] DB conservation assert (Σ=0 per currency)
- [ ] Settle E2E: win / lose / void
- [ ] Admin negative auth · audit row
- [ ] `bun run check` · `check:i18n` · `check:release` green

---

## 5. 이미 완료 (재작업 금지 · 참고만)

- [x] `packages/sportsbook-engine/` — C1 타입 · combo odds · payout preview
- [x] `packages/sports-ingest/` — normalizer · `odds-api-io` dep
- [x] `scripts/sports-odds-ingest/` — dry-run 스캐폴드
- [x] `bun run sports:ingest:dry` · `.env.example` 주석 템플릿
- [x] LOCK 초안 S1~S5 · LEGAL · VENDOR · UI LOCK · E2E matrix 문서

---

## 6. 장기 Defer (MVP 이후)

- [ ] cashout (B5 defer)
- [ ] Bet Builder · system bet
- [ ] 30+ 리그 · 아시안핸디 · player props
- [ ] 스포츠 affiliate GGR 커미션 (Wave-2 partner read 이후)
- [ ] Betradar UOF enterprise migration (V3)
- [ ] Tier E Bet365/1xbet **클론 repo merge** — **영구 금지**

---

## 7. 착수 시 복붙 self-check

```bash
# 보류 상태 확인 (S1 전 기대: migration 0 hit)
rg "sports_fixtures|rpc_place_sports_bet" supabase/migrations/ || echo "S1 not started OK"

# 준비 패키지만 존재
test -d packages/sportsbook-engine && test -d packages/sports-ingest

# API 키가 VITE에 없음
rg "VITE_.*ODDS" apps/web .env.example

# operator 문서 CJK 0
rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK_DEFERRED_TODO.md
```

---

## 8. 관련 정본 링크

| 문서 | 용도 |
|------|------|
| [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) | 전체 아키텍처 |
| [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) | Wave-S 상세 |
| [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) | L1-08 · L3-04 큐 |
| [`PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md`](PHONARA_WORLD_CLASS_INTEGRATED_ROADMAP.md) | 통합 백로그 |
| [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) | UI EXECUTE 정본 |

**마지막 갱신 메모:** API 미발급으로 ingest live·S1 migration·place/settle **전부 보류**. L1-08 UI mock만 큐 도달 시 API 없이 진행 가능.
