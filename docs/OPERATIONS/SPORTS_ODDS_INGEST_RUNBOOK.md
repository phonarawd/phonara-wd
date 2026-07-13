# Sports 배당 Ingest 운영 런북 (ZA-13 · 1-I)

> **대상:** 스포츠 배당(odds) 수집 파이프라인 — `scripts/sports-odds-ingest/` · `scripts/sports-orchestrator/`
> **근거:** [`ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`](../audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md) 1-I · ZA-13
> **하지 않을 것:** 이 문서 승인만으로 `LAUNCH_GATES.sportsBetting`/`sportsCashout`을 `true`로 전환하지 않는다 — ingest health green **+** 별도 operator 승인이 둘 다 필요하다.

## 배경 — 「—」보드와 ingest의 관계

`/sports` 보드에서 배당이 「—」로 보이는 것은 **두 가지 서로 다른 계층**이 맞물린 결과다:

1. **표시 규율(정상 · 코드 변경 대상 아님):** [`resolveSportsOddsCellDisplay`](../../apps/web/src/domain/sports-odds-freshness-display-contract.ts)가 `captured_at`이 TTL(프리매치 300초 · 라이브 15초) 밖이면 무조건 `display: '—'` + `selectable: false`를 반환한다 — fail-closed 설계, 결함 아님.
2. **ingest 운영 상태(이 문서가 다루는 부분):** 위 TTL 안에 드는 새 스냅샷을 실제로 PG에 쓰는 워커가 **기본적으로 dry-run**이다. 아래 절차 없이는 어떤 경기도 fresh 상태가 되지 않는다.

Wave 10(ZA-13)에서 보드에 [`shouldShowSportsIngestOfflineBanner`](../../apps/web/src/domain/sports-odds-freshness-display-contract.ts) 기반 배너를 추가해, 전 종목이 stale/missing일 때 "배당 피드 갱신 대기 중"을 명시적으로 보여준다(`sports-board-ingest-offline-banner`) — 이 문서는 그 배너가 뜬 뒤 운영자가 해야 할 일을 정리한다.

## 구성요소 3개 (혼동 주의 — 이름이 비슷함)

| 스크립트                               | 역할                                                      | 실행                          |
| -------------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `scripts/sports-odds-ingest/run.ts`    | REST 벤더(TheOddsAPI 등) → `sports_odds_snapshots` upsert | `bun run sports:ingest`       |
| `scripts/sports-odds-ingest/ws-run.ts` | WS 벤더 실시간 스트림(odds-api-io WS)                     | `bun run sports:ingest:ws`    |
| `scripts/sports-orchestrator/run.ts`   | 위 채널들 + settle 워커를 헬스체크와 함께 orchestrate     | `bun run sports:orchestrator` |

**주의(package.json 함정):** `sports:ingest:dry`와 `sports:ingest`는 **동일한 파일**(`run.ts`)을 가리킨다 — dry-run 여부는 스크립트 이름이 아니라 **환경변수** `SPORTS_INGEST_DRY_RUN`으로만 결정된다. `bun run sports:ingest`를 실행해도 `.env`에 `SPORTS_INGEST_DRY_RUN=false`가 없으면 여전히 dry-run이다.

## `SPORTS_INGEST_DRY_RUN=false` 전환 조건 (전부 충족 후에만)

1. **벤더 API 키 확보** — 아래 중 최소 1개를 `.env`에 설정:
   - `THE_ODDS_API_KEY` (TheOddsAPI)
   - `ODDS_API_IO_KEY` (odds-api-io)
   - `SPORTSGAMEODDS_API_KEY` (SportsGameOdds)
   - `SPORTS_ODDS_VENDOR` / `SPORTS_ODDS_VENDOR_PRIORITY`로 벤더 우선순위 지정(미지정 시 `resolveVendorChain` 기본 순서 사용).
2. **quota 확인** — 무료/저가 티어는 요청 한도가 낮다. `SPORTS_INGEST_LEAGUES`(기본 `epl,k-league`)를 좁혀서 소규모로 먼저 검증.
3. **Soft Launch 승인** — operator가 이 런북을 읽고 dry-run 해제를 명시적으로 승인(1인 운영 — 자기 승인 기록만 있으면 됨, 근거는 이 문서 링크).
4. `.env`에 `SPORTS_INGEST_DRY_RUN=false` 설정 후 `bun run sports:ingest` (또는 `sports:orchestrator`)로 기동.

**하지 않을 것:** 벤더 키 없이 코드 기본값(`SPORTS_INGEST_DRY_RUN !== 'false'` → true)을 뒤집지 않는다 — 빈 upsert 반복 실행 또는 무의미한 API 할당량 소모로 이어진다.

## 기동 후 health 확인

1. **DB 조회** — `sports_ingest_health` 테이블 최신 행 확인:
   ```sql
   select channel, league_code, vendor, status, last_success_at, lag_ms
   from sports_ingest_health
   order by last_success_at desc nulls last
   limit 20;
   ```
   `status`는 `healthy | degraded | stale | error | disabled | skipped` 중 하나([`ingest-orchestrator-types.ts`](../../packages/sports-ingest/src/ingest-orchestrator-types.ts)) — `healthy`가 아니면 배당이 fresh해지지 않는다.
2. **UI 확인** — `/sports` 보드의 `sports-board-ingest-offline-banner`가 사라지고 배당 셀이 `data-odds-freshness="fresh"`로 바뀌는지 확인(브라우저 확인은 operator 수동 — 로컬 heavy E2E 금지).
3. **정지된 경우** — `sports_ingest_health.last_error` 확인 → 벤더 quota/네트워크/API 스키마 변경 여부 확인 → 필요 시 `SPORTS_ODDS_VENDOR_PRIORITY`로 다음 벤더로 failover.

## Edge Function 미배포 상태 (별도 트랙)

`supabase/functions/`에는 `sports-odds-ingest` 함수가 **존재하지 않는다**(디렉터리 자체가 없음 확인) — 실제 fetch/upsert 로직은 전부 Node 워커(`scripts/sports-odds-ingest/`)에만 있다. 현재 ingest는 **Node 워커를 수동/크론으로 기동해야만** 동작한다 — Edge 함수로의 이전은 이 런북의 범위 밖 별도 승인 트랙이다. Edge 미배포 자체가 결함은 아니다(Node 워커 경로가 대체 가능한 정상 경로).

## Betting/Cashout 게이트 ON 조건 (엔진 freeze 준수 — 이 문서로 전환하지 않음)

- `LAUNCH_GATES.sportsBetting` / `sportsCashout`은 코드 기본값 `false`([`launch-gates.ts`](../../apps/web/src/lib/launch-gates.ts))이며, [`sportsBettingGatesClosedUntilIngestGreen`](../../apps/web/src/domain/sports-odds-freshness-display-contract.ts)이 "ingest health green 전까지 게이트는 반드시 false"를 vitest로 고정한다.
- 게이트 ON 조건(**둘 다 필요**):
  1. 위 health 확인에서 대상 리그가 지속적으로(단발성 아님) `healthy`.
  2. Operator가 별도로 명시 승인(이 런북 읽기 + `LAUNCH_GATES` 코드 수정 PR — 엔진 변경이므로 표준 마이그레이션/코드 변경 절차 준수).
- 이 문서 승인만으로 게이트를 열지 않는다 — 다시 강조.

## VIP 탭 참고 (finding 아님)

`/sports/vip`는 전용 VIP 마켓 카탈로그가 아니라 **자격 게이트 + 공유 `SportsFixtureBoard`**다([`ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`](../audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md) 1-I.2) — 위 ingest 상태가 VIP 보드에도 동일하게 적용된다. 코드 변경 없음.

## Phase 5 재검증 (2026-07-14 · Zero-Defect Critical Hardening)

| 항목 | 결과 |
| --- | --- |
| dry-run 기본값 | **유지** — `SPORTS_INGEST_DRY_RUN !== 'false'` → dry-run (`worker.ts` / `ws-worker.ts`) |
| ingest-offline 배너 | **유지** — `shouldShowSportsIngestOfflineBanner` · `sports-board-ingest-offline-banner` |
| owner vitest | freshness contract + `sports-page` ZA-13 배너 케이스 **green** (Phase 5 세션) |
| `LAUNCH_GATES.sportsBetting` / `sportsCashout` | **`false` 유지** — 본 Phase에서 flip **0** |
| dry-run 해제 · Edge 배포 · 베팅 게이트 ON | **여전히 OPEN** — §전환 조건·§Betting/Cashout 전부 충족 + 별도 operator 승인 후에만 |

정본 Plan: [`PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md`](../PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md) Phase 5.

## 참고

- [`sports-odds-freshness-display-contract.ts`](../../apps/web/src/domain/sports-odds-freshness-display-contract.ts) — TTL·health·배너 로직
- [`scripts/sports-odds-ingest/worker.ts`](../../scripts/sports-odds-ingest/worker.ts) — dry-run 기본값(`readIngestEnv`)
- [`scripts/lib/sports-ingest-health.ts`](../../scripts/lib/sports-ingest-health.ts) · [`packages/sports-ingest/src/ingest-orchestrator-types.ts`](../../packages/sports-ingest/src/ingest-orchestrator-types.ts) — health record/status
- [`apps/web/src/lib/launch-gates.ts`](../../apps/web/src/lib/launch-gates.ts) — `sportsBetting`/`sportsCashout` 게이트
