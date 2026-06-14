# PHONARA ENGINE 100 — Phase 2 인계문 (지존급 · 2026-06-14 · v2)

> **새 Cursor 채팅 첫 메시지:** `@docs/ENGINE_100_HANDOFF.md` 참조 후 **§「새 채팅 첫 지시」** 복붙.  
> **범위:** 엔진·Supabase·원장·RPC·SQL tests·packages·i18n keys·hook wrappers. **Lovable UI/ZIP/presentation-import는 범위 밖.**  
> **권한:** Supabase **`yocjhjsdwoijfdrehzoq` 전권 위임** — migration apply·advisor·SQL test·remote query **자율 진행** (단일 프로젝트 lock 유지).

**레포:** `c:\Users\PC\Desktop\phonara-gb`  
**브랜치:** `main`  
**HEAD:** `ff50b6e` — `docs: add Lovable Zenith handoff and platform contracts`  
**엔진 커밋:** `5a939bb` — `feat(engine): add crypto rails and viral missions (ENGINE 100)`  
**감사 기준일:** 2026-06-14 · **복합 점수:** ~**88–92/100** (엔진 레일 기준) → 목표 **100/100** (§3)  
**선행 기록:** [`WORK_LOG_2026-06-14.md`](WORK_LOG_2026-06-14.md) §8 · Lovable/UI는 [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md)

---

## 0. 절대 원칙 (위반 = 작업 중단)

| # | 규칙 |
|---|------|
| 1 | **Supabase 단일 lock:** `yocjhjsdwoijfdrehzoq` only |
| 2 | **중복 금지:** migration·RPC·test·plan **병렬 생성 금지** — 기존 파일 **수정·확장** 우선 |
| 3 | **Append-only migrations:** frozen **097–098 포함** 편집 금지 — 신규는 **`20260616*.sql`** 슬롯부터 |
| 4 | **Money:** float/`number` 금지 · Σ=0 · idempotency · hash chain · `supabase/tests` conservation |
| 5 | **PostgREST:** internal helper `REVOKE` from `PUBLIC, anon, authenticated` |
| 6 | **RLS + GRANT 쌍:** policy 변경 시 같은 migration + `grants_rls_inventory_test.sql` |
| 7 | **DoD:** `supabase db reset` → `bun run test:sql` → advisor **0 ERROR** → remote apply |
| 8 | **Presentation no-touch:** `apps/web/src/presentation-import/*`, Lovable paste, 시각 UI **건드리지 않음** |
| 9 | **Cursor 성능:** 무거운 게이트 **한 번에 하나** · E2E **백그라운드 금지** · 세션 끝 `bun run clean` |

---

## 1. Phase 1 완료 요약 (E0–E6 · 재작업 금지)

| Phase | 결과 | 증거 |
|-------|------|------|
| **E0** | Preflight OK | `check:migrations` 99 locked |
| **E1** | Remote **084–098** applied | `supabase db push --linked` green |
| **E2** | Types regen | `game_code` **10종** · `crypto_*` · `viral_mission_code` in `database.types.ts` |
| **E3** | **097** crypto rails | `rpc_get_crypto_deposit_address`, `rpc_create_crypto_deposit_request`, `rpc_process_on_chain_transfer`, `_credit_crypto_deposit_internal`, USDT withdrawal `chain`+`address` validation, `deposit_conversion_usdt`, RTP drift `ops_alerts` fix |
| **E4** | **098** viral RPC | `rpc_claim_viral_mission`, `rpc_get_viral_mission_status`, quota + `viral_mission_reward` conservation |
| **E5** | Prod reconciliation | `rpc_run_reconciliation()` → 5 families **`is_match=true`** |
| **E6** | Gates | `test:sql` **41/41** · `check:advisors` **0 ERROR** · `CURRENT_STATUS` 갱신 |

**Remote:** through `20260615000098` · **Local lock:** 99 migrations frozen.

---

## 2. 감사 스코어카드 (Phase 2 기준 · 2026-06-14)

| 도메인 | Phase 1 후 | 100점 정의 | 잔여 |
|--------|------------|------------|------|
| **Ledger / money** | 90–92 | 유지 + 전체 gate green | `check:full` 재검증 |
| **Casino 10 + PF** | 88–90 | remote 088–098 · parity · `check:games` | **build:packages flake** (이 PC) |
| **Admin / security** | 85–88 | advisor 0 ERROR 유지 | prod cron recon 주기 확인 |
| **Retention** | 82–85 | viral RPC + SQL | **i18n `viral.*` 키 없음** · hook 없음 |
| **Trading** | 60–65 | **p95 수치 문서화** (CLOB 아님) | G7 측정 미착수 |
| **Wallet rails** | 78–82 | USDT deposit Σ=0 | crypto **RG** KRW-only · admin queue E2E 없음 |
| **Prod ops** | 75–80 | recon 1회 green | **G8** `auth.users=0` · operator smoke |

**복합 (엔진만):** ~**88–92/100** · **제품 100 (hooks+i18n+full gate):** ~**82–85/100**

---

## 3. 갭 레지스터 (G1–G12)

### ✅ 닫힘 (재작업 금지)

| ID | 항목 |
|----|------|
| **G1** | Remote 088–098 applied |
| **G2** | `database.types.ts` 10 `game_code` + crypto/viral types |
| **G3** | Crypto deposit rails (097) |
| **G4** | Viral missions RPC (098) |
| **G5** | Prod `rpc_run_reconciliation()` green |
| **G6** | Earn roulette HMAC (`000030`) |

### 🔴 Phase 2 — 다음 작업 (ENGINE 100 마감)

| ID | 갭 | 증거 | 수정 방향 |
|----|-----|------|-----------|
| **G7** | Trading **p95 미측정** | `CURRENT_STATUS` ADR만 있음, 수치 없음 | E7: isolated load script or `scripts/measure-spot-rpc-p95.ts` · `CURRENT_STATUS`에 p50/p95/p99 기록 |
| **G8** | Prod **`auth.users=0`** | authenticated prod smoke blocked | E8: [`setup/MANUAL_TASKS.md`](../setup/MANUAL_TASKS.md) operator 1명 — **사람 작업**; 이후 read-only prod smoke |
| **G9** | **`check:games` / `build:packages` red** | `packages/money` dist/TS6305 on this PC | E9: `bun run build:packages` green 복구 → `check:games` → optional `check:full` |
| **G10** | **i18n viral/crypto RPC errors** | `grep viral` in `packages/i18n` → 0 | E10: `packages/i18n` **add-only** `viral.*`, `wallet.crypto.*` 키 + `check:i18n` |
| **G11** | **Hook wrappers 없음** | `grep rpc_claim_viral` in `apps/web` → 0 | E11: `features/wallet` / `features/earn` — **기존 hook 패턴**으로 RPC wrapper만 (UI no-touch) |
| **G12** | **Crypto RG + gates test** | `_assert_rg_deposit_allowed` KRW-only (`000073`) | E12 (optional 099): USDT deposit monthly cap mirror **또는** `phase5_gates_test.sql` crypto screening branch only |

### 🟡 Out of ENGINE 100 (별도 프로그램)

| 항목 | 이유 |
|------|------|
| Binance-grade **CLOB** | 아키텍처 범위 밖 |
| Lovable **presentation paste** | [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md) |
| Full **admin crypto queue UI** | Admin presentation slice |

---

## 4. “100점” 합격 정의 (Phase 2 · 현실적)

| 영역 | PASS |
|------|------|
| **G7** | Spot/futures RPC p95 **숫자** documented in `CURRENT_STATUS.md` (isolated run, not fake) |
| **G8** | Operator account exists OR documented blocker + no-mutation checklist done |
| **G9** | `build:packages` + `check:games` green; `test:sql` 41/41; `check:advisors` 0 ERROR |
| **G10** | `check:i18n` green with viral/crypto client error keys |
| **G11** | Hook wrappers call `rpc_*` only; no engine recompute in UI |
| **G12** | (Optional) crypto RG or gates SQL extension |

**ENGINE 100 Phase 2 완료 선언:** G7–G11 PASS + `WORK_LOG` append + **no new parallel plan files**.

---

## 5. 실행 페이즈 (E7 → E12 · 순서 엄수)

### E7 — Trading perf (G7)

```bash
# Isolated — NOT during check:full or E2E
# Example: repeat rpc_spot_market_buy N times against local stack, record timings
```

- Target RPCs: `rpc_spot_market_buy`, `rpc_spot_market_sell` (optional futures open/close)
- Record: p50, p95, p99, sample N≥30, isolated vs after-5-E2E-specs (optional)
- Update `docs/CURRENT_STATUS.md` performance section with **actual ms**
- **Do not** start CLOB / order-matching engine work

### E8 — Prod operator (G8 · human)

→ [`setup/MANUAL_TASKS.md`](../setup/MANUAL_TASKS.md): first admin/operator, MFA, no-mutation prod smoke checklist.

Agent: verify `auth.users` count via linked read-only query; document in `CURRENT_STATUS` if still 0.

### E9 — Package & full gates (G9)

```bash
cd c:\Users\PC\Desktop\phonara-gb
bun run build:packages          # fix money dist if broken
bun run check:games
bun run typecheck
bun run test:sql                # 41/41
bun run check:advisors          # needs SUPABASE_ACCESS_TOKEN in .env
# After E9 stable only (heavy — one terminal, block until exit):
bun run check:full              # or narrow: test:e2e + casino-smoke
```

**Known flake:** PowerShell `supabase gen types` redirect → UTF-16; use UTF-8 no-BOM write (see Phase 1 notes in `WORK_LOG` §8).

### E10 — i18n (G10 · add-only)

**Files:** `packages/i18n/src/locales/ko.json`, `en.json` (기존 패턴만)

**최소 키 (예시 — 기존 네이밍에 맞게 조정):**

- `viral.claim.success`, `viral.quota_exhausted`, `viral.streak_not_eligible`, `viral.invite_not_eligible`
- `wallet.crypto.deposit.pending`, `wallet.crypto.withdraw.invalid_chain`
- RPC stable error codes → existing `translate-error` / `errors.*` 패턴에 매핑

```bash
bun run check:i18n
```

### E11 — Hook wrappers (G11 · engine boundary only)

**허용 존 (presentation no-touch):**

- `apps/web/src/features/wallet/*` — crypto deposit/withdraw RPC calls
- `apps/web/src/features/earn/*` or missions hook — `rpc_claim_viral_mission`, `rpc_get_viral_mission_status`
- `apps/web/src/lib/rpc.ts` or domain wrappers — **기존 패턴 확장**

**금지:** `presentation-import/`, `components/shell` 시각 변경, Lovable paste.

**DoD:** typecheck green · hooks call RPC only · no float money math.

### E12 — Crypto hardening (G12 · optional migration 099)

Only if product requires before launch:

- Extend `_assert_rg_deposit_allowed` for USDT **or** parallel `_assert_rg_crypto_deposit_allowed`
- Extend `phase5_gates_test.sql` — crypto create path sanctions gate
- New file: `supabase/migrations/20260616000099_engine100_crypto_rg.sql` (example slot)
- `supabase db reset` → `test:sql` → remote push → `lock:migrations`

---

## 6. 핵심 파일 맵

| 용도 | 경로 |
|------|------|
| **Frozen migrations** | `097` `098` + `088`–`096` — **do not edit** |
| **Next migration slot** | `supabase/migrations/20260616000099_*.sql` |
| Migration lock | `supabase/migrations.lock.json` (99 total) |
| Types | `packages/shared-types/src/database.types.ts` |
| Crypto migration | `supabase/migrations/20260615000097_engine100_crypto_rails.sql` |
| Viral migration | `supabase/migrations/20260615000098_engine100_viral_missions.sql` |
| Deposit tests | `supabase/tests/phase5_deposit_test.sql` (tests 4–5 crypto) |
| Reward tests | `supabase/tests/reward_conservation_test.sql` (test 4 viral) |
| Grant inventory | `supabase/tests/grants_rls_inventory_test.sql` |
| i18n | `packages/i18n/src/locales/{ko,en}.json` |
| Wallet hooks (extend) | `apps/web/src/features/wallet/`, `domain/wallet.ts` |
| Operator checklist | `setup/MANUAL_TASKS.md` |
| Launch status | `docs/CURRENT_STATUS.md` |
| Work log (append only) | `docs/WORK_LOG_2026-06-14.md` |
| Viral product spec | `docs/LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` §3.2 |
| Quality gates | `docs/QUALITY_GATES.md` |
| E2E lifecycle | `.cursor/rules/77-e2e-lifecycle.mdc`, `scripts/run-e2e.ts` |

---

## 7. 새 채팅 첫 지시 (복붙용)

```text
@docs/ENGINE_100_HANDOFF.md v2 기준으로 PHONARA ENGINE 100 Phase 2를 끝까지 실행해줘.

확정:
- Supabase yocjhjsdwoijfdrehzoq 전권 위임.
- Phase 1 (E0–E6) DONE — 097/098 remote applied, test:sql 41/41, recon green. 재작업 금지.
- 중복 migration/RPC/test/plan 금지. frozen 097–098 편집 금지. 신규는 20260616*.sql부터.
- Lovable/presentation-import UI no-touch. hooks/i18n/packages/SQL만.

현재 복합 ~88–92/100 (엔진). 미착수: G7 p95 측정, G8 operator, G9 build:packages+check:games+check:full, G10 i18n viral/crypto keys, G11 hook wrappers. G12 crypto RG optional.

실행 순서: E7 trading p95 numbers → E8 operator verify → E9 package/full gates → E10 i18n → E11 hooks → E12 optional 099.

세션 시작: bun run cursor:preflight. 무거운 게이트 한 번에 하나. E2E는 bun run test:e2e만, 백그라운드 금지.
세션 끝: bun run clean && bun run check:hygiene && bun run e2e:kill.

완료 시 docs/WORK_LOG_2026-06-14.md append만. 새 로드맵 파일 만들지 말 것.
```

---

## 8. 세션 치트시트 (Cursor 렉 방지)

```bash
# 시작 (필수)
cd c:\Users\PC\Desktop\phonara-gb
bun run cursor:preflight
git status   # clean 기대 (HEAD ff50b6e)
bun run check:migrations

# Supabase CLI (.env BOM 이슈 시)
# scripts/sync-supabase-pat.ps1 후 .env UTF-8 no-BOM 확인
Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process') } }
bunx supabase link --project-ref yocjhjsdwoijfdrehzoq --yes   # if unlinked

# migration 후
supabase db reset
bun run test:sql

# remote 확인
bunx supabase migration list --linked
bunx supabase db lint --linked --level error
bun run check:advisors

# types regen (UTF-8 필수 — PowerShell > 리다이렉트 금지)
$content = (bunx supabase gen types typescript --linked 2>&1 | Out-String)
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("$PWD\packages\shared-types\src\database.types.ts", $content.TrimEnd(), $utf8)

# 종료 (필수)
bun run e2e:kill          # ports 3000–3002 free
bun run clean
bun run check:hygiene
```

**터미널 충돌 금지:** `check:full` + `test:e2e` + `build` 동시 실행 금지 · hung E2E → Ctrl+C once → `e2e:kill`.

**메타데이터 정리 (선택):** `bun run cursor:clean-metadata -- --apply` — repo 외 transcript/terminal log (~2MB).

---

## 9. 금지 목록

- ❌ `ENGINE_100_ROADMAP.md` 등 병렬 계획서
- ❌ frozen migration **편집** (088–098)
- ❌ duplicate test files — **extend** existing `phase5_*`, `reward_conservation_test.sql`
- ❌ conservation test 약화
- ❌ `SUPABASE_SERVICE_ROLE_KEY` in Vite
- ❌ presentation-import / Lovable visual paste
- ❌ CLOB scope creep

---

## 10. Git & 커밋 이력 (Phase 1)

```
ff50b6e docs: add Lovable Zenith handoff and platform contracts
5a939bb feat(engine): add crypto rails and viral missions (ENGINE 100)
2d2547e feat(casino): add four games, integration factory, and smoke E2E
```

**Working tree:** clean (2026-06-14 세션 종료 시점).

---

## 11. 트랜스크립트 (맥락 복원)

- Phase 1 감사·실행: prior chat + `WORK_LOG` §8
- Phase 1 구현 커밋: `5a939bb`
- Cursor 정리 커밋: `ff50b6e`

---

*PHONARA ENGINE 100 Handoff · **v2** · 2026-06-14 · remote/local through **098** · Phase 2 = E7–E12 · next migration slot **099+ (`20260616*`)***
