# Platform Audit Owner Matrix (§34)

> **날짜:** 2026-07-13 · **Playbook:** 1.0.0  
> Finding YAML의 `owner` / `reviewer` / `security` / `db` / `runtime`는 **아래 키만** 사용.  
> 최종 승인 A = [`PLATFORM_AUDIT_RACI.md`](PLATFORM_AUDIT_RACI.md).

| Domain | Owner | Reviewer | Security | DB | Runtime |
| --- | --- | --- | --- | --- | --- |
| Earn | earn | product | security | db | sre |
| Wallet | wallet | product | security | db | sre |
| Trade | trade | product | security | db | sre |
| Sports | sports | product | security | db | sre |
| Casino | casino | product | security | db | sre |
| Admin | admin | security | security | db | sre |
| Marketing | marketing | product | security | db | sre |
| Auth | auth | security | security | db | sre |
| Platform | platform | product | security | db | sre |
| Security | security | product | security | db | sre |
| Ops | sre | product | security | db | sre |

## 1인 운영 매핑

| Matrix 키 | 담당 (겸임 가능) |
| --- | --- |
| product · security · sre · db · earn · wallet · trade · sports · casino · admin · marketing · auth · platform | **동일 operator** (역할별 체크리스트·시차 서명 필수) |

path는 Finding `owner_path`에만 기록한다.
