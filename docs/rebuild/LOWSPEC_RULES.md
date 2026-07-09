# PHONARA 8GB — Operator 치트시트

> 처음 2~3일 자동화 체감 **~70%** — 정상. 숙련 후 **75~82%** 상한.
> **무거운 테스트 정본:** [`docs/SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) — **GitHub CI authoritative · 로컬 E2E/SQL 일상 금지**

---

## Day 0 (5분 · 1회)

1. **Cursor Settings:** Background Agents **Off** · Context **6k** · Inline Chat **On**
2. 터미널: `bun run cursor:render-fix` → Cursor **완전 종료**(트레이) → 재시작
3. 본 문서 + [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) 북마크 · §9 표 숙지

---

## §9 자연어 (복붙용)

| 말하면               | AI 행동                                            |
| -------------------- | -------------------------------------------------- |
| 오늘 작업 시작해줘   | preflight → env-doctor → Plan (**Implement 금지**) |
| 구현해줘             | 승인된 Plan 있을 때만 · `gate:ai-impl` 로컬 마감   |
| 렉 걸린 것 같아      | env-doctor → RAM/Docker 정리                       |
| 인터넷 느려          | Chat/Cmd+K · Composer 금지                         |
| 세션 끝내고 정리해줘 | session-end + hygiene                              |
| 상태만 알려줘        | cursor:status                                      |
| CI 확인해줘          | push/PR 후 GitHub Actions green 확인 안내          |

---

## 저사양 + CI 위임 (일상 정본)

```text
로컬:  gate:ai-impl · typecheck · lint  (Docker OFF)
Push:  git push → GitHub Actions
판정:  CI job green = Verified  (로컬 E2E/SQL red/green 무시)
```

| 구분                      | 로컬 PC                              | GitHub CI           |
| ------------------------- | ------------------------------------ | ------------------- |
| typecheck · lint · vitest | ✅ `gate:ai-impl`                    | ✅ quality job      |
| SQL 103 · db reset · Σ=0  | ❌ 위임                              | ✅ **sql** job      |
| Playwright E2E 15 spec    | ❌ 위임                              | ✅ **e2e** job      |
| Remote advisor 0 ERROR    | —                                    | ✅ **advisors** job |
| `stack:push-remote`       | migration touch 시만 (Docker 불필요) | —                   |

**FAIL:** 로컬 `test:e2e` / `test:sql` 반복 · CI red인데 DONE · Docker 상시 ON.

---

## 렉 / RAM / Docker

- **렉:** `bun run cursor:env-doctor` — RAM **<1GB**면 Chrome·Docker 정리 · `stack:stop`
- **인터넷/VPN:** Composer 금지 → Chat/Cmd+K · Context 6k 유지
- **Docker:** E2E/SQL **로컬 안 함** → Desktop **OFF** (`bun run stack:stop`)

---

## 작업 흐름 (1줄)

**Plan → operator 승인 → Implement → `gate:ai-impl` → push → CI green → DONE**

- surface **1개** · canonical route **1개**
- heavy gate (E2E/SQL/check:full) — **GitHub만** · operator 「gate 실행」= 선택 1회 advisory

---

## CI 확인 (push 후)

```powershell
gh run list --workflow=ci.yml --limit 3
gh run watch
```

또는 GitHub → **Actions** → **CI** → quality · sql · e2e · advisors 전부 green.

---

## RAM 16GB (P0 업그레이드)

16GB로 올리면 Docker 상시·Composer·로컬 heavy gate **선택 가능** — 8GB는 **CI 위임** 유지 권장.

---

교차: `.cursor/rules/89-beginner-autopilot.mdc` · `79-low-spec-pc.mdc` · [`OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md)
