# E2E 저사양 실행 정본 (Operator Runbook)

> **규칙 정본:** `.cursor/rules/80-absolute-gate-prohibitions.mdc` · `79-low-spec-pc.mdc` · `77-e2e-lifecycle.mdc`  
> **본 문서:** 명령 매트릭스·실행 순서·복구만 — 규칙 재기술 금지 (drift 방지).

---

## 한 줄 원칙

```text
좁게 → 넓게 · 한 터미널 · 한 무거운 gate · foreground · teardown 필수
```

- **금지:** `playwright test` / `bunx playwright` / `dev:web`·`dev:admin` 수동 기동 (hook G5)
- **정본:** `bun run test:e2e*` → `scripts/run-e2e.ts` (teardown 3중: globalTeardown + wrapper + posttest)
- **Docker:** E2E/SQL **직전** `e2e:pretest`만 ON · **직후** `e2e:posttest` OFF (on-demand)

---

## 명령 매트릭스

| 목적                | 명령                                                  | webServer             | 비고                            |
| ------------------- | ----------------------------------------------------- | --------------------- | ------------------------------- |
| **타겟 UI** (권장)  | `bun run test:e2e:casino -- tests/e2e/<spec>.spec.ts` | web **3000만**        | admin 불필요 spec               |
| **Admin 포함 spec** | `bun run test:e2e -- tests/e2e/admin.spec.ts`         | web 3000 + admin 3001 | admin 테스트만                  |
| **전체 suite**      | `bun run test:e2e`                                    | web + admin           | CI/`check:full` — 로컬 최후 1회 |
| **Visual smoke**    | `bun run test:e2e:visual`                             | web + fixture         | `visual.spec.ts` only (P6)      |
| **카지노 preview**  | `bun run test:e2e:casino-smoke`                       | preview **3002**      | 빌드 preview                    |
| **스포츠 RPC**      | `bun run test:e2e:sports-engine`                      | **없음**              | UI/dev server 0                 |
| **포트 정리**       | `bun run e2e:kill`                                    | —                     | 3000–3002 LISTEN kill           |
| **RC 최종**         | `bun run check:full`                                  | full e2e 포함         | operator/CI 1회                 |

### lifecycle (자동)

모든 `test:e2e*`는 npm lifecycle으로 아래를 **한 번씩**만 실행:

| 단계     | 스크립트                 | 동작                                                      |
| -------- | ------------------------ | --------------------------------------------------------- |
| pretest  | `bun run e2e:pretest`    | orphan kill · `e2e:kill` · stack ON · packages build lock |
| test     | `tsx scripts/run-e2e.ts` | Playwright + signal teardown                              |
| posttest | `bun run e2e:posttest`   | `clean:artifacts` · `stack:stop` (Docker quit)            |

구현: `scripts/e2e-pretest.ts` · `scripts/e2e-posttest.ts` · `scripts/lib/e2e-lifecycle.ts`

---

## 저사양 실행 순서 (operator)

### 1. 세션 시작

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
```

residue·포트 점유 시:

```powershell
bun run cursor:emergency-reset
# 또는: bun run cursor:purge
```

### 2. 타겟 spec (일상)

```powershell
bun run test:e2e:casino -- tests/e2e/casino.spec.ts -g plinko
```

admin 필요 시:

```powershell
bun run test:e2e -- tests/e2e/admin.spec.ts
```

### 3. 종료 확인 (필수)

```powershell
bun run e2e:kill
bun run check:hygiene
bun run cursor:status
```

`[e2e] session finalized — ports free` · orphan 0 · `test-results/` 없음.

### 4. hang / Ctrl+C

1. Ctrl+C **1회** → `[e2e] session finalized` 대기
2. 포트 잔존 → `bun run e2e:kill`
3. Cursor 렉 → `bun run cursor:emergency-reset`
4. **새 터미널에서 재시작 전** 위 정리 완료 (G4)

---

## 연속 gate (E2E → SQL)

Docker cold boot 반복 방지 — **한 PowerShell 세션만**:

```powershell
$env:PHONARA_KEEP_STACK = "1"
bun run test:e2e:casino -- tests/e2e/wallet-d3.spec.ts
bun run test:sql
Remove-Item Env:PHONARA_KEEP_STACK
bun run stack:stop
```

`check:full`은 내부에서 `PHONARA_KEEP_STACK=1` 사용.

---

## Playwright 설정 (공통)

- **공유:** `playwright.shared.ts` — `workers:1` · `fullyParallel:false` · local Supabase URL
- **Pixi CPU:** `VITE_PHONARA_E2E_ENGINE=1` (WebGL ticker off)
- **packages:** `ensure-e2e-packages.ts` lock — web+admin **병렬 tsc 금지**

| config           | 파일                                 |
| ---------------- | ------------------------------------ |
| full (web+admin) | `playwright.config.ts`               |
| casino/target    | `playwright.casino.config.ts`        |
| visual smoke     | `playwright.visual.config.ts`        |
| preview smoke    | `playwright.casino-smoke.config.ts`  |
| sports RPC       | `playwright.sports-engine.config.ts` |

---

## Agent vs Operator vs CI

| 주체                       | E2E / SQL                                                             |
| -------------------------- | --------------------------------------------------------------------- |
| **Agent (자율)**           | **금지** (G13) — `gate:ai-impl` · typecheck/lint/check:hygiene만      |
| **Operator PC (8GB 일상)** | **실행 안 함** — **GitHub CI 위임**                                   |
| **Operator 「gate 실행」** | **단일** spec **1회** advisory (선택)                                 |
| **GitHub Actions CI**      | **authoritative** — `.github/workflows/ci.yml` **e2e** + **sql** jobs |

### CI E2E job (push/PR 자동)

- 명령: `bun run test:e2e -- --workers=1` (ubuntu · local Supabase · Chromium)
- Spec: `wallet-d3` (6) · `admin` (4) · `smoke/web` (5) = **15 tests**
- wrapper: `scripts/run-e2e.ts` → `PHONARA_E2E_ACTIVE=1`

상세: [`docs/SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)

---

## 자주 하는 실수

| 실수                                   | 결과            | 대안                    |
| -------------------------------------- | --------------- | ----------------------- |
| `test:e2e:casino` **전체** (spec 없이) | admin spec 실패 | `-- tests/e2e/...` 지정 |
| `dev:web` 켠 채 E2E                    | 3000 충돌       | E2E만 사용              |
| hang 후 새 터미널                      | orphan 2배 (G4) | `e2e:kill` → 재시도     |
| E2E 중 `check:full`                    | 30분+ 낭비 (G3) | 타겟 green 후 1회       |
| 로그 `> check-full-log.txt`            | watcher lag     | 터미널 출력만           |

---

## 교차 참조

- [`LOWSPEC_RULES.md`](LOWSPEC_RULES.md) — Cursor RAM·render·lag triage
- [`QUALITY_GATES.md`](../QUALITY_GATES.md) — E2E 도메인 매트릭스
- `.cursor/skills/gate-ladder/SKILL.md` — L6–L8 사다리
- `84-docker-on-demand.mdc` — Docker ON/OFF
