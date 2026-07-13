# Pillar 4 — Backend (Edge Functions · PostgREST RPC 표면 · 에러/권한 패턴)

> **감사일:** 2026-07-13 · **READ-ONLY** — 코드 정적 검토 + config 실측
> **Baseline:** Phase 1 §11 · [`PLATFORM_AUDIT_REFERENCE.md`](../PLATFORM_AUDIT_REFERENCE.md) §9–§10

## 점수

| 항목 | 점수 |
|------|-----:|
| **Backend** | **85 / 100** (Strong) |

감점 근거: 시장 데이터 공급(provider missing_config · odds ingest 중단)이라는 운영 gap이 backend 표면 뒤에 남아 있음(코드 결함 아님 — H-03/H-05 UI fail-closed로 마감, 공급 복구는 운영 큐). 인증·관측·에러 계약 패턴 자체는 세계 수준.

## 1. Edge Functions — 11개 (2026-07-13 디스크 실측)

| 함수 | `verify_jwt` (config.toml) | 역할 |
|------|------|------|
| `price-feed` | true | oracle 가격 cron worker |
| `usdt-krw-feed` | true | 환율 feed |
| `crypto-chain-watcher` | true | 입금 체인 감시 |
| `derive-crypto-address` | true | HD 주소 파생 |
| `crypto-withdraw-broadcast` | true | 출금 브로드캐스트 |
| `crypto-sign` | true | 서명 |
| `notification-dispatch` | true | 알림 발송 |
| `ops-notify` | true | ops pager (ntfy/telegram/web-push) |
| `pg-bank-webhook` | **false** — PG HMAC 검증 (`pg-webhook-auth.ts`) | 은행 webhook |
| `siwe-auth` | **false** — 서명 in-function 검증 · body user_id 거부(M-04 fix) | 지갑 로그인 |
| `product-analytics` | **false** — HMAC(IP) dual-bucket rate limit in RPC (M-04 fix) | 분석 ingress |

## 2. 인증·보안 패턴 (`_shared/` 정적 검토)

| 모듈 | 패턴 | 판정 |
|------|------|------|
| `service-auth.ts` | layered service-role gate — Bearer 토큰을 `SUPABASE_SERVICE_ROLE_KEY`와 **SHA-256 constant-time 비교** → 실패 시 JWT claims `role=service_role` fallback → 403 | 우수 (timing-safe) |
| `pg-webhook-auth.ts` | PG HMAC 서명 검증 + `pg_webhook_replay` 테이블 (replay 방어) | 우수 |
| `service-ingress.ts` | `service_ingress_rate_buckets` — anon ingress HMAC(IP)+resource dual bucket (M-04 R3d) | 우수 |
| `edge-observability.ts` | `classifyEdgeOpsOutcome` — job 완료와 provider/circuit 부분 실패 분리 (H-04 R4 fix — false-green 제거) + vitest | 우수 |
| CORS | 함수 코드에 `Access-Control-Allow` 헤더 0건 — 브라우저 직접 호출 함수(siwe-auth 등)는 Supabase gateway 기본 CORS에 의존 | 주의 — 커스텀 헤더 필요 시 명시 필요 (`UNVERIFIED` 런타임 preflight) |

## 3. PostgREST RPC 표면 · 에러 계약

| 항목 | 관찰 | 근거 |
|------|------|------|
| 단일 진입점 | `callRpc<N>` typed wrapper (`apps/web/src/lib/rpc.ts`) — `RpcName`/`RpcArgs` generated types로 정적 증명 · `as never` cast 부채는 R7에서 0 (`check:rpc-type-hygiene`) | rpc.ts:70-79 |
| 에러 코드 | 안정 UPPER_SNAKE 11종 (`UNAUTHENTICATED` · `INSUFFICIENT_BALANCE` · `MARKET_HALTED` …) → `RpcError.i18nKey` = `error.<CODE>` 번역 — raw SQL 문자열 사용자 비노출 | rpc.ts:20-45 · `translate-error.ts` |
| 권한 | client `rpc_*`는 `auth.uid()`/`_is_admin()` guard · internal `_*` helper는 anon/authenticated REVOKE (R3b 재고정) · admin high-risk는 AAL2 step-up | Registry H-02/M-06 · migrations `*_aal2_*` |
| Rate limiting | `rpc_rate_limit_buckets`/`configs` 테이블 + anon ingress dual bucket | Phase 1 §11 · M-04 |
| Anon EXECUTE 표면 | 8 definer (공개 read 전용 — [`02_DATABASE.md`](02_DATABASE.md) §2.1) | advisor 실측 |

## 4. Cron · queue · ops desks

| 항목 | 관찰 |
|------|------|
| `pg_cron` + `pg_net` | 설치 확인 (Reference §9.6) — price-feed/liquidation/notification cron |
| `edge_ops_events` | 24h당 주요 job 각 1,440건 기록 (Reference §10.7) — R4 이후 상태 enum 확장으로 부분 실패 반영 |
| Admin queue desks | `/queues` · `/deposits` · `/withdrawals` · `/sports` 등 32 desk — exception queue 중심 설계 (rule 50 부합) |
| Ops alert | `ops_alert_queue` + EXT-01 dry-fire 6/6 (R4 VERIFIED_FIXED) |

## 5. Finding (Pillar 4)

| ID | 심각도 | 내용 |
|----|--------|------|
| SA-05 | LOW | 브라우저 직접 호출 Edge 함수(siwe-auth · product-analytics)의 CORS가 gateway 기본값 의존 — 커스텀 도메인/헤더 시나리오 런타임 preflight **UNVERIFIED** |
| (링크) | — | 시장 공급 운영 gap: crypto provider `missing_config` 2/2 · sports odds ingest 중단 — Registry H-03/H-05 (UI fail-closed VERIFIED_FIXED · 공급 복구는 운영 큐) |

## 6. NOT VERIFIED

- Edge 함수 런타임 응답 (배포본 invoke 미실행)
- cron job 현재 성공률 (2026-07-12 Reference 24h 신호로 대체)
