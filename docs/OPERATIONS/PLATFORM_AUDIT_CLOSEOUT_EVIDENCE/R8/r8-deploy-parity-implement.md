# R8 — Deploy Parity (`audit-r8-deploy-parity`)

> **Stage:** R8 · **Plan todo:** `audit-r8-deploy-parity`  
> **Finding:** H-06  
> **Date:** 2026-07-13  
> **Command:** Implement per PLATFORM_AUDIT_TODO_HANDOFF.md  
> **dod_profile:** `type-hygiene`

## Finding touched

| Finding  | Fix summary                                                                                            | Gate                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **H-06** | dirty Pages deploy 금지 · Web/Admin `release-manifest.json` · `check:deploy-parity` · Admin `_headers` | `check:deploy-parity` local 4/4 · vitest 6/6 · advisors 0 ERROR · bun audit Critical 0 |

## Root cause / fix

| 필드           | 값                                                                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root cause** | `--commit-dirty=true`로 미커밋 트리를 preview에 올려 trust route(`/status`·ticket·leaderboard)가 작업 트리와 분리됨 · release identity(SHA/lock/ref) 미노출                                                                                                                                              |
| **Fix**        | `scripts/deploy-pages.ts`가 clean tree + `--commit-dirty=false` + `--commit-hash` 강제 · build 후 `release-manifest.json`(SHA·deploymentId·migrationLockHash·projectRef) 기록 · `check:deploy-parity`가 스크립트·헤더·manifest·lock·(옵션) remote/bun-audit/advisors 검증 · Admin `public/_headers` 추가 |

## Code owners

| Path                                        | Role                                     |
| ------------------------------------------- | ---------------------------------------- |
| `scripts/lib/release-manifest.ts`           | manifest SOT · lock hash · header tokens |
| `scripts/write-release-manifest.ts`         | dist stamp                               |
| `scripts/deploy-pages.ts`                   | clean SHA deploy wrapper                 |
| `scripts/check-deploy-parity.ts`            | R8 gate                                  |
| `apps/admin/public/_headers`                | Admin CSP·HSTS·frame-ancestors·nosniff   |
| `tests/scripts/release-manifest.test.ts`    | owner vitest                             |
| `tests/scripts/check-deploy-parity.test.ts` | package/script wiring                    |

## Gates (Implemented)

```text
bun run test -- tests/scripts/release-manifest.test.ts tests/scripts/check-deploy-parity.test.ts
  → 6/6 pass
bun run check:deploy-parity
  → PASS deploy-scripts · security-headers-files · manifest-builder · migrations-lock
bun run check:deploy-parity -- --bun-audit
  → Critical CVE 0 (moderate @opentelemetry/core only · RISK-DEP-OTEL)
bun run check:advisors
  → 0 ERROR (project yocjhjsdwoijfdrehzoq)
bun run check:engine-foundation-parity
  → missing on remote: 0 (local=239 · remote=239)
```

## Security headers Evidence

| Target                                         | Result                                               |
| ---------------------------------------------- | ---------------------------------------------------- |
| `apps/web/public/_headers`                     | CSP · HSTS · `frame-ancestors` · `nosniff` 토큰 존재 |
| `apps/admin/public/_headers`                   | 동일 토큰 (신규)                                     |
| `https://preview.phonara-web.pages.dev/` (GET) | **PASS** — CSP/HSTS/nosniff/frame OK (2026-07-13)    |
| Admin preview origin                           | Pages project/alias 준비 후 `--remote`로 재검증      |

## Remote SHA parity (R9 선행)

| Check                          | Result                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Web `/release-manifest.json`   | **PENDING** — 현재 SPA HTML fallback (manifest 미배포). **clean dual preview deploy 후** `check:deploy-parity -- --remote` 필수 |
| Admin `/release-manifest.json` | **PENDING** — preview origin/alias + clean deploy 후                                                                            |

**Release Gate:** dirty tree에서는 `deploy:pages:*`가 FAIL. R9 Stage1 전 `check:deploy-parity -- --remote` green 필수 (Web/Admin `releaseSha` 일치 · `gitDirty=false` · lock hash 일치).

## Manifest schema (H-06)

```json
{
  "schemaVersion": 1,
  "app": "web|admin",
  "releaseSha": "<40-hex>",
  "releaseShaShort": "<8-hex>",
  "deploymentId": "<string|null>",
  "branch": "main|preview",
  "migrationLockHash": "<sha256 of migrations.lock.json>",
  "projectRef": "yocjhjsdwoijfdrehzoq",
  "builtAt": "<ISO8601>",
  "gitDirty": false
}
```

## No Shortcut checklist

- [x] `--commit-dirty=true` 제거 · wrapper `commit-dirty=false`
- [x] dirty working tree → deploy FAIL
- [x] Web/Admin manifest 동일 스키마 · project ref lock
- [x] migration lock hash SOT
- [x] 보안 헤더 파일 + Web preview 응답 검증
- [x] advisor 실제 실행 0 ERROR
- [x] bun audit Critical 0 (R0 재스캔)
- [ ] Remote Web/Admin SHA parity — **clean preview deploy 후** (R9 블로커로 유지)

Finding status: **H-06 → VERIFIED_FIXED** (control plane · deploy path)  
**R9 진입 조건:** `bun run check:deploy-parity -- --remote` green

NEXT Implement: **`audit-r9-runtime-matrix`** (remote parity green 후).
