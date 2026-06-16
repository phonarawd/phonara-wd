# PHONARA · 새 채팅 인계 (2026-06-16)

> **용도:** Cursor / Lovable AI **새 채팅** 첫 메시지에 붙여넣기 — 맥락 손실·렉 없이 즉시 이어가기  
> **갱신:** 2026-06-16 · 스포츠북 엔진 S1–S22 + 원격 ingest/settle + L1-08 UI 준비  
> **정본 큐:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md)

---

## 0. 새 AI에게 한 줄

PHONARA: **엔진·ingest·settle = Cursor repo** (S1–S22 로컬·원격 GREEN) · **스포츠 UI/UX = Lovable canvas only** (L1-08 재개) · paste/ZIP 전 `apps/web` sports UI **Cursor 창작 금지**.

---

## 1. 역할 분리 (절대)

| 담당 | 공간 | 하는 일 | 금지 |
|------|------|---------|------|
| **Cursor** | `phonara-gb` repo | S1–S22 엔진 · ingest/settle worker · hook · paste adapter · E2E | Lovable canvas · `/sports` UI **신규 디자인** |
| **Lovable AI** | Lovable workspace | `/sports` IA · BetSlip · i18n · mock/toast place | supabase · RPC · `use-*.ts` · real place |
| **Operator** | 판단 | GO 한 줄 · ZIP GO · paste GO | — |

---

## 2. 스포츠북 엔진 — 완료 상태 (재작업 금지)

### Wave · migration

- **S1–S22** 로컬 GREEN · 원격 `yocjhjsdwoijfdrehzoq` **db push 완료** (`20260616000099`–`111`)
- 패키지: `@phonara/sportsbook-engine` · `@phonara/sports-ingest`
- Hook (paste wire용, **Lovable 0-touch**): `apps/web/src/features/sports/use-sports-betting.ts`

### 로컬 게이트 (2026-06-16 실측)

| 게이트 | 결과 |
|--------|------|
| unit sportsbook-engine + sports-ingest | **41/41** |
| SQL `sportsbook_*` | **16/16** |
| E2E `bun run test:e2e:sports-engine` | **5/5** (Σ=0) |
| `build:packages` · `typecheck` | PASS |

전체 `test:sql` 57 중 **9 fail** = phase5·ops_health 등 **비스포츠** 기존 이슈.

### 원격 프로덕션 데이터 (실측)

| 항목 | 값 |
|------|-----|
| fixtures | **96** (world-cup **56** · mlb **17** · nfl 등 잔여) |
| markets / outcomes / odds_snapshots | 139 / 337 / **1052** |
| world-cup `finished` (dual-feed settle) | **12** |
| `sports_bets` (실유저) | **0** |

### ingest · settle 설정 (`.env` · 서버 전용)

```env
SPORTS_INGEST_LEAGUES=world-cup,mlb
SPORTS_INGEST_DRY_RUN=false
SPORTS_SETTLE_LEAGUES=world-cup
SPORTS_SETTLE_DRY_RUN=false
SPORTS_SETTLE_DUAL_FEED=true
SPORTS_SETTLE_DUAL_FEED_STRICT=true
FOOTBALL_DATA_API_KEY=...   # football-data.org
SPORTS_ORCHESTRATOR_WS=false
```

**6월 시즌:** EPL off → **world-cup + mlb** (FIFA WC 2026 진행 중).

### 이번 세션 엔진·워커 수정 (중요)

| 파일 | 내용 |
|------|------|
| `packages/sports-ingest/src/football-data-org.ts` | dual-feed secondary (WC 등) |
| `packages/sports-ingest/src/settle-score-match.ts` | 팀명 fuzzy match |
| `packages/sports-ingest/src/the-odds-api-scores.ts` | WC 객체형 scores 파싱 |
| `packages/sports-ingest/src/score-event-bootstrap.ts` | finished 경기 odds 없을 때 bootstrap |
| `packages/sports-ingest/src/the-odds-api.ts` | `world-cup` · `mlb` slug |
| `scripts/sports-settle/worker.ts` | dual-feed + bootstrap + `SPORTS_SETTLE_LEAGUES` |

---

## 3. Lovable 트랙 — L1-08 Sportsbook UI

### 큐 상태

- **L1-01~13g** §GREEN · catalog **1644**
- **L1-08** `/sports` — operator **재개 GO** (이전 DEFER 해제)
- **GATE:** Lovable 100% → operator 「ZIP 발행 GO」→ paste

### LOCK 정본

- [`docs/LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) (DRAFT — v0.2 프롬프트가 상위)
- Lovable dispatch: [`docs/LOVABLE_AI_MASTER_PROMPT.md`](LOVABLE_AI_MASTER_PROMPT.md) §1
- Visual refs: [`docs/LOVABLE_VISUAL_REFERENCE_LINKS.md`](LOVABLE_VISUAL_REFERENCE_LINKS.md) §5

### Lovable EXECUTE 규칙

- Place = **toast mock only** · `rpc_place_sports_bet` **호출 금지**
- Mock data: world-cup 56 · mlb 17 feel
- BetSlip: single/combo/sgp · combo≤8 · SGP same fixture
- paste 후 Cursor가 hook wire · mock place 삭제

### Lovable 첫 메시지 (복붙)

```text
L1-08 Sportsbook UI LOCK v0.2 — operator 재개 GO. EXECUTE GO Step 0부터.
엔진 0-touch · place는 toast mock · paste 후 Cursor wire.
```

→ 이어서 **L1-08 v0.2 전체 LOCK 프롬프트** 붙임 (이전 채팅 또는 operator가 `lovable ai에게 보낼 프롬프트 보내줘` 요청).

---

## 4. 메이저 북 vs 현재 (솔직 bar)

### ✅ 엔진 (Cursor · 검증됨)

money lock · Σ=0 · place/settle/cashout/SGP/system · anti-arb · dual-feed settle · 3-vendor ingest · 원격 live odds

### ❌ 아직 (UI / 운영 / Phase B)

| 격차 | 담당 |
|------|------|
| `/sports` UI · BetSlip | **Lovable L1-08** |
| hook wire · real place | **Cursor paste 후** |
| 24/7 orchestrator + WS | operator GO · 장시간 프로세스 |
| SGP correlation pricing UI | Phase B |
| partial cashout UI | Phase B |
| 30+ 리그 | Phase B ingest |

---

## 5. Cursor 다음 작업 (우선순위)

1. **Lovable §GREEN 대기** — REVISE/APPROVE · EXECUTE 리뷰만 (repo 구현 0)
2. operator 「ZIP GO」 후 **paste** → `presentation-import` 흡수 visual 1:1
3. paste 후 **hook wire** (`use-sports-betting.ts` · mock 삭제) · sports E2E 확장
4. (선택) `SPORTS_ORCHESTRATOR_WS=true` + `bun run sports:orchestrator` 24/7
5. (선택) `SPORTS_INGEST_LEAGUES` 확장 · K리그 월드컵 휴식 후

---

## 6. 터미널 치트시트

```powershell
# 패키지 빌드 (ingest/settle 전 필수 — clean 후 dist 없음)
bun run build:packages

# shell env가 .env 덮어쓰면 제거 후 실행
Remove-Item Env:SPORTS_INGEST_DRY_RUN, Env:SPORTS_SETTLE_DRY_RUN, Env:SUPABASE_URL -ErrorAction SilentlyContinue

bun run sports:ingest          # live → 원격
bun run sports:settle          # live dual-feed
bun run sports:settle:dry
bun run test:e2e:sports-engine # 로컬 supabase 필요
bun run test:sql               # sportsbook 16/16 확인
bun run e2e:kill
bun run check:hygiene
```

**FAIL 패턴:** `bun run test` 후 `clean:artifacts`가 `dist` 삭제 → ingest 전 **재빌드** 필수.

---

## 7. 절대 금지

- Supabase migration/RPC **operator 명시 없이** 추가
- Lovable ZIP **operator 「ZIP 발행」 없이**
- `apps/web` `/sports` UI Cursor가 새로 그림 (paste 전)
- Bet365 스크래핑 · Tier E clone import
- `.env` 키를 `VITE_*`에 노출

---

## 8. 정본 문서 맵

| 문서 | 용도 |
|------|------|
| [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) | L1/L2/L3 큐 |
| [`PHONARA_SPORTSBOOK_INSTALL_STATUS.md`](PHONARA_SPORTSBOOK_INSTALL_STATUS.md) | S1–S22 설치 |
| [`PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md`](PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md) | Phase A/B |
| [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) | L1-08 LOCK |
| [`PHONARA_LOVABLE_P2_GAMES_HANDOFF.md`](PHONARA_LOVABLE_P2_GAMES_HANDOFF.md) | canvas 스냅샷 |

---

## 9. 새 Cursor 채팅 붙여넣기 블록

아래 §10을 **새 채팅 첫 메시지**에 붙여넣고, 필요 시 `@docs/PHONARA_NEW_CHAT_HANDOFF_2026-06-16.md` 참조.

---

## 10. COPY-PASTE · 새 Cursor 채팅용

```text
PHONARA 인계 — 이전 채팅 맥락 요약. 정본: docs/PHONARA_NEW_CHAT_HANDOFF_2026-06-16.md

【분업】엔진=Cursor repo · UI/UX=Lovable only · paste 전 apps/web /sports UI Cursor 창작 금지.

【엔진 DONE】Wave S1–S22 로컬+원격 GREEN. sportsbook SQL 16/16 · unit 41 · E2E sports 5/5.
원격 fixtures 96 (world-cup 56, mlb 17) · odds_snapshots 1052 · WC finished 12 (dual-feed settle live).

【.env】SPORTS_INGEST_LEAGUES=world-cup,mlb · INGEST live · SETTLE live · DUAL_FEED=true · SETTLE_LEAGUES=world-cup · ORCHESTRATOR_WS=false.

【Lovable】L1-08 Sportsbook UI 재개 GO. Place=toast mock · RPC 0. LOCK v0.2 프롬프트 준비됨 — Plan→EXECUTE→§GREEN.

【Cursor 다음】① Lovable §GREEN 리뷰 ② ZIP GO 후 paste ③ use-sports-betting wire ④ (선택) orchestrator 24/7.

【워커 수정됨】dual-feed settle · score bootstrap · world-cup/mlb league map · WC scores parser.

【터미널】ingest/settle 전 bun run build:packages · shell env override 제거 후 실행.

지금 내가 원하는 작업: [여기에 한 줄]
```

---

*operator 인계 · git 미커밋 변경 많음 — 엔진/ingest/docs 로컬 작업 상태 유지*
