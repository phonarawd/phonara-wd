# Platform Audit RACI (§48) — 1인 운영 겸임 정본

> **날짜:** 2026-07-13 · **Playbook:** 1.0.0  
> **전제:** 1인 operator가 Security / Runtime / Product Owner를 **겸임**할 수 있다 (규칙 50).  
> **AI는 어떤 결정에서도 A가 될 수 없다.**

## 결정 표

| 결정 | R (실행) | A (최종 책임·승인) | C (협의) | I (통보) |
| --- | --- | --- | --- | --- |
| Finding APPROVED_FOR_IMPLEMENT | AI / Domain Owner | **Product Owner** | Security (해당 시) | Runtime |
| Migration / RLS / GRANT | Domain + DB | **Security Owner** | Product · Runtime | AI |
| Release 승인 | AI (증거 패키지) | **3-Owner 전원** (§46) — 전원 A | Incident lead | All domain owners |
| Exception(§50) SOP 우회 | Requestor | **Security Owner + Product Owner** (공동 A) | Runtime | All |
| Freeze 해제 | Runtime | **Product Owner** | Security | AI |
| Production 정상 선언 | Runtime | **Product Owner (A)** + Security·Runtime 동의 | — | Stakeholders |
| SLO/Trigger 수치 확정 | AI (초안) | **Product Owner** + Runtime 동의 | Security | AI |
| Observability ADR 변경 | SRE / AI | **Runtime Owner** | Security · Product | AI |

## 1인 겸임 규칙 (non-waivable)

동일인이 Security / Runtime / Product를 겸임할 때:

1. **역할별 체크리스트 분리 서명** — 3-Owner Sign-off는 역할당 별도 체크리스트. 한 번의 “전부 승인” 클릭 = 무효.
2. **시차 서명** — Security 역할 서명과 Product 역할 서명 사이 **최소 1회 독립 세션**(또는 수 시간 간격).
3. **AI 교차 검증** — 겸임 서명 전 AI verifier가 역할 체크리스트 Evidence 링크 유효성 검증. 미비 = 서명 Block.
4. 겸임 사실·서명 시각은 [`PLATFORM_AUDIT_DECISION_LOG.md`](PLATFORM_AUDIT_DECISION_LOG.md)에 기록.

## 역할 ↔ Owner Matrix 키

| RACI 역할 | Matrix 키 (1인 겸임 시 동일 operator) |
| --- | --- |
| Product Owner | `product` |
| Security Owner | `security` |
| Runtime Owner | `sre` |
| Domain Owner | `earn` · `wallet` · `trade` · `sports` · `casino` · `admin` · `marketing` · `auth` · `platform` |

충돌 시 **본 RACI의 A가 Owner Matrix보다 우선**.
