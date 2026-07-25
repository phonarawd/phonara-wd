# PHONARA Platform Constitution (Authority Charter)

> **역할:** 권한 서열 · 정본 지도 · non-negotiable index  
> **역할이 아닌 것:** 실행 큐 · surface/todo 목록 · Phase R 작업 지시  
> **상태:** Active (T8 · `const-t8-operator-audit-matrix` CLOSED) · 2026-07-24  
> **범위:** 문서 Authority map only — `supabase/migrations` · `packages/*-engine` · RPC/로직 변경 **0**  
> **세션 진입점 백링크:** `.cursorrules` · `AGENTS.md` · 본 Charter 하위 정본 헤더(`PRODUCT_PRINCIPLES` · `DESIGN_PRINCIPLES` · POS · `PRODUCT_EXPERIENCE_CANON` · `ENGINE_BOUNDARY`)

---

## 1. 권한 서열 (Authority map)

아래 계층은 **위에서 아래로** 해석한다. 하위 문서가 상위와 충돌하면 상위를 따른다.  
**실행 순서(무엇을 지금 할지)** 는 §2의 실행 큐만 따른다 — 본 헌법은 그 큐를 대체하지 않는다.

```text
PLATFORM_CONSTITUTION.md          ← 본 문서 (Authority Charter)
  ├── ACTIVE_WORK_SSOT + REBUILD_PLAN_v1     ← 실행 큐 (유일한 구현 순서)
  ├── ENGINE_BOUNDARY + MONEY_CONSERVATION_FORMULA + ADR-0002/0006
  ├── PRODUCT_PRINCIPLES + PLATFORM_NARRATIVE + COPYWRITING
  ├── PRODUCT_EXPERIENCE_CANON + DESIGN_CHARTER + ADR-009 (brand DNA)
  ├── DESIGN_PRINCIPLES + UNIFIED_UX + surface *_UX_CANON
  ├── PRODUCT_OPERATING_SYSTEM               ← Landing CVR 문서 계층만
  └── .cursorrules · AGENTS.md · .cursor/rules · hooks
```

| 계층                  | 정본                                                                                                                                                                                                                                                    | 하는 일                                  | 하지 않는 일                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| **A. Charter**        | 본 문서                                                                                                                                                                                                                                                 | 권한 서열 · 정본 포인터 · 깨진 링크 정책 | todo 배정 · surface 구현 지시   |
| **B. Execution**      | [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) · [`../PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)                                                                                                                                         | 다음에 할 일 1개 · Phase R 순서          | Authority 재정의                |
| **C. Money / Engine** | [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) · [`MONEY_CONSERVATION_FORMULA.md`](MONEY_CONSERVATION_FORMULA.md) · [`../ADR/0002-engine-freeze.md`](../ADR/0002-engine-freeze.md) · [`../ADR/0006-wallet-sigma-rule.md`](../ADR/0006-wallet-sigma-rule.md) | Σ · freeze · Decimal · ledger            | UI IA · 카피 tone               |
| **D. Product**        | [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) · [`PLATFORM_NARRATIVE_CANON.md`](PLATFORM_NARRATIVE_CANON.md) · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)                                                                                        | 플랫폼 모델 · narrative · copy 정본      | 실행 큐 · Σ 수식                |
| **E. Experience**     | [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) · [`../PRODUCT/DESIGN_CHARTER.md`](../PRODUCT/DESIGN_CHARTER.md) · [`../PRODUCT/ADR/009-digital-aurora-brand-dna.md`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md)                      | Brand DNA · motion · experience          | Money Σ · migration             |
| **F. UX / IA**        | [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) · [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md) · surface `*_UX_CANON.md` · [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)                                                                              | 5탭 IA · surface module                  | 엔진 freeze 예외 부여           |
| **G. Landing POS**    | [`../PRODUCT/PRODUCT_OPERATING_SYSTEM.md`](../PRODUCT/PRODUCT_OPERATING_SYSTEM.md)                                                                                                                                                                      | 랜딩 CVR 문서 계층                       | ACTIVE_WORK 대체 · SSOT 전역 큐 |
| **H. Agent ops**      | `.cursorrules` · `AGENTS.md` · `.cursor/rules/*` · hooks                                                                                                                                                                                                | 세션 진입 · gate · hygiene               | 제품 철학 단독 발명             |

**인덱스·차단 목록 (보조):**

- 문서 목록: [`../DOCS_INDEX.md`](../DOCS_INDEX.md)
- 실행 큐로 읽으면 안 되는 문서: [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md)
- 엔진 상태(재착수 금지): [`../ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)

---

## 2. 실행 큐 ≠ 헌법

| 구분                  | 정본                                                             | 한 줄                          |
| --------------------- | ---------------------------------------------------------------- | ------------------------------ |
| **헌법 (본 문서)**    | `docs/SSOT/PLATFORM_CONSTITUTION.md`                             | 누가/어느 문서가 권한을 갖는지 |
| **실행 큐**           | [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) **만**              | 지금 무엇을 구현하는지         |
| **Phase R 실행 계획** | [`../PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) | Phase R 범위·순서·DoD          |

**비-협상:**

1. 본 헌법을 ACTIVE_WORK 대신 실행 큐로 읽지 않는다.
2. denylist · 엔진 evidence · Demolition batch 표는 **이력/감사**이며 구현 큐가 아니다.
3. POS([`PRODUCT_OPERATING_SYSTEM.md`](../PRODUCT/PRODUCT_OPERATING_SYSTEM.md))는 Landing CVR 문서 계층이며 SSOT 전역 큐를 대체하지 않는다.
4. Cursor Plan YAML `status: completed`만으로 완료를 주장하지 않는다 — ACTIVE_WORK · gate 증거가 우선이다.

---

## 3. Money non-negotiables (링크만 · 수식 재정의 금지)

본 절은 **포인터**다. Σ 수식·게이트는 아래 정본만 수정한다.

| 주제                              | 정본                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| UI ↔ 엔진 경계                    | [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)                             |
| Wallet Conservation Σ 수식        | [`MONEY_CONSERVATION_FORMULA.md`](MONEY_CONSERVATION_FORMULA.md)       |
| Engine Freeze (UI 기간 엔진 동결) | [`../ADR/0002-engine-freeze.md`](../ADR/0002-engine-freeze.md)         |
| Wallet Σ / ledger 규칙            | [`../ADR/0006-wallet-sigma-rule.md`](../ADR/0006-wallet-sigma-rule.md) |
| 엔진 Apex 상태                    | [`../ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)             |

**요약 (재서술 아님 — 상세는 위 문서):**

- Money: `@phonara/money` Decimal · JS `number` 금지
- Ledger: append-only · idempotent · available/locked 명시
- UI: RPC/hook **표시만** · payout/PnL/fee/odds/balance client 재계산 금지
- Supabase 단일 프로젝트: `yocjhjsdwoijfdrehzoq`
- Migration 경로: local `db reset` → `test:sql` Σ=0 · hash-chain → `stack:push-remote` → advisor 0 ERROR

**ADR 경로 주의 (번호 충돌):**

| 인용해야 할 경로                                                                    | 혼동 금지                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`docs/ADR/0002-engine-freeze.md`](../ADR/0002-engine-freeze.md) (Engine Freeze)    | `docs/PRODUCT/ADR/002-crypto-custody-signing.md` (별개 주제) |
| [`docs/ADR/0006-wallet-sigma-rule.md`](../ADR/0006-wallet-sigma-rule.md) (Wallet Σ) | `docs/PRODUCT/ADR/` 3자리 번호 ADR 일반                      |

엔진/Σ ADR을 인용할 때는 항상 **`docs/ADR/000X-*.md` (4자리)** 만 사용한다.

---

## 4. Product / UX canon 지도

새 UX 규칙을 본 문서에 발명하지 않는다. surface 작업 시 해당 canon을 연다.

### 4.1 Product · Narrative · Copy

| 문서                                                             | 역할                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)                 | 플랫폼 모델 · tone zones                                  |
| [`PLATFORM_NARRATIVE_CANON.md`](PLATFORM_NARRATIVE_CANON.md)     | 3 pillars · 5탭 = 동일 스토리 chapter                     |
| [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)                   | 유저 카피 정본 (삭제된 `UX_WRITING_GUIDE` 대체 인용 대상) |
| [`I18N_FIRST.md`](I18N_FIRST.md)                                 | i18n 정책                                                 |
| [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) | 결제/레일 서술                                            |

### 4.2 Experience · Design

| 문서                                                                                               | 역할                            |
| -------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md)                                       | Digital Aurora experience       |
| [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)                                                     | IA · BottomNav 5탭 · shell 원칙 |
| [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                                                       | 공유 interaction / confirm 문법 |
| [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)                                                   | surface module blueprint        |
| [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)                                                   | 외부 reference 역할(복제 금지)  |
| [`../PRODUCT/DESIGN_CHARTER.md`](../PRODUCT/DESIGN_CHARTER.md)                                     | Landing/POS voice · motion      |
| [`../PRODUCT/ADR/009-digital-aurora-brand-dna.md`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md) | Brand DNA ADR                   |

### 4.3 Surface UX canons

| Surface     | Canon                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| Earn / Home | [`EARN_UX_CANON.md`](EARN_UX_CANON.md) · [`HOME_UX_CANON.md`](HOME_UX_CANON.md) |
| Wallet      | [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md)                                      |
| Trade       | [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)                                        |
| Sports      | [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md)                                      |
| Casino      | [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md)                                      |
| Auth        | [`AUTH_UX_CANON.md`](AUTH_UX_CANON.md)                                          |
| Admin       | [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)                                        |
| Onboarding  | [`ONBOARDING_JOURNEY_CANON.md`](ONBOARDING_JOURNEY_CANON.md)                    |

**IA 한 줄 (DESIGN_PRINCIPLES와 동일):** BottomNav 5탭 = `/home` · `/wallet` · `/trade` · `/sports` · `/casino`.  
Narrative 3 pillars와 5탭은 [`PLATFORM_NARRATIVE_CANON.md`](PLATFORM_NARRATIVE_CANON.md)가 「동일 스토리 5 chapter」로 정합한다 — route 모순이 아니다.

---

## 5. 깨진 링크 정책

| 정책                       | 내용                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Demolition DELETE 존중** | Batch 11 등으로 삭제된 문서를 내용 추측으로 **재생성하지 않는다**                                                                                                                                        |
| **Retarget**               | 활성 SSOT가 삭제 파일을 인용하면 **현행 정본**으로 링크를 바꾼다 (예: `UX_WRITING_GUIDE` → [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md))                                                               |
| **Generated SSOT**         | `DISPLAY_DATA_CONTRACT` · `ROUTE_CANONICAL_REGISTRY` · `UI_INVENTORY` · `FREEZE_MANIFEST` · `ENGINE_INTEGRATION_PLAYBOOK` 은 generator(`generate:ssot-freeze-manifest`)로만 복구 — 핸드롤 장문 창작 금지 |
| **denylist**               | [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md) 목록을 live 실행 큐로 복원·인용하지 않는다                                                                                                    |
| **본 Charter**             | 링크는 **실존 경로만** 수록한다. 없는 파일을 「곧 생길 예정」으로 넣지 않는다                                                                                                                            |

---

## 6. Engine freeze 포인터

| 항목       | 정본                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Freeze ADR | [`../ADR/0002-engine-freeze.md`](../ADR/0002-engine-freeze.md)                                     |
| Boundary   | [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)                                                         |
| Apex 상태  | [`../ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) — **`[x] FULLY CLOSED`** · 구현 큐 아님 |

**기본값:** 신규 `supabase/migrations` · `packages/*-engine` 기능 · RPC/RLS 확장 **금지**.  
예외는 operator RED STOP + Track B/`ew-e*` 등 ACTIVE_WORK에 명시된 트랙만.  
UI는 엔진 값을 표시할 뿐 freeze를 우회하지 않는다.

---

## 7. LOWSPEC redirect 포인터

| 경로                                                         | 상태                                | 역할                                 |
| ------------------------------------------------------------ | ----------------------------------- | ------------------------------------ |
| [`../rebuild/LOWSPEC_RULES.md`](../rebuild/LOWSPEC_RULES.md) | **존재** (2026-07-16 thin redirect) | 8GB operator 치트시트 **entrypoint** |

상세 규칙은 LOWSPEC 본문에 재기술하지 않는다. 읽는 순서:

1. [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md) — heavy gate = GitHub CI
2. [`OPERATOR_GATES.md`](OPERATOR_GATES.md) — gate entry · hang 복구
3. [`CURSOR_AUTOPILOT.md`](CURSOR_AUTOPILOT.md) — Cursor 8GB 셋업

> **Errata 메모:** 과거 DNA 감사가 「`LOWSPEC_RULES.md` 없음」으로 기록한 경우가 있다. 디스크에는 redirect가 있다(`.cursorignore`로 Cursor Read가 막힐 수 있음). 「없음」을 근거로 파일을 새로 창작하지 말고 위 경로를 연다.

---

## 8. 한 줄 계약

**헌법 = 본 문서 · 실행 큐 = [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) only.**

---

## 9. 부록 — T8 운영자 감사 매트릭스 (2026-07-24)

> **모드:** 검증만 · 엔진/RPC/migration **diff 0**  
> **한 줄:** 헌법=`PLATFORM_CONSTITUTION` · 큐=`ACTIVE_WORK_SSOT` only  
> **엔진 확인:** `git diff --stat -- supabase/ packages/money packages/wallet-ledger packages/game-engine packages/trading-engine packages/sportsbook-engine` → **0 lines**

| ID       | 결함                            | 해소                                 | 실측 증거 (2026-07-24)                                                                                                                                                        | 판정       |
| -------- | ------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **C-01** | `UX_WRITING_GUIDE` 깨진 링크    | `COPYWRITING_CANON` retarget         | `docs/SSOT` 활성 인용 0 · DEMOLITION DELETE 이력만 · Constitution 정책 언급만                                                                                                 | **CLOSED** |
| **C-02** | generated SSOT 5파일 부재       | `generate:ssot-freeze-manifest` 복구 | `DISPLAY_DATA_CONTRACT` · `ROUTE_CANONICAL_REGISTRY` · `UI_INVENTORY` · `FREEZE_MANIFEST` · `ENGINE_INTEGRATION_PLAYBOOK` 전부 `Test-Path` True · size>0 · canon 링크 resolve | **CLOSED** |
| **C-03** | README 「듀얼」 vs 3통화 스키마 | README L3 정합                       | `PHON · USDT · KRW 3통화` · 「듀얼」 money-wallet 주장 0                                                                                                                      | **CLOSED** |
| **C-04** | Formula KRW 범위 불명           | §1.3-A 의도적 제외 절                | `{PHON, USDT}` assert · KRW Σ 확장 금지 · ADR-0006 `docs/ADR/0006-wallet-sigma-rule.md` 교차 참조                                                                             | **CLOSED** |
| **C-05** | DNA 「LOWSPEC 없음」 stale      | rule errata + §7 포인터              | `docs/rebuild/LOWSPEC_RULES.md` 존재 · `98-project-dna` errata · 재창작 금지                                                                                                  | **CLOSED** |
| **C-06** | 권한 분산 · Charter 발견 불가   | Constitution + 진입점 백링크         | `.cursorrules` · `AGENTS.md` · PRODUCT_PRINCIPLES · DESIGN_PRINCIPLES · POS · PRODUCT_EXPERIENCE_CANON · ENGINE_BOUNDARY = **7+** 「상위/Constitution」                       | **CLOSED** |

| 게이트 / 경계                   | 결과                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| 세션 진입점 Constitution 백링크 | `.cursorrules` L3 · `AGENTS.md` L3 — **PASS**                                              |
| ADR 경로                        | Engine Freeze·Wallet Σ = `docs/ADR/000X-*.md` only · `docs/PRODUCT/ADR/002-*` 오인용 **0** |
| 엔진 path diff                  | supabase/ · money · wallet-ledger · \*-engine — **0 lines**                                |
| 실행 큐 대체 여부               | Charter ≠ queue · ACTIVE_WORK 상단 Authority Charter 포인터 유지 — **PASS**                |

**Operator 사인오프 한 줄:** C-01~C-06 **전부 CLOSED** · 엔진 touch **0** · 헌법/큐 분리 **유지**.
