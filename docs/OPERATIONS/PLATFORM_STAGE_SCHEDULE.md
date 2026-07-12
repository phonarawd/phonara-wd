# Platform Stage Schedule (§54)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> AI 낙관 추정 금지 — **병목(R9 전수 · R10 soak)** 명시.  
> 단위: 반나절 / 1일 / 2일+ (1인 operator · 8GB).

## Stage 예상 소요

| Stage | 내용 | 예상 | 병목 |
| --- | --- | --- | --- |
| **R0** | 기준선·통제 문서 | 1일 | Owner SLO 서명 |
| R1 | 공개 신뢰·머니 | 1–2일 | Browser Stage1 Landing |
| R2 | Wallet·Sports rails | 2일+ | provider/flag 5조건 |
| R3 | 보안 tranche a/b/c | 2일+ | migration Owner · CI sql |
| R4 | 시장·관측 스택 구축 | 2일+ | ADR-021 실행 · alert dry-fire |
| R5 | Admin 안전 | 1–2일 | RBAC Browser |
| R6 | 제품 정합 | 2일+ | surface 다수 |
| R7 | 타입·UI 수렴 | 2일+ | M-16 cast sweep |
| R8 | 배포 parity | 1일 | dirty deploy 0 |
| **R9** | Runtime Stage1→2 | **2일+** | **Browser MCP · 전수 매트릭스** |
| **R10** | 5조건·soak·rollback | **≥ 1일+24h soak** | **캘린더 구속** |
| R11 | Freeze · 3-Owner · 출시 후보 | 1일 | 시차 서명 |
| **R12** | Post Release 24h/72h/7d | **≥ 7일** | 리뷰 스케줄 |

## 캘린더 구속 (최소)

```text
R10 soak 24h
+ R12 24h / 72h / 7d reviews
≈ 최소 약 10일 (연속 캘린더)
```

R9 전 Browser MCP(`M-18`) NOT_AVAILABLE이면 Stage2 **진입 금지**.

## Standing Grant 세션 상한 (§11)

- Finding ≤ 3 / PR
- Stage **1개만**
- Domain 1개
- 비생성 파일 ≤ 12 · diff ≈ 500 lines
