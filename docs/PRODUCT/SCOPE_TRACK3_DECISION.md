# SCOPE Track 3 — 제품 스코프 결정 (operator 서명 필수)

> **상태:** Draft · **operator 서명 대기**  
> **날짜:** 2026-07-09  
> **플랜:** `phonara_수렴_phase_0-4` · todo `phase-4-scope-doc`  
> **선행:** Phase 0 (lock/docs) · Phase 1 (feed 통일) · Phase 2 (사용 코인 UX) · Phase 3 (staking IA) **완료 후** 본 문서만  
> **엔진:** Apex **FULLY CLOSED** · 신규 migration / RPC / CLOB **본 Track 범위 밖**

---

## 1. 목적

PHONARA는 슈퍼앱 엔진(Earn · Wallet · Trade · Sports · Casino) + 거래소급 UI + PHON/USDT 이중정산을 한 제품에 겹쳐 둔 상태다.  
유저 기대(CLOB · 단일 피드 · 단일 통화)와 실제(house fill + oracle · Spot 피드 · bonus/real)의 갭은 **Phase 0~3 표현·IA 수렴**으로 완화했다.

**Track 3**은 그 다음 제품 스코프를 operator가 **서면으로** 고르는 결정 문서다.

| 주체               | 권한                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| **Agent / Cursor** | 본 문서 **초안 작성만** · 옵션 체크·서명·「Track 3 DONE」주장 **금지** |
| **Operator**       | 3a 또는 3c(또는 병행) **직접 체크 + 서명** 후에만 후속 구현 큐 착수    |

---

## 2. 확정 전제 (재검증 없음)

| 전제                                     | 근거                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| House fill + synthetic book + oracle     | [`ADR-005`](ADR/005-engine-wave-clob-defer.md) defer · Apex CLOSED |
| PG-less funding (L3 KRW + USDT on-chain) | [`ADR-001`](ADR/001-pg-less-funding-rails.md)                      |
| Phase 0~3 = 표현·IA·문서 수렴만          | Plan `phonara_수렴_phase_0-4` — 엔진 시그니처 변경 0               |
| 결제/PG는 Track 3 문제 정의 아님         | ADR-001 정본 · diagnosis `funding-trim`은 본 Track **미포함**      |

---

## 3. 옵션 상태 (Plan 고정)

| ID     | 옵션             | Plan 상태  | 한 줄                                                  |
| ------ | ---------------- | ---------- | ------------------------------------------------------ |
| **3a** | UI 다운스케일    | **활성**   | Trade / Sports / Casino 밀도·기능 축소 — **엔진 유지** |
| **3b** | 통화 단일화      | **비활성** | PHON/USDT → 단일 통화 — Apex CLOSED · 엔진 변경 필요   |
| **3c** | Vertical 분리    | **활성**   | pillar별 독립 출시 / 숨김 IA                           |
| **3d** | 엔진 재개 / CLOB | **비활성** | ADR-005 defer · 본 Plan 범위 밖                        |

**활성만 서명 대상.** 비활성(3b·3d)은 비교표에만 남기고, 본 Track에서 **선택·착수 금지**.

---

## 4. 옵션 상세

### 3a — UI 다운스케일 (**활성**)

**의미:** 엔진·RPC·정산 모델은 그대로 두고, 유저가 보는 밀도·고급 컨트롤·거래소급 chrome을 줄인다.

| 허용                                                             | 금지                               |
| ---------------------------------------------------------------- | ---------------------------------- |
| Trade/Sports/Casino surface 밀도 축소 · 고급 지표/도킹 접이·숨김 | 신규 migration · RPC 시그니처 변경 |
| Beginner language · disclosure 강화 (기존 canon 정렬)            | CLOB / 외부 체결 라우팅            |
| feature flag로 고급 패널 OFF (presentation)                      | PHON/USDT ledger 스키마 통합       |

**선행 수렴과의 관계:** Phase 1(기본 캔들+볼륨) · Phase 2(「사용 코인」)는 3a의 **부분 선반영**. Track 3 서명 후 남은 다운스케일 큐만 별도 Plan으로 쪼갠다.

### 3b — 통화 단일화 (**비활성**)

**의미:** 제품 전면을 USDT-only 또는 PHON-only로 보이게 하고, bonus/real·이중 stake를 제거/흡수.

| 이유 (비활성)                                          |                                       |
| ------------------------------------------------------ | ------------------------------------- |
| Apex **FULLY CLOSED**                                  | 엔진 구현 큐 0                        |
| PHON bonus/real · `margin_currency` / `stake_currency` | ledger·RPC·conservation 전면 재설계   |
| Phase 2                                                | UI 라벨 통일만 — 엔진 단일화 **아님** |

재개 조건(참고만): 별도 Engine Wave + operator RED STOP 해제 + Σ=0 증명 — **본 Track 서명으로 해제되지 않음**.

### 3c — Vertical 분리 (**활성**)

**의미:** Earn / Wallet / Trade / Sports / Casino를 **한 번에 전부 출시**하지 않고, pillar 단위로 출시·숨김·독립 마케팅 IA를 둔다.

| 허용                                                     | 금지                                                      |
| -------------------------------------------------------- | --------------------------------------------------------- |
| BottomNav / route manifest에서 pillar hide · soft-launch | 도메인 cross-embed (Earn에 Trade desk 등 — Phase R guard) |
| pillar별 Landing / onboarding 분기                       | `surface-domain-boundary` 위반 parallel surface           |
| Admin kill / feature flag로 vertical OFF                 | 엔진 vertical 삭제(스키마 DROP)                           |

**선행 수렴과의 관계:** Phase 3(`/staking` → Earn subnav)은 IA 경계 정리. 3c는 **출시 단위** 결정(어느 pillar를 먼저 열고 닫을지).

### 3d — 엔진 재개 / CLOB (**비활성**)

**의미:** synthetic book → real CLOB · 외부 유동성 · maker/taker 매칭.

| 이유 (비활성)                                  |                                                        |
| ---------------------------------------------- | ------------------------------------------------------ |
| [`ADR-005`](ADR/005-engine-wave-clob-defer.md) | Launch~L9 defer · Engine Wave + P4-D 승인 전 착수 금지 |
| 본 수렴 Plan                                   | 표현·IA·문서만 — CLOB **범위 밖**                      |

---

## 5. 비교표 (서명 전 필수 읽기)

| 기준                  | **3a** UI 다운스케일                    | **3b** 통화 단일화       | **3c** Vertical 분리               | **3d** CLOB/엔진 재개       |
| --------------------- | --------------------------------------- | ------------------------ | ---------------------------------- | --------------------------- |
| **UX 영향**           | 밀도↓ · 학습비용↓ · “거래소 같다” 기대↓ | 용어·잔액 단순화 (최대)  | 첫 방문 pillar 명확 · 슈퍼앱 체감↓ | 호가·체결 신뢰↑ (기대 정합) |
| **엔진 touch**        | **0** (presentation)                    | **대** (ledger/RPC)      | **0~소** (flag/IA만)               | **최대** (매칭·정산)        |
| **출시 리스크**       | 낮음 — 기능 숨김 회귀                   | 매우 높음 — conservation | 중 — hide 누락·딥링크              | 매우 높음 — 규제·유동성     |
| **operator 1인 운영** | 낮음 — UI Plan만                        | 높음 — 마이그레이션·감사 | 중 — pillar별 운영 창              | 최고 — 매칭·리스크 상시     |
| **Plan 상태**         | **활성**                                | 비활성                   | **활성**                           | 비활성                      |
| **서명 가능**         | **예**                                  | 아니오                   | **예**                             | 아니오                      |

**권장 조합 (참고 · 강제 아님):** 3a + 3c 병행 — 엔진 동결 유지하면서 밀도·출시 단위를 동시에 줄임.  
**금지 조합:** 3b 또는 3d를 본 Track 서명으로 “승인”하는 것.

---

## 6. 범위 밖 (스코프 추가 금지 · 보고만)

| 항목                                          | 처리                                            |
| --------------------------------------------- | ----------------------------------------------- |
| PG webhook / 상품권 hub trim (`funding-trim`) | ADR-001 optional · **별도** operator 결정       |
| Futures 전용 OI / fapi 피드                   | Phase 1 Spot 데스크만 통일 · Futures는 별도     |
| Casino `SpendCurrencySelector`                | Phase 2는 4표면만 (Spot/Futures/Staking/Sports) |
| `bet-hub-*` 레거시                            | 삭제/정리는 본 Track 밖                         |

---

## 7. Operator 서명란 (필수 · 에이전트 기입 금지)

아래는 **operator가 직접** 채운다. 빈칸·대리 서명으로 Track 3 완료 주장 = **FAIL**.

### 7.1 선택 (활성 옵션만)

```text
[PHONARA SCOPE Track 3]

선택 (하나 이상 · 활성만):
  ( ) 3a  UI 다운스케일 — Trade/Sports/Casino 밀도·기능 축소 · 엔진 유지
  ( ) 3c  Vertical 분리 — pillar별 독립 출시/숨김 IA
  ( ) 3a + 3c  병행

비활성 (체크 금지):
  ( ) 3b  통화 단일화 — 본 Track에서 선택 불가
  ( ) 3d  엔진 재개/CLOB — 본 Track에서 선택 불가

후속 구현:
  ( ) 별도 Cursor Plan 작성 후 착수 (권장)
  ( ) 기존 Phase R 큐에 흡수 (todo id 명시: ____________)
```

### 7.2 서명

```text
서명: ________________________
날짜: YYYY-MM-DD
비고: ________________________________________________
```

### 7.3 서명 후 상태 갱신 (operator 또는 서명 확인 세션만)

| 항목         | 서명 전               | 서명 후                                   |
| ------------ | --------------------- | ----------------------------------------- |
| 본 문서 상태 | **Draft · 서명 대기** | Accepted · 선택 ID 명시                   |
| 후속 코드    | **착수 금지**         | 선택(3a/3c)에 맞는 **신규 Plan**만        |
| 3b / 3d      | 비활성 유지           | 별도 Engine Wave ADR 없이 **여전히 금지** |

---

## 8. Agent closeout (본 todo)

| 항목                                         | 상태                                |
| -------------------------------------------- | ----------------------------------- |
| `docs/PRODUCT/SCOPE_TRACK3_DECISION.md` 생성 | `[x]` 2026-07-09                    |
| 3a / 3c **활성** · 3b / 3d **비활성** 명시   | `[x]`                               |
| 비교표 · 서명란                              | `[x]`                               |
| Operator 서명                                | `[ ]` **대기** — 에이전트 완료 불가 |
| Track 3 제품 결정 **Accepted**               | `[ ]` 서명 후만                     |

**본 todo(`phase-4-scope-doc`) Implemented:** 문서 초안 제출 · **Verified/DONE(제품 결정)는 operator 서명 후에만.**

---

## Links

- Plan: `phonara_수렴_phase_0-4` (Phase 0→4 순차)
- [`ADR-001`](ADR/001-pg-less-funding-rails.md) · [`ADR-005`](ADR/005-engine-wave-clob-defer.md)
- [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)
- [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md)
- [`REBUILD_PLAN_v1.md`](REBUILD_PLAN_v1.md)
