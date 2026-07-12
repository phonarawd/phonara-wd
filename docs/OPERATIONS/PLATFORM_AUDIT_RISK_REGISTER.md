# Platform Audit Risk Register (§33)

> **기계 정본:** [`PLATFORM_AUDIT_RISK_REGISTER.yaml`](PLATFORM_AUDIT_RISK_REGISTER.yaml)  
> Finding ≠ Risk. High+ `UNMITIGATED`/`OPEN`(Release 시점) = Gate Block.

| id | title | domain | severity | status | owner | expires | evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RISK-COMPLIANCE-SCOPEOUT | 법적/컴플라이언스 R11 scope-out | Ops | HIGH | ACCEPTED | product | 2026-10-13 | Stage schedule |
| RISK-LOAD-TEST-DEFER | 부하 테스트 R12+ | Ops | HIGH | ACCEPTED | sre | 2026-10-13 | SLO YAML |
| RISK-UNUSED-RPC-SURFACE | 미사용 RPC ~99 | Security | MEDIUM | OPEN | security | — | Audit §9.4 |
| RISK-SINGLE-REGION | 단일 리전 failover | Ops | HIGH | ACCEPTED | sre | 2026-10-13 | DR doc |
| RISK-DEP-OTEL | bun audit moderate otel | Ops | MEDIUM | OPEN | sre | — | R0 bun-audit |
| RISK-BROWSER-MCP | Browser MCP 부재 | Ops | HIGH | MITIGATED | sre | Probe5 CAPTURE_OK | browser-mcp-probe |
| RISK-OBS-STACK | 관측 스택 미구축 | Ops | HIGH | OPEN | sre | — | ADR-021 |
| RISK-PII-RETENTION | PII retention 정책 | Ops | MEDIUM | OPEN | product | — | — |

**status:** `OPEN` = 식별됨 · `UNMITIGATED` = 완화 불가 확인 · `MITIGATED` · `ACCEPTED`(서명+만료일).
