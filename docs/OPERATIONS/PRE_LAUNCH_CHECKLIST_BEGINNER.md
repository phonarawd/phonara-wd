# PHONARA 출시 전 확인 체크리스트 (왕초보용)

> **누구용:** operator 1인 · 코딩 경험 거의 없어도 OK  
> **목적:** “지금 출시해도 되나?”를 **체크박스 + 명령어**로 확인  
> **작성:** 2026-07-03  
> **정본 SSOT:** [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)

---

## 30초 요약

| 질문                             | 답                                         |
| -------------------------------- | ------------------------------------------ |
| 엔진(돈·DB·보안) 코어는 끝났나?  | **예** — SQL 99/99 · advisor ERROR 0       |
| 지금 사용자 앱 켜면 서비스 되나? | **아니오** — UI는 Phase D stub (빈 화면만) |
| Closed Beta(제한 실전) 가능?     | **operator 체크 5개** + Admin SOP 실습 후  |
| 정식 출시(일반 사용자)?          | **Phase R UI** + full E2E 후               |

**이 문서 = 출시 전에 operator가 직접 `[ ]` → `[x]` 체크하는 종이.**

---

## 준비 (한 번만)

PowerShell을 연 뒤 **항상** 프로젝트 폴더로 이동:

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
```

| #   | 할 일                                                                                 | 완료 |
| --- | ------------------------------------------------------------------------------------- | ---- |
| P1  | Docker Desktop 설치 (SQL/E2E gate 때만 켬)                                            | [ ]  |
| P2  | `.env`에 `SUPABASE_ACCESS_TOKEN` 있음 (원격 DB 동기화용)                              | [ ]  |
| P3  | [`docs/rebuild/LOWSPEC_RULES.md`](../rebuild/LOWSPEC_RULES.md) 북마크                 | [ ]  |
| P4  | [`FUNDING_RAILS_SOP.md`](FUNDING_RAILS_SOP.md) 한 번 훑기 (KRW·상품권·코인 수동 절차) | [ ]  |

---

## 레벨 0 — “엔진만” (이미 green · 재확인용)

> **의미:** 돈이 새는 버그가 SQL 테스트로 잡히는지 확인. **UI 없어도** 돌릴 수 있음.  
> **시간:** Docker 켜면 약 5~10분 · **한 번에 명령 1개만** (PC 렉 방지)

### L0-A 엔진 패키지 (Docker 불필요 · ~1분)

```powershell
bun run check:engine-demolition:packages
```

| #    | 확인                                | 완료 |
| ---- | ----------------------------------- | ---- |
| 0A-1 | 마지막 줄에 에러 없이 끝남 (exit 0) | [ ]  |
| 0A-2 | packages 테스트 전부 passed         | [ ]  |
| 0A-3 | `check:migrations: OK`              | [ ]  |

### L0-B 엔진 full (Docker 필요 · ~5분)

```powershell
bun run check:engine-demolition:full
```

| #    | 확인                                     | 완료 |
| ---- | ---------------------------------------- | ---- |
| 0B-1 | `All 99 SQL test file(s) passed.`        | [ ]  |
| 0B-2 | 중간에 `ERROR` / `FAIL` 없음             | [ ]  |
| 0B-3 | 끝나면 Docker 자동 종료됨 (`stack:stop`) | [ ]  |

**✅ L0 통과 = “엔진 코어는 출시 전 기준선 OK”** (2026-07-03 기준 이미 1회 green)

---

## 레벨 1 — Closed Beta 전 (제한 실전 · operator 필수)

> **의미:** 실제 돈을 **아주 작은 금액·allowlist**로만 테스트하기 **전**에 할 일.  
> **UI stub이어도 Admin + RPC로 입출금 테스트 가능.**

### 1-A 문서·모드 확인 (코드 실행 없음)

| #    | 확인                                                                                                                            | 완료 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1A-1 | PG-less 모드 이해 — [`ADR/001-pg-less-funding-rails.md`](../PRODUCT/ADR/001-pg-less-funding-rails.md)                           | [ ]  |
| 1A-2 | KRW = **수동 매칭**, 상품권 = **수동 심사** ([`FUNDING_RAILS_SOP.md`](FUNDING_RAILS_SOP.md))                                    | [ ]  |
| 1A-3 | L4 PG webhook **기본 OFF** (켤 거면 operator가 명시 결정)                                                                       | [ ]  |
| 1A-4 | 코인 출금 = signer 없으면 **fail-closed** ([`ADR/002-crypto-custody-signing.md`](../PRODUCT/ADR/002-crypto-custody-signing.md)) | [ ]  |

### 1-B Edge 가벼운 smoke (네트워크 필요 · ~2분)

```powershell
bun run stack:verify-worldno1-edge
bun run stack:smoke-pg-webhook-hmac
```

| #    | 확인                                                   | 완료 |
| ---- | ------------------------------------------------------ | ---- |
| 1B-1 | `stack:verify-worldno1-edge` exit 0                    | [ ]  |
| 1B-2 | `stack:smoke-pg-webhook-hmac` exit 0 (L4 켤 때만 필수) | [ ]  |

### 1-C 원격 DB 동기화 (migration 바꾼 적 있으면)

```powershell
bun run stack:push-remote
bun run check:advisors
```

| #    | 확인                                              | 완료 |
| ---- | ------------------------------------------------- | ---- |
| 1C-1 | `stack:push-remote` — pending 0 / parity OK       | [ ]  |
| 1C-2 | `check:advisors` — **ERROR 0** (WARN은 있어도 OK) | [ ]  |

### 1-D Admin 1인 운영 리허설 (스테이징/로컬)

| #    | 할 일                                                                | 완료 |
| ---- | -------------------------------------------------------------------- | ---- |
| 1D-1 | KRW 입금 요청 → **수동 match** → 잔액 반영 확인                      | [ ]  |
| 1D-2 | KRW 출금 approve → **수동 송금** → sent mark                         | [ ]  |
| 1D-3 | 상품권 요청 → approve/reject + audit reason                          | [ ]  |
| 1D-4 | reject 시 **돈이 안 들어갔는지** 확인                                | [ ]  |
| 1D-5 | exception queue / ops dashboard 열림 (`rpc_admin_get_ops_dashboard`) | [ ]  |

### 1-E Prod real-money rehearsal (실제 돈 — **operator 승인 후만**)

> ⚠️ **되돌리기 어려움.** 소액 · allowlist · 통화 cap 고정 후 진행.

시나리오: [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md)

| #    | exit criteria                          | 완료 |
| ---- | -------------------------------------- | ---- |
| 1E-1 | prod reconciliation_log match          | [ ]  |
| 1E-2 | notification 유실 0 (claim two-phase)  | [ ]  |
| 1E-3 | withdrawal duplicate broadcast 0       | [ ]  |
| 1E-4 | provider failure → ops alert           | [ ]  |
| 1E-5 | rollback / system_readonly 절차 리허설 | [ ]  |

**✅ L1 통과 = Closed Beta(제한 실전) GO**

---

## 레벨 2 — 정식 출시 전 (일반 사용자 · Phase R 이후)

> **의미:** 앱 스토어 / 공개 URL 수준. **UI rebuild 없으면 여기까지 갈 수 없음.**

| #    | 확인                                                           | 완료 |
| ---- | -------------------------------------------------------------- | ---- |
| 2-1  | Phase R UI rebuild plan 승인 (`REBUILD_PLAN_v1`)               | [ ]  |
| 2-2  | `/login` · `/wallet` · 5-tab IA — operator visual sign-off     | [ ]  |
| 2-3  | `bun run check:i18n` green (한/영 혼용 없음)                   | [ ]  |
| 2-4  | `bun run check:release` green (테스트 문구·console 없음)       | [ ]  |
| 2-5  | Money E2E — deposit/withdraw/casino/sports **타겟 spec** green | [ ]  |
| 2-6  | `bun run test:e2e` **전체 1회** (CI 또는 operator)             | [ ]  |
| 2-7  | `bun run check:full` **1회** (CI 또는 operator)                | [ ]  |
| 2-8  | 코인 출금: `CRYPTO_SIGN_ENDPOINT` 또는 승인된 signer 연결      | [ ]  |
| 2-9  | Auth: leaked password protection (Supabase dashboard)          | [ ]  |
| 2-10 | 법무·KYC·AML·상품 고지 — operator/legal sign-off               | [ ]  |

**✅ L2 통과 = 정식 출시 GO (product 관점)**

---

## 레벨 3 — 출시 후에도 OK (지금 당장 0일 필요 없음)

| 항목                            | 언제                   |
| ------------------------------- | ---------------------- |
| `auth_rls_initplan` WARN 11건   | 트래픽 올린 뒤 DB 튜닝 |
| unused index INFO ~157          | 운영 쿼리 evidence 후  |
| `price-feed` ingest idempotency | 별도 migration         |
| Trading `_apply_funding` SQL    | trading slice          |
| Temporal.io                     | ADR 없이 도입 안 함    |

---

## 실패했을 때 (왕초보 복구 순서)

1. **명령이 멈춘 것 같으면** — 3분 기다린 뒤 `Ctrl+C` **1번**
2. **포트/Docker 꼬임** — `bun run cursor:emergency-reset`
3. **E2E 후** — `bun run e2e:kill` → `bun run check:hygiene`
4. **Cursor 렉** — Docker Desktop 끄기 · Chrome 탭 줄이기 · Cursor 재시작
5. **에러 내용 모르면** — 터미널 **마지막 20줄** 복사해서 AI/CI에 붙이기

**절대 금지:** `supabase db push` 수동 · migration 파일 임의 수정 · gate 2개 동시 실행

---

## 용어 10초 사전

| 용어                  | 뜻                                                |
| --------------------- | ------------------------------------------------- |
| **Σ=0**               | 돈 합계가 맞음 (유저+시스템 계정 conservation)    |
| **test:sql**          | DB 돈/보안 테스트 99개 파일                       |
| **advisor ERROR 0**   | Supabase 보안 스캔 치명 오류 없음                 |
| **Phase D stub**      | UI 삭제 후 “엔진만 남음” 빈 화면                  |
| **Phase R**           | UI 새로 만드는 단계                               |
| **Closed Beta**       | 소수·소액·allowlist 실전                          |
| **fail-closed**       | 설정 없으면 **멈춤** (돈 새는 것보다 안전)        |
| **stack:push-remote** | 로컬 migration을 원격 Supabase에 적용 (정본 명령) |

---

## 한 페이지 판정표 (출시 전 마지막에 보기)

| 목표            | 최소 조건         | 지금(2026-07-03)  |
| --------------- | ----------------- | ----------------- |
| **엔진만 OK**   | L0 green          | ✅ (재확인: L0-B) |
| **Closed Beta** | L0 + L1 전부      | ⏳ L1 operator    |
| **정식 출시**   | L0 + L1 + L2 전부 | ❌ UI·E2E·signer  |

---

## 교차 참조

| 문서                                                                                | 용도             |
| ----------------------------------------------------------------------------------- | ---------------- |
| [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)                             | 엔진 마감 정본   |
| [`OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md)                                    | gate 명령 모음   |
| [`FUNDING_RAILS_SOP.md`](FUNDING_RAILS_SOP.md)                                      | 입출금 수동 절차 |
| [`P13_T0A_PROD_PREFLIGHT.md`](P13_T0A_PROD_PREFLIGHT.md)                            | P13 T0-A prod checklist |
| [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) | CB 시나리오      |
| [`LOWSPEC_RULES.md`](../rebuild/LOWSPEC_RULES.md)                                   | 8GB PC 운영      |

---

**마지막 확인일:** \***\*\_\_\_\*\***  
**operator 서명:** \***\*\_\_\_\*\***  
**다음 gate:** [ ] L0-B [ ] L1 [ ] L2
