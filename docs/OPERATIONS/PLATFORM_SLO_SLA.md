# Platform SLO / SLA (§41 · §52)

> **기계 정본:** [`PLATFORM_SLO_SLA.yaml`](PLATFORM_SLO_SLA.yaml)  
> **수치 상태:** `confirmed` — operator chat grant 2026-07-13 (`confirmed_by: operator`)  
> **날짜:** 2026-07-13 · Playbook 1.0.0

## 필수 SLO (초안)

| SLO ID | 키 | 초안 | 비교 | 측정 |
| --- | --- | --- | --- | --- |
| SLO-WALLET-P95 | `wallet_api_p95_ms` | 800 | ≤ | Wallet API p95 (5m) |
| SLO-DEPOSIT-POST | `deposit_post_max_min` | 30 | ≤ | 입금 감지→잔액 반영 (분) |
| SLO-WITHDRAW-QUEUE | `withdraw_queue_max_min` | 120 | ≤ | Withdrawal queue 최대 지연 |
| SLO-TRADE-SUCCESS | `trade_success_rate_min` | 99.0 | ≥ | Trade 주문 성공률 % |
| SLO-SPORTS-ODDS | `sports_odds_stale_sec` | 120 | ≤ | Odds freshness (초) |

## Rollback Trigger 수치 (초안 · §20b)

| 키 | 초안 | 윈도우 | 액션 |
| --- | --- | --- | --- |
| `http_5xx_rate_pct_5m` | 2.0% | 5m | rail OFF / Known Good |
| `provider_timeout_rate_pct` | 5.0% | 15m | provider halt |
| `rpc_p95_ms` | 1500 | 5m | feature OFF 검토 |
| `money_delta_alarm` | alarm=true | immediate | **즉시** money rail halt |
| `wallet_error_burst_per_min` | 20 | 1m | wallet rail OFF |
| `permission_error_burst_per_min` | 10 | 1m | authz + freeze 검토 |

## 성능 예산 (R9)

| 키 | 초안 |
| --- | --- |
| `stage1_lcp_max_ms` | 3500 |
| `stage1_initial_js_kb` | 450 |

## Owner 확정 절차

1. AI 초안 검토 ([`PLATFORM_AUDIT_DECISION_LOG.md`](PLATFORM_AUDIT_DECISION_LOG.md) DL-R0-SLO).
2. Product + Runtime 역할 시차 서명 (RACI).
3. YAML `metrics_status: confirmed` · `confirmed_by` · `confirmed_at` 갱신.
4. 수치 변경 = Decision Log + playbook minor/major.

**규칙:** `TBD` / `X%` / “적절히” = Gate Block. soak 중 위반 = Trigger 후보 + Risk 갱신.
