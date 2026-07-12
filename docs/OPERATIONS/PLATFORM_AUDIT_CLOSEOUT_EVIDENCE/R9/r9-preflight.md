# R9 Preflight — Browser Stage1 착수 전 준비 (2026-07-13)

> **Plan todo:** `audit-r9-runtime-matrix` · **상태:** preflight only — Implement 미착수  
> **목적:** Stage1 Critical 8 × 390/580/1455 착수 **전** 에이전트가 자동으로 할 수 있는 준비 완료 기록

## 선행 게이트 (R8 → R9)

| Check | Result | Evidence / 다음 행동 |
| --- | --- | --- |
| `bun run cursor:status` | **PASS** | orphan 0 · E2E ports free · Docker OFF |
| `bun run check:deploy-parity` (local) | **PASS** | 4/4 — scripts · headers · manifest builder · lock |
| `bun run check:deploy-parity -- --remote` | **FAIL** | Web `/release-manifest.json` → SPA HTML fallback · Admin preview fetch failed |
| Browser MCP navigate preview `/` | **PASS** | `project-0-phonara-gb-playwright` ready · title `PHONARA \| Earn, Trade, Play` |
| Browser MCP `/release-manifest.json` | **FAIL** | SPA fallback (manifest 미배포) — R8 Evidence와 동일 |

### R9 진입 블로커 (operator 1회)

```text
1. git status clean (또는 의도된 변경만 커밋)
2. bun run deploy:pages:web:preview
3. bun run deploy:pages:admin:preview
4. bun run check:deploy-parity -- --remote   → green 필수
5. 채팅: Implement audit-r9-runtime-matrix per PLATFORM_AUDIT_TODO_HANDOFF.md — Browser MCP only
```

**SHA 불명 preview 캡처 = Evidence 무효** — remote manifest `releaseSha` + `gitDirty=false` 확인 후 Stage1 시작.

## 산출물 (본 세션)

| Artifact | Path | 상태 |
| --- | --- | --- |
| URL matrix SOT (124) | [`PLATFORM_RUNTIME_URL_MATRIX.json`](../../PLATFORM_RUNTIME_URL_MATRIX.json) | **READY** |
| URL validator | `bun run audit:runtime-urls` | **READY** |
| Stage1 matrix template | [`r9-stage1-matrix-template.md`](r9-stage1-matrix-template.md) | **READY** |
| Handoff §audit-r9 확장 | [`PLATFORM_AUDIT_TODO_HANDOFF.md`](../../PLATFORM_AUDIT_TODO_HANDOFF.md) | **READY** |

## Stage1 범위 (공식 매트릭스)

Critical 8 surface · viewport 390 · 580 · 1455 = **24 states** (surface당 3폭).

| # | Surface | App | Path | R1–R7 수시 Stage1 |
| --- | --- | --- | --- | --- |
| 1 | Landing | web | `/` | R1 PASS (재측정) |
| 2 | Home | web | `/home` | R6 vitest 대체 |
| 3 | Wallet | web | `/wallet` | R2-a PASS |
| 4 | Trade | web | `/trade` | R6 vitest 대체 |
| 5 | Sports | web | `/sports` | R2-c PASS |
| 6 | Casino | web | `/casino` | R6 vitest 대체 |
| 7 | Admin Dashboard | admin | `/` | R5 vitest 대체 |
| 8 | Settings | web | `/settings` | R6 vitest 대체 |

**R9가 최종 판정** — R1–R7 수시 PASS는 재측정만, Stage1 red면 Stage2 금지.

## 환경 (8GB)

| 항목 | 값 |
| --- | --- |
| System RAM | ~2252MB free / 7920MB (warn — headless-shell OK per Probe5) |
| MCP launcher | `scripts/run-playwright-mcp.cmd` + `playwright-mcp-8gb.json` |
| 정본 접속 | PR/preview SHA 일치 URL only — 수동 `dev:web` 금지 (G5) |

## Console advisory (preview `/` · 2026-07-13)

- `exchange_rate_snapshots` 401 — H-01 omit path (fail-closed) · synthetic proof 아님
- Cloudflare Insights CSP — advisory

## Next (Implement 세션)

1. Remote parity green 확인
2. Stage1 24 states Browser MCP 전수 (`r9-stage1-matrix-template.md` 채움)
3. Stage1 green → Stage2 124 URL + 768/1024/2560
4. `bun run closeout:todo -- audit-r9-runtime-matrix`
