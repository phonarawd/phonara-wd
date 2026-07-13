# ADR-019: Identity · Support · Growth Intelligence (E9)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e9-identity-wave`  
> **선행:** E8 GATE `ew-e8-gate-financial` **`[x]` DONE** 2026-07-12  
> **후행:** GATE `ew-e9-gate-identity-support` **`[x]` DONE** 2026-07-12 → Admin `ew-e9-page-admin-support` → E10 UI unlock  
> **코드 계약:** [`ew-e9-identity-support-display-contract.ts`](../../../apps/web/src/domain/ew-e9-identity-support-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §21.1 E9 · ENGINE_GAP_ADR E9 · §32.2

## Context

§12.18 gap 5건(SIWE · support tickets · product analytics · app-install mission · tier leaderboard)은 UI만으로 불가.  
`/support/ticket` · `/tier/leaderboard`는 defer stub · PWA install은 로컬 `appinstalled`만 · viral analytics는 share events `false`.  
Track B E9 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

**영구 제외 유지:** 광고 시청 · 설문 미션 (E0).

## Decision

### 1. 51차 WAVE bundle (non-waivable · 동일 PR)

| 축                  | 판정         | 본 WAVE                                                                                   |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| SIWE wallet login   | **신규**     | `siwe_challenges` · `user_wallet_identities` · challenge/complete RPCs · edge `siwe-auth` |
| Support tickets     | **신규**     | `support_tickets` · user create/list/get · admin list/resolve                             |
| Product analytics   | **신규**     | `product_analytics_events` · record · admin aggregate                                     |
| App-install mission | **신규**     | `viral_mission_code=app_install` · attribution · catalog seed                             |
| Tier leaderboard    | **신규**     | `rpc_get_tier_leaderboard` (XP rank · masked names)                                       |
| Live UI / hubs      | **GATE/E10** | WAVE: `identitySupportEngine=true` · live flags `false`                                   |

### 2. SIWE 정본 (non-waivable)

| 항목         | 값                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Spec         | EIP-4361 (SIWE) · chain Closed Beta = `eip155:1` (configurable)                                          |
| Challenge    | `rpc_create_siwe_challenge(p_address, p_chain_id)` — anon+auth · TTL `app_config.siwe_challenge_ttl_sec` |
| Verify       | Edge `siwe-auth` only (secp256k1) — PL/pgSQL crypto **금지**                                             |
| Complete     | `rpc_service_complete_siwe_login` — **service_role only** · consume nonce · upsert identity              |
| Link         | Authenticated may link via edge after verify · unique `(chain_id, address)`                              |
| Session      | Edge mints/links Supabase Auth user (Admin API) — WAVE engine path · **login UI live = E10**             |
| Feature kill | `feature_siwe_login_enabled`                                                                             |

**RPCs:** `rpc_create_siwe_challenge` · `rpc_service_complete_siwe_login` · `rpc_list_wallet_identities`

### 3. Support tickets 정본 (non-waivable)

| 항목         | 값                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- |
| Table        | `support_tickets` — category · subject · body · status · resolution                           |
| Status       | `open` · `in_progress` · `resolved` · `closed`                                                |
| User         | own rows only (RLS) · create/list/get                                                         |
| Admin        | `rpc_admin_list_support_tickets` · `rpc_admin_resolve_support_ticket` (AAL2 · reason · audit) |
| Idempotency  | `rpc_request_idem` on create                                                                  |
| Feature kill | `feature_support_tickets_enabled`                                                             |

**RPCs:** `rpc_create_support_ticket` · `rpc_list_support_tickets` · `rpc_get_support_ticket` · admin list/resolve (names pinned by Admin beginner contract)

### 4. Product analytics 정본 (non-waivable)

| 항목      | 값                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------- |
| Table     | `product_analytics_events` append-only                                                            |
| Allowlist | `app_config.product_analytics_event_allowlist` (JSON array)                                       |
| PII       | properties may not include email · wallet · balances · tokens                                     |
| Consent   | marketing consent required when `user_id` present                                                 |
| Admin     | `rpc_admin_get_product_analytics` · viral analytics `share_events_available=true` when rows exist |
| Money     | **원장 이동 0**                                                                                   |

**RPCs:** `rpc_record_product_analytics_event` · `rpc_admin_get_product_analytics`

### 5. App-install attribution mission 정본 (non-waivable)

| 항목        | 값                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Enum        | `viral_mission_code` += `app_install` (별도 enum migration 선행)                                               |
| Reward      | `viral_app_install_reward_phon` · once · window `lifetime:once`                                                |
| Attribution | `app_install_attributions` UNIQUE(user_id)                                                                     |
| Claim       | `rpc_record_app_install_attribution` → `_grant_viral_mission` · or `rpc_claim_viral_mission` after attribution |
| Catalog     | `viral:app_install` · exposure=`hidden` until E10 growth UI                                                    |
| Abuse       | low reward · once/account · rate limit — browser `appinstalled` ≠ strong attestation                           |
| 영구 제외   | ad_watch · survey                                                                                              |

### 6. Tier leaderboard 정본 (non-waivable)

| 항목       | 값                                                        |
| ---------- | --------------------------------------------------------- |
| RPC        | `rpc_get_tier_leaderboard(p_limit)`                       |
| Score      | `user_earn_vip.xp DESC, user_id ASC`                      |
| Cap        | 1–100 (default 50)                                        |
| Display    | `_cms_mask_display_name` · tier · xp · is_self · self row |
| Money      | **원장 이동 0** — read-only                               |
| Fake ranks | **금지**                                                  |

### 7. UI unlock (WAVE vs GATE/E10)

| 단계                                   | 내용                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **본 WAVE**                            | ADR + migrations + RPCs + SQL + edge `siwe-auth` + display contract · `identitySupportEngine=true` |
| **GATE** `ew-e9-gate-identity-support` | `stack:push-remote` · advisor 0 · SQL Σ=0 (CI)                                                     |
| **Admin** `ew-e9-page-admin-support`   | `/admin/support` desk                                                                              |
| **E10**                                | `/support/ticket` · `/tier/leaderboard` · SIWE login surface · app-install mission tab live        |

## Consequences

- WAVE에서 `/support/ticket` · `/tier/leaderboard` · SIWE login CTA live **금지**
- 광고·설문 mission code/catalog **금지**
- SIWE plaintext signature 재사용 · challenge replay = FAIL
- Giftcard/P2P remigration = FAIL (본 WAVE 범위 밖)
- Remote apply = GATE

## Verification

| Gate   | 기대                                                                      |
| ------ | ------------------------------------------------------------------------- |
| SQL    | `ew_e9_identity_support_test.sql` E9-0..E9-5 · CI sql authoritative (G13) |
| Vitest | `ew-e9-identity-support-display-contract`                                 |
| Remote | GATE: `stack:push-remote` · advisor 0 ERROR                               |

## Status

Accepted — 2026-07-12 · todo `ew-e9-identity-wave`
