# 플랫폼 감사 A — 라이브 DB 가드 / GRANT / REVOKE

> **일자:** 2026-07-08 · **범위:** Section A (읽기 전용) · **B 착수 전 정본**  
> **판정 태그:** `PASS` / `FAIL` / `P2관찰` / `UNVERIFIED` (`30-audit-discipline`)

---

## 실행 요약

| 항목                                       | 로컬 Docker (세션 1)             | 원격 prod (MCP)       | 최종 판정       |
| ------------------------------------------ | -------------------------------- | --------------------- | --------------- |
| `check:guard-coverage`                     | **PASS** 189 rpc, gap 0          | —                     | **PASS** (로컬) |
| `grants_rls_inventory` privilege 핀 ~100건 | mismatch **0** (함수 68 + table) | sample mismatch **0** | **PASS**        |
| RLS 전 테이블 ON                           | **PASS** (rls_off=∅)             | **PASS** (rls_off=∅)  | **PASS**        |
| anon 테이블 write GRANT                    | **PASS** (empty)                 | **PASS** (empty)      | **PASS**        |
| auth 비허용 테이블 write                   | **PASS** (profiles/push만)       | —                     | **PASS** (로컬) |
| 내부 `_*` client EXECUTE                   | **3건** (의도/관찰)              | **3건** 동일          | **P2관찰**      |
| Security advisor ERROR                     | —                                | **0**                 | **PASS**        |
| `system_readonly`                          | **true** (로컬)                  | **false** (prod)      | **P1 로컬만**   |

**재현 스크립트 (Docker ON 후):**

```powershell
bun run tsx scripts/audit/replay-grants-inventory.ts
bun run tsx scripts/audit/audit-a-db-guards.ts
bun run check:guard-coverage
bun run tsx scripts/check/guard-coverage-report.ts
```

**세션 2:** Docker Desktop 미기동 → 로컬 재실행 **UNVERIFIED**. 원격 MCP로 prod 교차검증 완료.

---

## 1. `rpc_*` 라이브 전수 (로컬 · pg_get_functiondef)

| 지표                          | 값                      | 근거                                    |
| ----------------------------- | ----------------------- | --------------------------------------- |
| `rpc_*` 총계                  | **189** (오버로드 포함) | `check:guard-coverage` stdout           |
| prod `rpc_*`                  | **187**                 | MCP `execute_sql` 2026-07-08            |
| authenticated EXECUTE         | **145**                 | live SELECT                             |
| anon EXECUTE                  | **7** (read-only 공개)  | `grants_rls_inventory_test.sql:341–354` |
| balance-moving (ground-truth) | **48**                  | `guard-coverage-report.ts`              |

**가드 gate:** `scripts/check/guard-coverage.ts` — **0 actionable gaps**.

**Admin AAL2 (allowlist 제외 gap):** 로컬 **0**.  
allowlist exempt 8종: `guard-coverage-allowlist.ts:14–56` (read-only admin + `rpc_liquidate_position`).

---

## 2. GRANT / REVOKE 매트릭스

### 2.1 `grants_rls_inventory_test.sql` 핀 재현

- **함수 EXECUTE ASSERT 68건** — live `has_function_privilege` 대조 → **mismatch 0** (로컬 세션 1).
- **전체 핀 (table+function)** — `scripts/audit/replay-grants-inventory.ts`가 SQL 파일에서 파싱·재현 (Docker ON 시 일괄 실행).

### 2.2 루프 가드 (inventory DO block 동치 SELECT)

| 검사                                                 | 로컬 | prod |
| ---------------------------------------------------- | ---- | ---- |
| RLS disabled public tables                           | ∅    | ∅    |
| anon INSERT/UPDATE/DELETE/TRUNCATE                   | ∅    | ∅    |
| authenticated write (profiles/push_subscriptions 외) | ∅    | —    |

근거: `grants_rls_inventory_test.sql:136–175`, `356–368`.

### 2.3 내부 `_*` 헬퍼 client 노출 (273개 중)

| 함수                                    | anon | auth | SECURITY DEFINER | 비고                             |
| --------------------------------------- | ---- | ---- | ---------------- | -------------------------------- |
| `_is_admin()`                           | Y    | Y    | Y                | anon → `auth.uid()` NULL → false |
| `_game_bets_client_rows`                | N    | Y    | Y                | casino client view helper        |
| `_game_bets_client_result_payload(...)` | N    | Y    | Y                | casino client view helper        |

inventory **핀** `_fmt6`, `_fill_house_spot_order`, funding helpers → auth **REVOKE** 확인 (`:444–504`).

**P2관찰:** Supabase advisor `anon_security_definer_function_executable` WARN 147건 (prod) — `_is_admin` anon EXECUTE 포함. ERROR **0**.

---

## 3. balance-moving 가드 상세

### 3.1 system_live / AAL2

- **system_live gap (allowlist 제외):** **0** — callee/`_place_open_order_common` 체인 또는 allowlist.
- **auth.uid() 누락 (auth + balance-moving):** **0** (로컬).

### 3.2 `_enforce_rate_limit` 미포함 (P2 hardening 후보 · 9건)

로컬 balance-moving + authenticated, admin 제외:

- `rpc_lock_wallet`, `rpc_claim_welcome_bonus`, `rpc_request_withdrawal`
- `rpc_cashout_sports_bet`, `rpc_claim_repeatable_mission`
- `rpc_admin_void_game_bet`, `rpc_void_sports_bet`, `rpc_reject_withdrawal`, `rpc_admin_manual_wallet_adjust`

현재 gate 필수 조건 **아님** — abuse rate-limit 표준화는 B 이후 또는 F 승인 시.

---

## 4. 로컬 운영 상태 — `system_readonly` (P1 · 로컬 dev)

**로컬 `app_config` (2026-07-07):**

```
system_halt=false
system_readonly=true
```

**`reconciliation_log` 최근 (로컬):**

| check_type  | currency | is_match | delta        | triggered_halt |
| ----------- | -------- | -------- | ------------ | -------------- |
| wallet      | PHON     | f        | 3000.000000  | t              |
| global_zero | PHON     | f        | 3000.000000  | t              |
| wallet      | USDT     | f        | 10000.000000 | t              |
| global_zero | USDT     | f        | 10000.000000 | t              |

**원인 (확정):** `scripts/seed-local-trade-dev.ts:212–228` — 지갑 직접 UPDATE (ledger leg 없음) → `rpc_run_reconciliation` (`:283`)이 mismatch 감지 → readonly 자동 설정.  
**복구 로직 존재:** `:286–288` 에서 readonly 재해제 — seed **완주 시** false. 현재 readonly=true = seed 미재실행 또는 reconciliation 재발동.

**prod:** `system_readonly=false` (MCP 2026-07-08).

**수정 (F 승인):** `bun run seed:local-trade-dev` 재실행 또는 operator 승인 UPDATE.

---

## 5. 로컬 ↔ prod parity 관찰

| 항목                           | 로컬                    | prod                | 심각도                       |
| ------------------------------ | ----------------------- | ------------------- | ---------------------------- |
| `rpc_*` count                  | 189                     | 187                 | P3 (오버로드/적용 시차 가능) |
| `rpc_update_oracle_price` AAL2 | **있음** (세션1 matrix) | **없음** (live def) | **P1 후보**                  |
| `system_readonly`              | true                    | false               | P1 (로컬 dev only)           |

**prod `rpc_update_oracle_price`:** `_is_admin()` 있으나 `_assert_admin_aal2()` **없음** · allowlist **미등록** · authenticated EXECUTE · oracle/market halt side-effect.  
→ 로컬 gate green이어도 **원격 MFA gap 가능**. F 단계: migration/AAL2 주입 + `stack:push-remote` (**operator RED STOP**).

---

## 6. UNVERIFIED (B 착수 전 operator 선택)

| 항목                                            | 이유                                    |
| ----------------------------------------------- | --------------------------------------- |
| 로컬 `replay-grants-inventory.ts` 전체 table 핀 | Docker Desktop OFF (세션 2)             |
| AAL1/halt **런타임** probe                      | `guard-audit.ts` — app_config 쓰기 필요 |
| `test:sql` grants inventory DO block            | G13 — CI **sql** job authoritative      |

---

## 7. B 착수 게이트

- [x] A 가드/GRANT **P0 FAIL 없음** (로컬 gate + prod advisor ERROR 0)
- [x] A 정본 문서 + 재현 스크립트 (`scripts/audit/*`)
- [ ] 로컬 Docker ON 시 `replay-grants-inventory.ts` 1회 green (operator, ~2분)
- [ ] prod `rpc_update_oracle_price` AAL2 — F/RED STOP 큐 등록 (B와 병행 조사 가능)

**B (`audit-contracts`) 착수 가능** — 클라이언트 RPC 시그니처·에러 매핑·realtime publication은 코드/SQL 읽기 전용으로 진행.

---

## 교차 참조

- Plan: `플랫폼_전수_무결점_감사_3866525d.plan.md` §A
- Gate: `scripts/check/guard-coverage.ts` · `guard-coverage-allowlist.ts`
- Inventory: `supabase/tests/grants_rls_inventory_test.sql`
- JSON 산출: `scripts/audit/last-a-db-guards-report.json` (Docker ON 후 생성)
