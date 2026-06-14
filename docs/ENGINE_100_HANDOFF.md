# PHONARA ENGINE 100 — 새 채팅 인계문 (지존급 · 2026-06-14)

> **새 Cursor 채팅 첫 메시지:** 이 파일 전체 붙여넣기 **또는** `@docs/ENGINE_100_HANDOFF.md` 참조 후 §「새 채팅 첫 지시」 복붙.  
> **범위:** 엔진·Supabase·원장·RPC·테스트만. **Lovable UI/ZIP paste는 이 채팅 범위 밖.**  
> **권한:** 사용자가 Supabase **`yocjhjsdwoijfdrehzoq` 전권 위임** — migration apply·advisor·SQL test까지 **자율 진행** (단일 프로젝트 lock 유지).

**레포:** `c:\Users\PC\Desktop\phonara-gb`  
**브랜치:** `main` · **HEAD:** `2d2547e` — `feat(casino): add four games, integration factory, and smoke E2E`  
**감사 기준일:** 2026-06-14 · **복합 점수:** ~**62–68/100** → 목표 **100/100** (§3 정의)  
**선행 기록:** [`WORK_LOG_2026-06-14.md`](WORK_LOG_2026-06-14.md) · Lovable/UI는 [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md)

---

## 0. 절대 원칙 (위반 = 작업 중단)

| # | 규칙 |
|---|------|
| 1 | **Supabase 단일 lock:** `yocjhjsdwoijfdrehzoq` only — 다른 ref/URL 금지 |
| 2 | **중복 금지:** migration·RPC·test·plan **병렬 생성 금지** — 기존 파일 **수정·확장** 우선 |
| 3 | **Append-only migrations:** frozen migration **편집 금지** — 신규 `20260615*.sql`만 |
| 4 | **Money:** float/`number` 금지 · Σ=0 · idempotency · hash chain · `supabase/tests` conservation |
| 5 | **PostgREST:** internal helper `REVOKE` from `PUBLIC, anon, authenticated` — client는 `rpc_*`만 |
| 6 | **RLS + GRANT 쌍:** policy 변경 시 **같은 migration**에 GRANT + `grants_rls_inventory_test.sql` 갱신 |
| 7 | **DoD:** local `supabase db reset` → `bun run test:sql` → security advisor **0 ERROR** → remote apply |
| 8 | **UI no-touch:** `apps/web` presentation/Lovable paste **이 프로그램에서 건드리지 않음** |

---

## 1. 감사 스코어카드 (READ-ONLY · 2026-06-14)

| 도메인 | 현재 | 100점 정의 | 핵심 근거 |
|--------|------|------------|-----------|
| **Ledger / money** | 85–88 | 유지 + 신규 rail conservation test green | `packages/money`, `wallet-ledger`, `conservation_test.sql`, hash chain |
| **Casino 10 + PF** | 78–82 | remote 088–96 apply + types regen + parity green | migrations `88–96`, `check:games`, `casino-sql-parity` |
| **Admin / security** | 78–82 | advisor 0 ERROR post-apply + grant inventory green | kill switches, MFA, RLS tests |
| **Retention** | 58–62 | **바이럴 quota RPC** + conservation SQL | 8× `mission_code` only — viral **없음** |
| **Trading** | 55–60 | oracle-perp **p95 SLO 문서화 + load gate** — **CLOB 별도 프로그램** | display order book, not matching engine |
| **Wallet rails** | 25–30 | **USDT on-chain deposit/withdraw RPC** (KRW 패턴 미러) | KRW만 성숙 — crypto **0건** in `supabase/` |
| **Prod ops** | 45–50 | prod **`reconciliation_log` 1회 green** + cron verified | remote log **empty** · `auth.users=0` |

**복합:** ~62–68/100 (Stake + Binance + institutional ledger bar).

---

## 2. 갭 레지스터 (G1–G8)

### ✅ 이미 닫힘 (재작업 금지)

| ID | 항목 | 근거 |
|----|------|------|
| **G6** | Earn `rpc_spin_roulette` `random()` | `20260609000030_s4_live_surface_hardening.sql` — `_roulette_roll_from_seed` HMAC · `live_surface_hardening_test.sql` green |
| **—** | 신규 4게임 per-game kill | `20260614000089_casino_new_games_engine.sql` — `feature_game_mint_reels_enabled` 등 |
| **—** | 로컬 10게임 엔진 + gates | HEAD `2d2547e` · local migrations **through 096** · `migrations.lock.json` frozen |

### 🔴 미착수 (ENGINE 100 본체)

| ID | 갭 | 증거 | 수정 방향 |
|----|-----|------|-----------|
| **G1** | Remote migrations **088–096 미적용** | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) — remote through **`000079`** only | `supabase db push` / Dashboard apply **기존 9파일** (신규 migration 아님) |
| **G2** | `database.types.ts` **6종 game_code** | `packages/shared-types/src/database.types.ts` L4002, L4187 — 6 values only | `supabase gen types` → **동일 파일 덮어쓰기** (새 types 파일 금지) |
| **G3** | **Crypto deposit/withdraw** 없음 | `grep crypto_deposit` in `supabase/` → **0** · KRW: `rpc_create_krw_deposit_request`, `_credit_krw_deposit_internal` | **신규** `20260615000097_engine100_crypto_rails.sql` — KRW 미러 (§5.1) |
| **G4** | **Viral missions RPC** 없음 | `mission_code` 8종 only (`20260609000004`) · Manifest §3.2 5 types UI-only | **신규** `20260615000098_engine100_viral_missions.sql` 또는 097에 합침 (§5.2) |
| **G5** | Prod **`reconciliation_log` empty** | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) L58 · MCP read-only cannot `rpc_run_reconciliation()` | Dashboard **service_role** 1회 green — [`RUNBOOK.md`](RUNBOOK.md) Scenario 1 SQL |
| **G7** | **Trading p95** 미측정 | CURRENT_STATUS performance backlog · spot RPC 45s under full gate | load test script or documented SLO + optional index/RPC perf migration **별도 099** |
| **G8** | Prod **`auth.users=0`** | authenticated smoke blocked | `setup/MANUAL_TASKS.md` — operator account (ops, not engine code) |

---

## 3. “100점” 합격 정의 (현실적 · 사용자 승인 기준)

| 영역 | PASS 조건 |
|------|-----------|
| **G1+G2** | Remote through **`20260614000096`** · types 10 `game_code` · `check:migrations` green |
| **G3** | `rpc_get_crypto_deposit_address` · `_credit_crypto_deposit_internal` · admin match path · USDT Σ=0 SQL test · withdrawal request with chain/address in `destination` JSONB |
| **G4** | `viral_mission_code` enum (5 values) · `rpc_claim_viral_mission` · quota (day/week/month) · PHON reward conservation · **금지 타입 없음** |
| **G5** | Prod `rpc_run_reconciliation()` → 5 check types **`is_match=true`** · no spurious `system_readonly` |
| **G7** | `rpc_spot_market_buy` p95 documented < target under isolated load OR explicit ADR “oracle-perp 100 ≠ CLOB” in **`CURRENT_STATUS.md`** |
| **Trading CLOB** | **Out of scope** for ENGINE 100 — 별도 multi-month program unless user re-scopes |

**ENGINE 100 완료 선언:** G1–G6 PASS + G7 documented + `bun run test:sql` all green + remote advisor 0 ERROR + [`CURRENT_STATUS.md`](CURRENT_STATUS.md) Known Launch Notes updated.

---

## 4. 실행 페이즈 (E0 → E6 · 순서 엄수)

### E0 — Preflight (duplicate prevention)

```bash
cd c:\Users\PC\Desktop\phonara-gb
git status
bun run check:migrations
ls supabase/migrations/20260614*.sql   # 88–96 존재 확인
ls supabase/migrations/20260615*.sql   # 없어야 함 (시작 전)
```

- [ ] `20260615*.sql` **없음** 확인 (중복 migration 방지)
- [ ] `migrations.lock.json`에 88–96 hash frozen 확인

### E1 — Remote sync (G1 · **기존 파일만**)

**대상 (9 files, already in repo):**

```
20260614000088_game_code_enum_new_games.sql
20260614000089_casino_new_games_engine.sql
20260614000090_casino_metrics_slo.sql
20260614000091_casino_slot_paytable_calibration.sql
20260614000092_blackjack_shuffle_float_fix.sql
20260614000093_slot_paytable_jsonb_fix.sql
20260614000094_slot_reel_strip_extraction_fix.sql
20260614000095_slot_reel_strip_length_fix.sql
20260614000096_blackjack_natural_payout_fix.sql
```

```bash
bunx supabase migration list    # local vs remote diff
bunx supabase db push           # project yocjhjsdwoijfdrehzoq
bunx supabase db lint --linked --level error
```

**DoD:** remote history through **096** · advisor 0 ERROR.

### E2 — Types regen (G2)

```bash
bunx supabase gen types typescript --local > packages/shared-types/src/database.types.ts
# or --linked after E1
bun run typecheck
bun run check:games
```

**DoD:** `game_code` includes `mint_reels|gold_rush|roulette|blackjack`.

### E3 — Crypto rails (G3 · **신규 migration 097**)

**설계 원칙:** KRW Wave 9 패턴 복제 — **새 parallel table set**, 기존 `krw_deposit_requests` / `withdrawal_requests` **수정 최소**.

**참조 구현 (read first):**

| 패턴 | 파일 |
|------|------|
| KRW deposit request | `20260609000033_s1_phase5_deposits_withdrawals.sql` — `krw_deposit_requests`, `_credit_krw_deposit_internal` |
| KRW create RPC | `rpc_create_krw_deposit_request` — idempotency, RG, screening |
| Withdraw lock | `20260613000085_withdrawal_daily_cap.sql` — `rpc_request_withdrawal` |
| System account | `deposit_conversion_phon` → add `deposit_conversion_usdt` |
| First deposit mission | `20260609000032_s2_security_mission_triggers.sql` — trigger on credit |

**097에 포함할 스키마 (제안):**

```text
ENUM crypto_chain: TRC20 | ERC20
ENUM crypto_asset: USDT          -- PHON on-chain = P2

TABLE crypto_deposit_addresses
  (user_id, asset, chain, address UNIQUE, created_at)

TABLE crypto_deposit_requests
  (user_id, wallet_id, asset, chain, amount TEXT, status, tx_hash UNIQUE nullable,
   confirmations_required, confirmations_seen, credited_at, idempotency…)

TABLE on_chain_incoming_transfers
  (tx_hash UNIQUE, …)              -- layer-1 idempotency (mirror bank_incoming_transfers)

FUNCTION rpc_get_crypto_deposit_address(asset, chain)
FUNCTION _credit_crypto_deposit_internal(deposit_id, tx_hash)
FUNCTION rpc_admin_match_crypto_deposit(...)  -- admin/service_role only
-- withdrawal: extend rpc_request_withdrawal destination schema OR
-- rpc_create_crypto_withdrawal_request mirroring KRW gates
```

**Product alignment:** [`LOVABLE_PRODUCT_PLATFORM_MANIFEST.md`](LOVABLE_PRODUCT_PLATFORM_MANIFEST.md) §4 — crypto tab default, no PG.

**Tests — 기존 파일 확장 (신규 test 파일 금지 unless unavoidable):**

- Extend `supabase/tests/phase5_deposit_test.sql` — crypto credit Σ=0, duplicate tx_hash idempotent
- Extend `supabase/tests/phase5_gates_test.sql` — RG/screening on crypto path if gated

**DoD:** `supabase db reset` · conservation · `grants_rls_inventory_test.sql` updated · advisor 0 ERROR.

### E4 — Viral missions (G4 · migration 098 or tail of 097)

**Product spec:** Manifest §3.2 — 5 types, quota, **금지:** `watch_ad`, `complete_survey`, `install_app`.

| viral_mission_code | Quota window | Suggested PHON (configurable) |
|--------------------|--------------|-------------------------------|
| `share_referral_link` | per UTC day | small, e.g. 10–50 |
| `share_story_template` | per UTC week | |
| `invite_friend_signup` | per UTC day | tie to `referrals` table where possible |
| `affiliate_content_post` | per UTC month | |
| `viral_streak_share` | streak ≥ N days | |

**RPC:**

```text
rpc_claim_viral_mission(p_mission TEXT, p_client_request_id TEXT) → JSONB
rpc_get_viral_mission_status() → quotas used/max/cooldownEndsAt
```

- Separate enum **`viral_mission_code`** — do **not** pollute `mission_code` (engine 1-shot missions)
- Table `viral_mission_claims` append-only with `(user_id, mission, window_key)` UNIQUE
- Reward via `_credit_wallet_internal` + system counterparty (mirror `_grant_mission`)
- Rate limit via `_enforce_rate_limit`

**Tests — extend existing:**

- `supabase/tests/reward_conservation_test.sql` — viral claim Σ=0, duplicate idempotency, quota exhaustion

**i18n:** keys `viral.*` / `mission.*` — **`packages/i18n` add-only** (no rename/delete)

**DoD:** conservation green · authenticated cannot self-grant without quota · anon REVOKE on internals.

### E5 — Prod ops (G5 + G8)

**Reconciliation (service_role only):**

```sql
SELECT rpc_run_reconciliation();
-- verify 5 check_types is_match = true
SELECT check_type, is_match, triggered_halt FROM reconciliation_log ORDER BY run_at DESC LIMIT 10;
```

→ [`RUNBOOK.md`](RUNBOOK.md) § Scenario 1 queries.

**DoD:** prod `reconciliation_log` non-empty · latest run all match · `system_readonly` false unless real mismatch.

**Operator account:** follow `setup/MANUAL_TASKS.md` (human step).

### E6 — Gates & status doc

```bash
bun run test:sql
bun run check:migrations
bun run typecheck
bun run check:release
# optional: PHONARA_SQL_PARITY=1 vitest tests/integration/casino-sql-parity.test.ts
bun run lock:migrations    # after new 097/098 only
```

**Update (modify existing, no new plan files):**

- [`docs/CURRENT_STATUS.md`](CURRENT_STATUS.md) — remote through 096+, ENGINE 100 closeout notes
- [`docs/WORK_LOG_2026-06-14.md`](WORK_LOG_2026-06-14.md) — append E0–E6 completion bullets

### E7 — Trading perf (G7 · optional same program or defer)

- Measure `rpc_spot_market_buy` / `rpc_spot_market_sell` p95 isolated vs under load
- Document in `CURRENT_STATUS.md` or existing perf section — **no fake “100” without numbers**
- Full CLOB = **do not start** in this program

---

## 5. 핵심 파일 맵 (엔진 작업용)

| 용도 | 경로 |
|------|------|
| Migrations (existing 88–96) | `supabase/migrations/20260614000088`–`96` |
| Next migration slot | `supabase/migrations/20260615000097_*.sql` |
| Migration lock | `supabase/migrations.lock.json` |
| Types (regen target) | `packages/shared-types/src/database.types.ts` |
| Money packages | `packages/money`, `packages/wallet-ledger`, `packages/trading-engine`, `packages/game-engine` |
| KRW deposit reference | `supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql` |
| Missions schema | `supabase/migrations/20260609000004_phase2_retention_schema.sql` |
| Mission grant internal | `supabase/migrations/20260609000011_p1_reward_conservation_fix.sql` — `_grant_mission` |
| Reconciliation | `supabase/migrations/20260611000056_reconciliation_internal_refactor.sql` |
| Grant inventory test | `supabase/tests/grants_rls_inventory_test.sql` |
| Deposit tests (extend) | `supabase/tests/phase5_deposit_test.sql`, `phase5_gates_test.sql` |
| Reward tests (extend) | `supabase/tests/reward_conservation_test.sql` |
| Solvency/recon tests | `supabase/tests/solvency_reconciliation_test.sql`, `system_account_reconciliation_test.sql` |
| Ops runbook | `docs/RUNBOOK.md` |
| Launch status (update) | `docs/CURRENT_STATUS.md` |
| Viral product spec | `docs/LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` §3.2 |
| Quality gates | `docs/QUALITY_GATES.md` |

---

## 6. 금지 목록 (재확인)

- ❌ `ENGINE_100_ROADMAP.md` 등 **병렬 계획서** (상태는 `CURRENT_STATUS` + `WORK_LOG` + **이 HANDOFF**)
- ❌ frozen migration **편집** (088–096 included after remote apply)
- ❌ duplicate `phase5_deposit_test_v2.sql` — **extend** `phase5_deposit_test.sql`
- ❌ duplicate RPC names / second `_credit_wallet_internal`
- ❌ `SUPABASE_SERVICE_ROLE_KEY` in Vite / browser
- ❌ weakening conservation tests to green
- ❌ Lovable UI / `presentation-import` / `apps/web` routes in this chat
- ❌ Binance-grade CLOB as scope creep for “100”

---

## 7. 새 채팅 첫 지시 (복붙용)

```text
@docs/ENGINE_100_HANDOFF.md 기준으로 PHONARA ENGINE 100 프로그램을 끝까지 실행해줘.

확정:
- Supabase yocjhjsdwoijfdrehzoq 전권 위임됨.
- 중복 파일/migration/RPC 금지 — 기존 파일 수정·확장 우선.
- Lovable/UI no-touch. 엔진·supabase·packages·SQL tests만.

현재: 복합 ~62–68/100. G6(Earn roulette HMAC) 및 로컬 10게임 엔진 DONE.
미착수: G1 remote 088–96, G2 types regen, G3 crypto rails, G4 viral RPC, G5 prod reconciliation.

실행 순서: E0 preflight → E1 remote push 088–96 → E2 gen types → E3 migration 097 crypto → E4 migration 098 viral → E5 prod rpc_run_reconciliation green → E6 test:sql + CURRENT_STATUS 갱신.

각 페이즈 DoD 통과 전 다음 페이즈 금지. Money 변경은 conservation Σ=0 SQL test 필수.
Trading 100 = oracle-perp SLO 문서화 (CLOB 별도 프로그램).

완료 시 docs/WORK_LOG_2026-06-14.md에 append만 (새 로드맵 파일 만들지 말 것).
```

---

## 8. 로컬 검증 치트시트

```bash
# Session start
bun run cursor:preflight
supabase status

# After each migration
supabase db reset
bun run test:sql

# Before remote push
bun run check:migrations
bunx supabase db lint --local --level error

# After remote push
bunx supabase db lint --linked --level error

# Session end
bun run clean
bun run check:hygiene
```

---

## 9. 트랜스크립트 (맥락 복원용)

이 ENGINE 100 감사·계획은 이전 긴 채팅에서 도출됨. 세부 대화:  
Cursor agent transcript `dcf7249f-731d-42c6-8331-f9fe38272117` (repo 외 `.cursor/projects/.../agent-transcripts/`).

---

*PHONARA ENGINE 100 Handoff · v1 · 2026-06-14 · remote through 079 · local through 096 · migrations 097+ not started*
