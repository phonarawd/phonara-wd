# Platform Audit KPI Dashboard (§40)

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> AI는 KPI를 문장으로 대체하지 않는다 — **숫자+enum만**.

| KPI                             |                                                       값 |
| ------------------------------- | -------------------------------------------------------: |
| Findings OPEN                   |                                                        1 |
| Findings APPROVED_FOR_IMPLEMENT |                                                        0 |
| Findings IN_PROGRESS            |                                                        0 |
| Findings INVESTIGATING          |                                                        0 |
| Findings VERIFYING              |                                                        0 |
| Findings VERIFIED_FIXED         |                                                       35 |
| Findings CLOSED                 |                                                        0 |
| Findings BLOCKED_DEP            |                                            1 (H-09 HIBP) |
| Findings UNVERIFIED             |                                                        0 |
| Severity CRITICAL               |                                                        4 |
| Severity HIGH                   |                                                       10 |
| Severity MEDIUM                 |                                                       22 |
| Evidence coverage %             |                             R0 complete · R1 Stage1 PASS |
| CI required jobs                |           quality green · sql red (pre-R1 · 별도 triage) |
| Runtime Stage1                  | PASS (R1 · 390/580/1455 · preview.phonara-web.pages.dev) |
| Runtime Stage2                  |                      R9 collected · R9-INSTALL-CTX fixed |
| Risks UNMITIGATED High+         |                                                        0 |
| Risks MITIGATED High            |                                     1 (RISK-BROWSER-MCP) |
| Risks ACCEPTED High             |                                                        4 |
| Rollback Trigger fires (24h)    |                                                        0 |
| SLO status                      |                                            **confirmed** |
| Incident open P0/P1             |                                                        0 |
| DR drill days since last        |                                                    never |
| Release candidate               |                                              **blocked** |
| R11 Freeze                      |                                               **ACTIVE** |
| R10 soak SOP                    |                                                 **DONE** |
| R12 PPR schedule                |                                           **registered** |
| Production normal               |                                          **pending_ppr** |

매 Close/PR 종료 시 YAML rollup으로 본 표를 갱신한다.
