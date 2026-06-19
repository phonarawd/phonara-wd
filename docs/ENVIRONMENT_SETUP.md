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

| 명령 | 동작 |
|------|------|
| `bun run stack:ensure` | `.env` 생성 · PAT → `supabase login --token` · Management API 검증 |
| `bun run stack:ensure:full` | 위 + **Docker Desktop 기동** + **`supabase start`** |
| `bun run stack:supabase:login` | Supabase CLI 로그인만 |
| `bun run stack:docker` | Docker daemon만 |

**자동 트리거**

- Cursor **세션 시작** → `stack:ensure --auth-only`
- **`test:e2e`** / **`test:sql`** 직전 → `stack:ensure --full` (Docker + local Supabase)

**최초 1회만** (이후 손 대지 않음): `.env` 또는 `setup/.env.secrets`에 `SUPABASE_ACCESS_TOKEN=sbp_…`  
(또는 예전에 `supabase login` 한 PC면 Windows 자격 증명에서 자동 sync)

Docker Hub `docker login`은 **불필요** — Supabase 로컬 이미지는 public pull.
