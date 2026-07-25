# Environment Setup

## Required Local Values

```env
VITE_APP_NAME=PHONARA
VITE_APP_ENV=local
VITE_APP_URL=http://localhost:3000
VITE_SUPABASE_URL=https://yocjhjsdwoijfdrehzoq.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_DEFAULT_LOCALE=ko
VITE_SUPPORTED_LOCALES=ko,en
```

## Security Rules

- `.env` and `.env.local` are never committed.
- `VITE_` values are visible in the browser.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be added to frontend env.
- Missing env values should fail early with a clear message.

## Secrets / deploy deny (`check:secrets-deploy-deny`)

커밋·CI·Cloudflare Pages 업로드 전에 시크릿이 새지 않도록 기계적으로 잠근다.
구현: [`scripts/lib/secrets-deploy-deny.ts`](../scripts/lib/secrets-deploy-deny.ts) ·
CLI: `bun run check:secrets-deploy-deny` (`bun run check` · CI `quality` · `deploy:pages:*` 직전).

| 계층           | 검사                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A · 경로**   | `.env` / `.env.*`(단 `*.example`) · `setup/.env.secrets` · `.dev.vars` · `*.pem`/`*.p12`/`*.pfx`/`*.key` · `*credentials*.json` · E2E auth · `secrets.toml` — **git tracked면 FAIL** |
| **B · 본문**   | 실형태 `sbp_…` · JWT `role=service_role` · private key header · `ghp_`/`github_pat_` · `VITE_*SERVICE_ROLE*` · 실값 `SUPABASE_SERVICE_ROLE_KEY=`                                     |
| **C · dist**   | `bun run check:secrets-deploy-deny -- --dist` — `apps/*/dist` 동일 규칙 (`deploy-pages` 하드스톱)                                                                                    |
| **D · Cursor** | `.cursorignore` + `secrets-read-deny` hook — 로컬 시크릿 파일 인덱스/읽기 차단                                                                                                       |

**허용(잠그지 않음):** 공개 anon 키 · Supabase local demo anon JWT(`…CRXP1A7W…`) · placeholder(`YOUR_VALUE_HERE`, `sbp_your_…`, `your_*`).

**오탐 1건 예외:** 해당 라인에 `secrets-deploy-allow: <reason>` (값은 로그에 마스킹만 — 원문 출력 금지).

```powershell
bun run check:secrets-deploy-deny
bun run check:secrets-deploy-deny -- --dist
```

## Workspace hygiene (Cursor performance)

```bash
bun run clean    # after E2E, build sessions, or when IDE feels slow
```

Removes `dist/`, `test-results/`, `.vite/` caches, Playwright artifacts. See
`.cursor/rules/75-workspace-hygiene.mdc`. Restart Cursor after bulk cleanup or
`.cursorignore` changes.

## Confirmed Supabase Project

- URL: `https://yocjhjsdwoijfdrehzoq.supabase.co`
- Project ref: `yocjhjsdwoijfdrehzoq`

## Zero-touch stack (operator 손 0 · AI 자동)

에이전트/Cursor가 Supabase·Docker를 **자동**으로 준비합니다.

| 명령                           | 동작                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `bun run stack:push-remote`    | **원격 migration apply 정본** · `test:sql` green 후 · link 불필요  |
| `bun run stack:ensure`         | `.env` 생성 · PAT → `supabase login --token` · Management API 검증 |
| `bun run stack:ensure:full`    | 위 + **Docker Desktop 기동** + **`supabase start`**                |
| `bun run stack:supabase:login` | Supabase CLI 로그인만                                              |
| `bun run stack:docker`         | Docker daemon만                                                    |

#### 자동 트리거

- Cursor **세션 시작** → `stack:ensure --auth-only`
- **`test:e2e`** / **`test:sql`** 직전 → `stack:ensure --full` (Docker + local Supabase)

**최초 1회만** (이후 손 대지 않음): `.env` 또는 `setup/.env.secrets`에 `SUPABASE_ACCESS_TOKEN=sbp_…`  
(또는 예전에 `supabase login` 한 PC면 Windows 자격 증명에서 자동 sync)

Docker Hub `docker login`은 **불필요** — Supabase 로컬 이미지는 public pull.
