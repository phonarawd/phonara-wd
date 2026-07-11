# ADR-017: Casino Live — Progressive Rounds · Live Crash · PF Seed Controls (E23)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e23-casino-live-wave`  
> **선행:** E22 UI `ew-e22-ui-sports-parity-unlocks` **`[x]` DONE** 2026-07-12  
> **후행:** GATE `ew-e23-gate-casino-live` **`[x]` DONE** 2026-07-12 → UI `ew-e23-ui-casino-live-unlocks` **`[x]` DONE** 2026-07-12 → `ew-e8-financial-wave`  
> **코드 계약:** [`ew-e23-casino-live-display-contract.ts`](../../../apps/web/src/domain/ew-e23-casino-live-display-contract.ts)  
> **스펙 정본:** Plan §23.2.1 → §23.9 · 51차 WAVE merge (ADR+progressive+live crash+PF)

## Context

P10 Casino는 **one-shot 원자 정산** + **replay 연출**로 닫혔다 (§23.2.1).  
Stake급 패리티 잔여(라이브 crash · 단계형 mines/hilo/blackjack · PF seed rotation/nonce)는 Track B **E23만** 엔진 신규로 연다.  
Track A에서 fake 중간 cash-out · 공유 카운트다운 흉내 = FAIL.

## Decision

### 1. 51차 WAVE bundle (non-waivable · 동일 PR)

| 축                 | 판정        | 본 WAVE                                                                                                                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Progressive rounds | **신규**    | `rpc_progressive_start` · `rpc_progressive_step` · `rpc_progressive_cashout` · `rpc_sweep_stale_progressive_sessions`                                        |
| Live crash         | **신규**    | 공유 라운드 · `rpc_live_crash_get_current` · `rpc_live_crash_place_bet` · `rpc_live_crash_cashout` · `rpc_live_crash_advance` · realtime `live_crash_rounds` |
| PF seed controls   | **신규**    | `user_game_pf_state` · `rpc_get_game_pf_state` · `rpc_set_game_client_seed` · `rpc_rotate_game_server_seed` · place `p_use_account_pf` · nonce increment     |
| One-shot 12종      | **EXISTS**  | `rpc_place_game_bet` (nonce=1 경로) — **의미론 유지** · remigration 금지(가드 플래그만 추가)                                                                 |
| Server autobet     | **비도입**  | UI queue만 · 서버 autobet RPC **0**                                                                                                                          |
| Live UI            | **GATE/UI** | WAVE: `LAUNCH_GATES.casinoLiveEngine=true` · `casinoLiveLive=false`                                                                                          |

### 2. Progressive 정본 (mines · hilo · blackjack)

| 항목         | 값                                                                        |
| ------------ | ------------------------------------------------------------------------- |
| Start        | stake lock · `game_rounds` open · secret_state 서버 전용                  |
| Step         | mines cell reveal · hilo guess · blackjack hit/stand/double (single-seat) |
| Mid cash-out | mines/hilo only · blackjack은 핸드 종료 정산                              |
| Timeout      | `rpc_sweep_stale_progressive_sessions` → forfeit (lost · Σ=0)             |
| Money        | unlock/debit stake · credit payout · house/dust · **Σ=0**                 |

### 3. Live crash 정본

| 항목          | 값                                                      |
| ------------- | ------------------------------------------------------- |
| Phases        | `betting` → `flying` → `crashed`                        |
| Crash point   | betting 종료 시 seed로 확정 (hash는 betting 중 공개)    |
| Cash-out      | flying 중 `current_mult < crash` 일 때만                |
| Auto cash-out | place 시 `auto_cashout` · advance tick에서 자동 정산    |
| Scheduler     | `rpc_live_crash_advance` · **service_role only**        |
| Realtime      | `live_crash_rounds` ∈ `supabase_realtime`               |
| Seed column   | crashed 전 `server_seed` REVOKE from anon/authenticated |

### 4. PF seed controls 정본

| 항목                   | 값                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Persist                | `user_game_pf_state` (client_seed · next_nonce · active server seed+hash)                                             |
| Rotate                 | reveal previous · new active · nonce reset 1 · optional new client seed                                               |
| Place (one-shot)       | `p_use_account_pf=true` → **account client_seed + nonce** · round **server seed commitment 유지** · settle 후 nonce++ |
| Progressive/live start | `p_use_account_pf=true` → round를 account server seed+hash로 바인딩 가능                                              |
| Compat                 | `p_use_account_pf=false` → **nonce=1** one-shot (verifier 하위 호환)                                                  |
| UI                     | fairness seed controls = **GATE/UI** (`casinoLiveLive`) — WAVE에서 설정 UI 노출 금지                                  |

### 5. 보존 불변식 (§23.9 · §31.5)

house exposure cap · per-game kill · rate limit · Σ=0 · hash-chain · `@phonara/game-engine` verifyRound — 라이브화가 약화하면 FAIL.

## Consequences

- E23 GATE 전 live/단계형 **UI 노출 FAIL**
- one-shot 게임에 fake 공유 카운트다운 FAIL
- seed rotation 없이 「매 라운드 새 시드」카피 FAIL
- Remote apply = GATE (`stack:push-remote` · advisor 0)
- 후행 E8 Financial 선행 = `ew-e23-ui-casino-live-unlocks`

## Verification

| Gate   | 기대                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| SQL    | `ew_e23_casino_live_test.sql` E23-0..E23-4 · CI sql authoritative (G13)                    |
| Vitest | `ew-e23-casino-live-display-contract`                                                      |
| Remote | GATE **`[x]`**: `stack:push-remote` · advisor 0 · tail `20260711183649_ew_e23_casino_live` |

## Operator sign-off

Cursor Plan todo `ew-e23-casino-live-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR (progressive · live crash · PF).
