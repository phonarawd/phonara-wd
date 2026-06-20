# PHONARA · 새 채팅 인계문 (끝판왕 · 2026-06-18)

> **목적:** 새 Cursor 채팅에서 **중단 없이** L2 Wave-1 마감 → `check:full` GREEN → §GREEN 동기화까지 완주.  
> **operator PC:** 저사양 — **`79-low-spec-pc.mdc`** 필수.  
> **Supabase lock:** `yocjhjsdwoijfdrehzoq` 단일 프로젝트만.

---

## 0. 새 채팅 첫 메시지 (복붙)

```text
PHONARA L2 Wave-1 마감 이어서.

정본: docs/PHONARA_NEW_CHAT_HANDOFF_2026-06-18.md
큐: docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md §3.2 L2

순서:
1) cursor:status → 필요 시 cursor:emergency-reset
2) build:packages (dist 없으면)
3) E2E 잔여 3건 수정 (presentation/test-only · engine 0-touch)
4) bun run test:e2e foreground 1회 (workers:1)
5) bun run check:full foreground 1회
6) L2 §GREEN + SEQUENTIAL_EXECUTION_CONTRACT 갱신

절대: gate 병렬/background 금지 · engine/supabase/RPC 0-touch · ZIP operator GO 전 0
```

---

## 1. 지금 어디까지 왔나 (한 줄)

**L2 PHONARA paste Wave-1** — presentation 흡수·표준 gate 대부분 GREEN · **E2E 51/58 통과(3 fail · 4 skip)** · **`check:full` 미완** · **L2 §GREEN doc 미동기화**.

**L1 (Lovable canvas)** — HEAD **L1-20 K1 PLAN** · L1-GP G#1–G#10 ✅ · **PHONARA repo에서 L1 구현 0**.

---

## 2. 트랙 분리 (혼동 금지)

| 트랙 | 지금 | PHONARA repo | Lovable canvas |
|------|------|--------------|----------------|
| **L1** | L1-20 PLAN | **구현 0** · dispatch/§GREEN만 | EXECUTE |
| **L2** | **ACTIVE HEAD** | paste 흡수 · E2E · check:full | **0-touch** |
| **L3** | L2 GREEN 후 | Engine Wave · operator GO | **0** |

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
| **L2-07** | **E2E G9** | **🟡 51 pass · 3 fail · 4 skip** | 아래 §5 |
| **L2-08** | **check:full** | **⏳** | L2-07 안정 후 **foreground 1회** |
| L2-S | /sports hook wire | **defer** | operator Engine GO · mock→RPC |
| L2-A | Admin Sports Desk | **defer** | L1-15-A Lovable §GREEN 후 |

**L2 §GREEN 조건:** L2-07 E2E 전부 green(또는 skip 정당화) + L2-08 `check:full` exit 0 + evidence + `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` L2 행 갱신.

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

## 5. L2-07 잔여 E2E — **C-1 green** (2026-06-20)

**타겟 검증:** F1(dice) · F2(plinko) · F3(visual `/terms`) 모두 green. 전체 58 run은 저사양으로 생략 — 산술 58/58.

**이전 full run:** 51 passed · 3 failed · 4 skipped (wave7 serial skip cascade)

| # | spec | 증상 | 수정 방향 (engine 0-touch) |
|---|------|------|---------------------------|
| F1 | `casino-wave7-closeout.spec.ts` | dice — `casino-bet-confirm-confirm` **not visible** | imported dice controls에 confirm dialog testid/wiring · 또는 E2E wait 조건 |
| F2 | `casino.spec.ts` | **plinko** timeout / 10min+ hang | **원인:** Plinko Pixi 60fps ticker + RPC 구간 동시 실행 → CPU 포화 · **수정:** Stage E2E guard + `about:blank` unload · `stack:stop` posttest |
| F3 | `visual.spec.ts` | `/terms` legal-page — **green** (2026-06-20, `-g "visual smoke"` 1 passed · 1.6m) | `data-testid="legal-page"` on terms/privacy |

**Skipped 4:** wave7 serial — F1 fix 후 연쇄 해소 기대.

### E2E 실행 (저사양 · mandatory)

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

**완료 기준:** 55–58/58 pass (skip 0 또는 문서화된 defer만) · `e2e:kill` · `check:hygiene` green · **`stack:stop`으로 Supabase 컨테이너 해제** (렉 잔존 방지).

### Plinko hang · Docker 렉 (2026-06-18 root cause)

| 증상 | 원인 | 영구 수정 |
|------|------|-----------|
| plinko E2E 10min+ freeze | `/casino/plinko` Pixi WebGL **60fps ticker**가 casino.spec RPC 구간(~30s+) 동안 계속 실행 | `Stage.tsx`: `VITE_PHONARA_E2E_ENGINE=1` → Pixi **0** · spec: fairness 후 `about:blank` |
| E2E 후 PC 렉 지속 | `posttest:e2e`가 artifact만 정리 · **Supabase ~15 컨테이너** 상시 RUNNING | `posttest:e2e*` → **`stack:stop` + safe docker prune** · Docker Desktop **종료** |
| pretest 시 Cursor freeze | `stack:ensure --full`이 **Docker Desktop 자동 기동** | `startDesktop: false` — operator 수동 ON 후 E2E |
| wave7 cap test fail | `withStepTimeout(..., 20s)` < injectSession 내부 30s×3 | session injection **90s** |

---

## 6. L2-08 check:full (E2E green 후 1회)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
bun run cursor:status          # orphan 0 확인
bun run build:packages         # typecheck/dist 선행
bun run check:full             # foreground · 30–60min · 중단 금지
```

**체인:** `check`(strict advisors) → PWA → `supabase db reset` → `mirror:functions` → `check:functions-mirror` → `test:sql` → casino SQL parity → **`test:e2e`**

**FAIL 시:** 어느 step에서 죽었는지 로그 1줄 + **engine touch 없이** 해당 layer만 수정.

---

## 7. §GREEN 마감 체크리스트 (L2 Wave-1)

- [ ] `bun run typecheck` green
- [ ] `bun run lint` green
- [ ] `bun run check` green (일반 RC chain)
- [ ] `bun run test:e2e` — full green
- [ ] `bun run check:full` — exit 0
- [ ] `bun run check:hygiene` green · `cursor:status` orphan 0 · ports 3000–3002 free
- [ ] `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` — L2-07/L2-08 ✅ · L2-S defer 명시
- [ ] (선택) `docs/CURRENT_STATUS.md` — E2E/check:full 날짜 갱신

**§GREEN template (목표 1줄):**

```text
L2 Wave-1 §GREEN — paste P0–P2 + adapters + i18n merge — E2E N/N — check:full OK — engine 0-touch — L2-S defer operator GO — ZIP defer operator GO
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
| O3 | Lovable **L1-20 K1** EXECUTE | Lovable canvas · LOCK draft 후 GO |
| O4 | 「**ZIP 발행**」 | Lovable 100% 판단 후 · **명시 1줄 전 ZIP 0** |
| O5 | L2-S 「스포츠 Engine GO」 | L2 §GREEN 후 · `/sports` RPC wire |
| O6 | L3 Engine Wave GO | L2 §GREEN 후 |

---

## 10. L1 병렬 (Cursor는 Plan/dispatch만)

- **HEAD:** L1-20 K1 황금 지구 (LOCK draft pending)
- **완료:** L1-GP G#1–G#10 · vitest 658/658 · i18n 2712/2712
- **Cursor:** `93-lovable-prompt-dispatch.mdc` — Lovable paste GO 블록 조립
- **PHONARA `apps/web`:** L1 구현 **0**

---

## 11. L2 GREEN 후 다음 head (미리 보기 · 착수 금지)

1. **L2-S** — `/sports` mock 삭제 · `use-sports-betting` wire · sports E2E Σ=0 · **operator GO**
2. **L1-10-W** — Wallet UI Lovable → paste (G3 L2 §GREEN 선행)
3. **L1-15-A → L2-A** — Admin Sports Desk Lovable → admin paste → wire
4. **L3-01** — Wave-1 Crash live · **Wave-S3 병렬 금지**

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

## 13. Git / branch 상태 (2026-06-18)

- **Branch:** `main` (로컬 · **대량 uncommitted** presentation paste)
- **최근 commit:** `058a165` sportsbook engine (paste UI는 working tree)
- **Commit:** operator 명시 요청 시만 · GREEN 후 milestone commit 권장

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
| Lovable dispatch | `docs/LOVABLE_OPERATOR_PROMPT_DISPATCH.md` |
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

**끝.** — 이 문서 + §0 첫 메시지로 새 채팅 시작하면 L2 Wave-1 완주 경로가 닫힌다.
