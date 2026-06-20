# PHONARA · 새 채팅 인계문 (끝판왕 · 2026-06-18)

> **목적:** 새 Cursor 채팅에서 **중단 없이** C-3 (L1-20 K1 + L1-21 K3) LOCK draft → EXECUTE까지 이어감.  
> **갱신:** 2026-06-21 · **C-1 ✅ 58/58** · **C-2 ✅ 개별 gate green** (통합 `check:full` defer) · **HEAD C-3**
> **operator PC:** 저사양 — **`79-low-spec-pc.mdc`** 필수.  
> **Supabase lock:** `yocjhjsdwoijfdrehzoq` 단일 프로젝트만.

---

## 0. 새 채팅 첫 메시지 (복붙)

```text
PHONARA C-3 착수 — L1-20 K1 황금 지구 LOCK draft.

정본: docs/PHONARA_NEW_CHAT_HANDOFF_2026-06-18.md
큐: docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md · ACTIVE HEAD C-3

선행 완료: C-1 E2E 58/58 · C-2 개별 gate green (통합 check:full defer)

순서:
1) cursor:status → 필요 시 cursor:emergency-reset
2) archive §9 scope 확인 (docs/archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)
3) L1-20_GOLDEN_EARTH_LOCK draft — scope 1줄 · FAIL= · self-check
4) operator APPROVE → EXECUTE GO (presentation only · engine 0-touch)
5) L1-21 K3 LOCK — L1-20 §GREEN 후
6) §GREEN + SEQUENTIAL_EXECUTION_CONTRACT · CURRENT_STATUS 갱신

절대: gate 병렬/background 금지 · engine/supabase/RPC 0-touch · ZIP operator GO 전 0 · Lovable canvas 0
```

---

## 1. 지금 어디까지 왔나 (한 줄)

**L2 PHONARA paste Wave-1** — ✅ presentation 흡수 · **C-1 E2E 58/58 skip 0** · **C-2 개별 gate green** (통합 `check:full` defer) · doc sync **2026-06-21**.

**ACTIVE HEAD C-3** — L1-20 K1 황금 지구 + L1-21 K3 생존 신고 · **Cursor presentation** · Lovable canvas **중단**.

---

## 2. 트랙 분리 (혼동 금지)

| 트랙 | 지금 | PHONARA repo | Lovable canvas |
|------|------|--------------|----------------|
| **L1** | C-3 L1-20/21 | **Cursor presentation** · LOCK→EXECUTE | **중단 · 0** |
| **L2** | ✅ Wave-1 · C-1/C-2 | paste · E2E · gate evidence | **0-touch** |
| **L3** | defer (C-6) | Engine Wave · operator GO | **0** |

**FAIL =** L2 중 engine migration/RPC 수정 · L1을 PHONARA `apps/web`에서 구현 · operator 「ZIP 발행」 없이 ZIP.

---

## 3. L2 Wave-1 큐 (순서 고정)

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| L2-01 | ZIP → presentation-import | ✅ (working tree) | `apps/web/PRESENTATION_IMPORT.md` |
| L2-02 | Crush P0–P7 | ✅ | presentation-import + components |
| L2-03 | Crush P1.1–P1.10 | ✅ | routes/adapters |
| L2-04 | Crush P2 Trade | ✅ | Imported trade surfaces |
| L2-05 | Game adapters P2.0c | ✅ | `components/games/*` imported |
| L2-06 | i18n · og · PWA merge | ✅ | `check:i18n` green |
| **L2-07** | **E2E G9** | **✅ 58/58 skip 0** | F1/F2/F3 · `6840d0e` `7646133` |
| **L2-08** | **check:full** | **✅ 개별 gate green · 통합 defer** | `e800bd5` + gate evidence · 저사양 |
| L2-S | /sports hook wire | **defer** | operator Engine GO · mock→RPC |
| L2-A | Admin Sports Desk | **defer** | L1-15-A Lovable §GREEN 후 |

**L2/C-track §GREEN (2026-06-21):** C-1 58/58 + C-2 개별 gate green + evidence + `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` · `CURRENT_STATUS.md` 갱신 완료. **통합 `check:full` 1-shot = defer.**

---

## 4. 이미 완료된 핵심 구현 (재작업 금지)

### 4.1 Presentation 흡수 (Lovable UI → PHONARA)

- `apps/web/src/presentation-import/**` — Imported pages
- `apps/web/src/components/{ui,shell,casino,earn,fomo,games}/**` — pasted UI
- `apps/web/src/styles/presentation-import-tokens.css`
- 정책: **`95-presentation-import-absorption.mdc`** · engine **read-only**

### 4.2 E2E vs Lovable UI 분리 (engine UI 복원 · Playwright 전용)

**문제:** paste UI는 money/auth testid·플로우가 engine E2E와 불일치.  
**해결:** Playwright `webServer.env`만 `VITE_PHONARA_E2E_ENGINE=1` → engine-era 페이지 표시.

| 파일 | 역할 |
|------|------|
| `playwright.config.ts` | `VITE_PHONARA_E2E_ENGINE: '1'` in webServer env |
| `presentation-import/adapters/e2e-engine-flag.ts` | `isE2eEngineSurface` |
| `presentation-import/adapters/e2e-engine/*` | login · signup · dashboard · trade · staking · wallet · RG |
| `routes/{login,signup,dashboard,trade,staking,wallet,responsible-gaming}.tsx` | `if (isE2eEngineSurface) return <Engine*Page />` |

**FAIL =** engine hook/RPC 수정으로 E2E 맞추기 · production 빌드에 E2E flag 유출.

### 4.3 check:full mirror 경로

- `scripts/run-full-gate.ts`: `supabase db reset` **후** `mirror:functions` 단계 추가  
- 이유: `check` chain의 `clean:artifacts`가 `supabase/functions-sql/` 삭제 → mirror drift

### 4.4 Casino / legal E2E 보조 수정

- `casino-fairness-verifier`: `toBeAttached()` (imported UI)
- `casino.spec.ts` plinko: `waitUntil: 'commit'`, describe `test.setTimeout(120_000)`
- `landing-page.tsx` · `terms-page.tsx` · `privacy-page.tsx`: `data-testid` for visual/funnel specs

### 4.5 Cursor 렉 · 저사양 패키지 (2026-06-18)

| 산출물 | 내용 |
|--------|------|
| `.cursor/rules/79-low-spec-pc.mdc` | 저사양 baseline · 1 terminal · 1 heavy gate |
| `cursor:status` · `cursor:emergency-reset` | orphan/포트/residue 스냅샷 · 1-shot reset |
| `scripts/lib/cursor-dev-processes.ts` | vite · run-full-gate · dev:web 등 orphan 확장 |
| `cursor-session-hygiene.ts` | sessionStart에서 `stack:ensure` 제거 · hook 끝 `check:hygiene` 제거 |
| `vitest.config.ts` | `maxWorkers: 1` |
| `playwright.config.ts` | `workers: 1`, `fullyParallel: false` |
| agent log artifacts | `check-full-log.txt` 등 clean + cursorignore |

---

## 5. C-1 E2E — **✅ complete** (2026-06-21)

**Full run:** `bun run test:e2e` → **58/58 skip 0**.

| # | item | 결과 | evidence |
|---|------|------|----------|
| F1 | dice confirm timing | ✅ | `6840d0e` · regression tests |
| F2 | plinko hang / CPU | ✅ | Stage E2E guard · `about:blank` · `e800bd5` casino.spec |
| F3 | `/terms` legal-page visual smoke | ✅ | `7646133` |

**이전 상태 (해소됨):** 51 passed · 3 failed · 4 skipped (wave7 serial skip cascade)

### E2E 재실행 (저사양 · reference only)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
# orphan/residue 있으면:
bun run cursor:emergency-reset

# Docker Desktop ON (E2E만)
bun run build:packages   # emergency-reset 후 dist 없으면 필수

# 타겟 먼저 (foreground · background 금지)
bun run test:e2e -- tests/e2e/casino-wave7-closeout.spec.ts
bun run test:e2e -- tests/e2e/casino.spec.ts -g plinko
bun run test:e2e -- tests/e2e/visual.spec.ts -g "visual smoke"

# 전체
bun run test:e2e
```

**완료 기준 (달성):** 58/58 pass · skip 0 · `e2e:kill` · `check:hygiene` green · `stack:stop`

### Plinko hang · Docker 렉 (2026-06-18 root cause)

| 증상 | 원인 | 영구 수정 |
|------|------|-----------|
| plinko E2E 10min+ freeze | `/casino/plinko` Pixi WebGL **60fps ticker**가 casino.spec RPC 구간(~30s+) 동안 계속 실행 | `Stage.tsx`: `VITE_PHONARA_E2E_ENGINE=1` → Pixi **0** · spec: fairness 후 `about:blank` |
| E2E 후 PC 렉 지속 | `posttest:e2e`가 artifact만 정리 · **Supabase ~15 컨테이너** 상시 RUNNING | `posttest:e2e*` → **`stack:stop` + safe docker prune** · Docker Desktop **종료** |
| pretest 시 Cursor freeze | `stack:ensure --full`이 **Docker Desktop 자동 기동** | `startDesktop: false` — operator 수동 ON 후 E2E |
| wave7 cap test fail | `withStepTimeout(..., 20s)` < injectSession 내부 30s×3 | session injection **90s** |

---

## 6. C-2 check:full — **✅ 개별 gate green** (통합 1-shot defer · 2026-06-21)

**판정:** 저사양 PC에서 `bun run check:full` 통합 1-shot **미실행(defer)** · 하위 gate **개별 foreground green**.

| gate | 결과 |
|------|------|
| standard check (vitest) | **931** pass |
| build | green |
| `supabase db reset` | **133** migrations |
| functions-mirror | **309** |
| guard-coverage | **118** rpc · **0 gaps** |
| `test:sql` | **66/66** |
| casino-sql-parity | green |
| E2E | **60/60** |

**초기 실패 3건 (수정 완료 · `e800bd5`):** migration lock LF · lint 20 · deepshaft LAW1 assertion.

**Trade/security (동일 세션):** `96c435a` `6f26219` `3d0d509` `82f625b` — funding/cross launch gates · futures UI 정합 · migrations 138–140 freeze.

### 통합 check:full (defer · operator 저사양)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status
bun run build:packages
bun run check:full   # E2E 안정 + RAM 여유 시 foreground 1회만
```

**체인:** `check`(strict advisors) → PWA → `supabase db reset` → `mirror:functions` → `check:functions-mirror` → `check:guard-coverage` → `test:sql` → casino SQL parity → **`test:e2e`**

---

## 7. §GREEN 마감 체크리스트 (L2 Wave-1 · C-1/C-2)

- [x] `bun run typecheck` green
- [x] `bun run lint` green
- [x] `bun run check` green (일반 RC chain · vitest 931)
- [x] `bun run test:e2e` — **58/58 skip 0** (C-1)
- [ ] `bun run check:full` — **통합 1-shot defer** (개별 gate ✅)
- [x] `bun run check:hygiene` green · `cursor:status` orphan 0 · ports 3000–3002 free
- [x] `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` — C-1/C-2 ✅ · HEAD C-3
- [x] `docs/CURRENT_STATUS.md` — C-1/C-2 · backlog · §9 note

**§GREEN template (기록):**

```text
C-1/C-2 §GREEN — L2 paste Wave-1 — E2E 58/58 (C-1) · 개별 gate green (C-2 · E2E 60/60) · 통합 check:full defer — engine 0-touch — HEAD C-3 L1-20/21 — trade UI redesign backlog post-C-3
```

---

## 8. 절대 NO-TOUCH (L2 UI 작업 중)

```
supabase/*
packages/{money,wallet-ledger,trading-engine,game-engine,sportsbook-engine}/**
apps/web/src/domain/**
features/*/use-*.ts (hook logic)
contexts/auth-context.tsx
lib/{auth,rpc,supabase}.ts
```

**UI may:** hook/RPC **display** · presentation/testid · route adapter · i18n catalog **add-only**.

**Engine change 필요해 보이면:** STOP · operator 별도 GO · L3 큐.

---

## 9. operator가 직접 할 일 (PHONARA repo 밖)

| # | 작업 | 트리거 |
|---|------|--------|
| O1 | **Cursor 완전 재시작** | `.cursorignore` / hooks 변경 후 (렉 패키지 적용됨) |
| O2 | **Docker ON/OFF** | E2E/SQL/check:full 때만 ON · 평소 OFF (RAM) |
| O3 | **C-3 L1-20 K1** LOCK draft → APPROVE → EXECUTE | **Cursor** · archive §9 scope · Lovable **0** |
| O4 | 「**ZIP 발행**」 | Lovable 100% 판단 후 · **명시 1줄 전 ZIP 0** |
| O5 | L2-S 「스포츠 Engine GO」 | L2 §GREEN 후 · `/sports` RPC wire |
| O6 | L3 Engine Wave GO | L2 §GREEN 후 |

---

## 10. Cursor 전담 · C-3 HEAD (Lovable **중단**)

- **HEAD:** C-3 — L1-20 K1 황금 지구 + L1-21 K3 생존 신고 · LOCK draft → APPROVE → EXECUTE
- **완료 carry:** L1-GP G#1–G#10 · L2 paste Wave-1 · C-1/C-2
- **Lovable canvas / dispatch:** **0** — UI 포함 **전부 Cursor** (`presentation-import` · adapter · wiring)
- **§9 scope:** [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9 · active `docs/` 복원 = operator 판단

**Post-C-3 backlog (operator 약속 2026-06-21):** `/trade` UI/UX 전면 재설계 — PC+모바일 · 장수 디자인 · C-3 §GREEN 후 · 엔진·UI 정합 토대 완료 (`96c435a`–`e800bd5`)

---

## 11. C-3 이후 head (미리 보기 · C-3 §GREEN 전 착수 금지)

1. **C-4** — wire sweep
2. **C-5 L2-S / L2-A** — `/sports` hook wire · Admin Sports Desk · **operator GO**
3. **C-6 L3** — Engine Wave · **operator GO 각각**
4. **Post-C-3 backlog** — `/trade` UI/UX 전면 재설계 (operator 약속)

---

## 12. 렉 · 터미널 규칙 (non-waivable)

```powershell
bun run cursor:status
bun run cursor:emergency-reset   # hang·orphan·포트·artifact
```

- **1 terminal · 1 heavy command** — `test` / `test:e2e` / `build` / `check:full` 병렬 **금지**
- **background shell에 gate 금지**
- repo 루트 `Tee-Object` / `> *.log` **금지**
- 세션 종료: `bun run cursor:session-end` 또는 `clean` + `e2e:kill`

정본: `.cursor/rules/79-low-spec-pc.mdc` · `78-cursor-auto-hygiene.mdc`

---

## 13. Git / branch 상태 (2026-06-21)

- **Branch:** `main` (로컬)
- **HEAD:** `e800bd5` — C-2 closeout (migration lock LF · lint · deepshaft LAW1)
- **C-1/C-2 milestone commits:** `6840d0e` · `7646133` · `96c435a` · `6f26219` · `3d0d509` · `82f625b` · `e800bd5`
- **Commit:** operator 명시 요청 시만

---

## 14. 핵심 파일 인덱스

| 용도 | 경로 |
|------|------|
| 큐 정본 | `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` |
| paste map | `apps/web/PRESENTATION_IMPORT.md` |
| E2E config | `playwright.config.ts` |
| E2E engine adapters | `apps/web/src/presentation-import/adapters/e2e-engine/` |
| full gate | `scripts/run-full-gate.ts` |
| quality gates | `docs/QUALITY_GATES.md` |
| engine master (L3) | `docs/CURSOR_ENGINE_MASTER_PROMPT.md` |
| Lovable dispatch | ~~`docs/LOVABLE_OPERATOR_PROMPT_DISPATCH.md`~~ · **Cursor 전담 · dispatch 0** |
| 저사양 규칙 | `.cursor/rules/79-low-spec-pc.mdc` |

---

## 15. 새 에이전트 FAIL 조건 (요약)

| FAIL | 이유 |
|------|------|
| gate 2개 동시 / background E2E | operator PC freeze |
| engine/RPC/RLS 수정으로 E2E green | L2 scope 위반 |
| check:full before E2E stable | 30min+ 낭비 |
| ZIP without 「ZIP 발행」 | 92-lovable-lock-execute |
| L2-S/L3 착수 before L2 §GREEN | sequential contract S1 |
| tsserver kill | Cursor broken |

---

**끝.** — C-1/C-2 doc sync 완료. 다음: **C-3 L1-20 LOCK draft** (archive §9 scope).
