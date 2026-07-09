# Phase D — operator 출시 관문 (turnkey prep · operator confirm)

> **정본:** operator 출시 관문 runbook (`gate:phase-d` · manifest) — 구 `RELEASE_ROADMAP.md`는 2026-07-04 삭제 (git history) · 현행 실행 큐 = Phase R 플랜 P13  
> **선행:** Phase R green — `bun run gate:phase-r` → `gate-manifest/phase-r-manifest.json` `releaseReady: true`  
> **AI 역할:** runbook·스크립트·헬스 RPC 준비만 — **launchReady/D1~D7 완료 주장 금지**  
> **operator 역할:** 외부 행위 수행 후 `--confirm-d*` 플래그로 manifest에 증거 기록

---

## 한 줄 명령 (automated prep)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run gate:phase-d
```

출력: `gate-manifest/phase-d-manifest.json` — commit SHA · `prepReady` · `launchReady` · 단계별 `pass|fail|skip|operator_pending`.

**금지:** AI가 `--confirm-d*` 없이 `launchReady: true` 주장 · manifest JSON repo 커밋 · gate 병렬/background (G1).

---

## 선행 조건 (§0)

| 항목    | 확인                                                                                      |
| ------- | ----------------------------------------------------------------------------------------- |
| Phase R | `bun run gate:phase-r` green · `gate-manifest/phase-r-manifest.json` `releaseReady: true` |
| P0/P1   | Release Risk Matrix 잔존 0 (master plan)                                                  |
| `.env`  | `SUPABASE_ACCESS_TOKEN` (remote layer) · `SUPABASE_SERVICE_ROLE_KEY` (edge verify)        |

```powershell
bun run gate:phase-r
bun run gate:phase-d
```

Phase R manifest 없으면 `phaseRPrerequisite` = **fail** (의도적 — 순서 강제).

---

## D1~D7 operator 체크리스트

### §1 D1 — Anon key rotate (`anonKeyRotate`)

공개 저장소·CI 로그·스크린샷 등에 **노출됐을 수 있는** anon key를 rotate한다.

1. Supabase Dashboard → **Project Settings → API** → **Rotate anon key**
2. Cloudflare Pages / 배포 env 갱신:
   - `VITE_SUPABASE_ANON_KEY` (web)
   - admin 동일 anon (별도 env 파일)
3. 로컬 `.env` / `.env.local` 갱신 (`.env.example` placeholder 유지)
4. web/admin 재배포 후 smoke: `/login` · wallet read-only
5. **구 service role key는 rotate하지 않음** (서버 전용 · 브라우저 미노출)

완료 후:

```powershell
bun run gate:phase-d -- --confirm-d1
```

---

### §2 D2 — CI 새 레포 이전 + full E2E authoritative (`ciMigration`)

로컬 green ≠ 출시 authoritative. **CI(또는 격리 runner)** 에서 Phase R ladder 1회 green.

1. 새 private repo / CI org에 monorepo push (secret: `SUPABASE_ACCESS_TOKEN` · E2E env)
2. CI job (단일 job · 순차):

```powershell
bun run gate:phase-r
# artifact: gate-manifest/phase-r-manifest.json
```

3. `test:e2e` full suite green (master plan: ~171 spec · pwa-install/push 포함)
4. CI artifact로 manifest + playwright-report 보존 (repo 커밋 금지)

완료 후:

```powershell
bun run gate:phase-d -- --confirm-d2
```

---

### §3 D3 — 프로덕션 Supabase 분리 + RLS (`prodSupabaseSeparation`)

| 항목        | 정본                                                               |
| ----------- | ------------------------------------------------------------------ |
| Project ref | **`yocjhjsdwoijfdrehzoq` only** (`20-supabase-safety`)             |
| 로컬        | `supabase start` · `127.0.0.1:54321` · seed/E2E 전용               |
| 원격 apply  | **`bun run stack:push-remote` only** — raw `db push` 금지          |
| RLS         | remote advisor **0 ERROR** · `grants_rls_inventory_test.sql` green |

확인:

```powershell
bun run stack:push-remote
bun run check:advisors
# gate:phase-d 가 remoteProdLayer + securityAdvisor 자동 검증
```

로컬 `.env`에 prod service role을 web Vite에 넣지 않았는지:

```powershell
rg "VITE_.*SERVICE" apps/web apps/admin
# 0 matches
```

완료 후:

```powershell
bun run gate:phase-d -- --confirm-d3
```

---

### §4 D4 — Kill switch · 출금승인 운영 리허설 (`killSwitchRehearsal`)

**로컬 Game Day (권장 1회):**

```powershell
bun run gameday:drill
# 또는 gate:phase-d -- --run-gameday
```

**프로덕션 admin 실제 리허설 (operator 1회):**

1. Admin → Operations: `system_halt` ON → 유저 deposit/bet/withdraw 차단 확인 → OFF 복구
2. Admin → Queues: 테스트 출금 **approve** 1건 · **reject** 1건 · audit row + Σ=0
3. Runbook: [`RUNBOOK.md`](../RUNBOOK.md) §1 · §4

E2E 증거 (operator/CI):

```powershell
bun run test:e2e -- tests/e2e/admin.spec.ts -g "Phase C"
```

완료 후:

```powershell
bun run gate:phase-d -- --confirm-d4
```

---

### §5 D5 — 백업 · 롤백 (`backupRehearsal`)

**로컬 rehearsal (Docker Supabase running):**

```powershell
bun run rehearsal:backup
# → backups/local-rehearsal-*.sql · backups/last-rehearsal.json
```

**원격 (Supabase Pro):**

- Dashboard → Database → Backups / PITR 활성 확인
- Runbook [`RUNBOOK.md`](../RUNBOOK.md) §3 — 복구 RTO/RPO operator 메모

```powershell
bun run gate:phase-d -- --run-backup
# 또는 완료 후
bun run gate:phase-d -- --confirm-d5
```

---

### §6 D6 — 관측 · 모니터링 · DR (`observabilityDr` · `ops-observability` · `h6-scale`)

**자동 prep (gate:phase-d):**

- `rpc_ops_health_summary` / reconciliation (remote)
- `bun run stack:verify-worldno1-edge` — cron edge 6종 + JWT gate
- `bun run stack:smoke-pg-webhook-hmac` — PG webhook HMAC path (no Supabase JWT) · P0 edge closeout

**operator 연결 (Dashboard/외부):**

| 신호                  | 경로                                          |
| --------------------- | --------------------------------------------- |
| Ops health            | Admin Overview · `rpc_get_ops_health()`       |
| Alerts                | `admin/alerts` · `ops_alerts` inbox           |
| Edge cron             | Supabase → Edge Functions → logs              |
| Load smoke (optional) | `bun run load-smoke` (local REST concurrency) |

```powershell
bun run stack:verify-worldno1-edge
bun run stack:smoke-pg-webhook-hmac
bun run gate:phase-d -- --run-load-smoke   # optional · local stack 필요
bun run gate:phase-d -- --confirm-d6       # 알림/대시보드 연결 완료 후
```

교차: [`RUNBOOK.md`](../RUNBOOK.md) Admin Overview 카드 · Scenario 1~8.

---

### §7 D7 — 합법성 · KYC/AML · RG (`legalCompliance`)

**AI/코드 범위 밖 — operator·법무 결정.**

- [ ] 서비스 jurisdiction · 라이선스 요건
- [ ] KYC/AML 정책 · STR 프로세스 ([`RUNBOOK.md`](../RUNBOOK.md) §5)
- [ ] Responsible gaming ([`RUNBOOK.md`](../RUNBOOK.md) §6)
- [ ] 이용약관/개인정보 최종 검토 (`/terms` · `/privacy`)

```powershell
bun run gate:phase-d -- --confirm-d7
```

---

## CLI 플래그

| 플래그                          | 용도                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `--manifest=<path>`             | 출력 경로 (기본 `gate-manifest/phase-d-manifest.json`)     |
| `--phase-r-manifest=<path>`     | Phase R manifest 경로                                      |
| `--run-backup`                  | `rehearsal:backup` 실행 (로컬 · destructive restore drill) |
| `--run-gameday`                 | `gameday:drill` 실행 (로컬 kill switch/Σ=0)                |
| `--run-load-smoke`              | `load-smoke` (로컬 stack)                                  |
| `--skip-edge`                   | `stack:verify-worldno1-edge` 생략                          |
| `--confirm-d1` … `--confirm-d7` | operator 완료 표시 (외부 증거 후에만)                      |

**전체 operator confirm (D1~D7 모두 완료 후 1회):**

```powershell
bun run gate:phase-d -- --confirm-d1 --confirm-d2 --confirm-d3 --confirm-d4 --confirm-d5 --confirm-d6 --confirm-d7
```

---

## Manifest schema

```json
{
  "commit": "<full SHA>",
  "commitShort": "<7-char>",
  "branch": "<name>",
  "startedAt": "<ISO>",
  "finishedAt": "<ISO>",
  "totalDurationMs": 0,
  "prepReady": true,
  "launchReady": false,
  "phaseRPrerequisite": {
    "path": "gate-manifest/phase-r-manifest.json",
    "releaseReady": true,
    "commitShort": "abc1234"
  },
  "steps": {
    "phaseRPrerequisite": { "status": "pass", "durationMs": 0, "owner": "automated" },
    "anonKeyRotate": {
      "status": "operator_pending",
      "durationMs": 0,
      "owner": "operator",
      "runbookSection": "§1 Anon key rotate"
    }
  }
}
```

| 필드               | 의미                                                      |
| ------------------ | --------------------------------------------------------- |
| `prepReady`        | automated 단계 전부 pass/skip · fail 없음                 |
| `launchReady`      | D1~D7 포함 **전 step pass** (operator `--confirm-*` 포함) |
| `operator_pending` | runbook 절차 미완 — AI가 pass 처리 **금지**               |

- **CI:** `gate-manifest/` artifact upload (repo 커밋 금지).

---

## 출시 판정

```text
Phase A~S + R green (code)
  AND phase-d-manifest prepReady
  AND operator D1~D7 confirm → launchReady: true
  = 출시 가능 (operator 최종 GO)
```

P0/P1 잔존 시 **출시 금지** — Phase D confirm과 무관.

---

## 교차 참조

- Phase R: [`PHASE-R-GATE-RUNBOOK.md`](PHASE-R-GATE-RUNBOOK.md)
- 야간 인시던트: [`RUNBOOK.md`](../RUNBOOK.md)
- E2E 저사양: [`E2E-LOWSPEC-RUNBOOK.md`](E2E-LOWSPEC-RUNBOOK.md)
- 원격 apply: `.cursor/rules/96-prod-apply-agent-deny.mdc`
